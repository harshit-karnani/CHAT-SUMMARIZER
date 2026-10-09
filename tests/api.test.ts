import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import handler, { _resetRateLimits } from '../api/summarize';
import type { VercelRequest, VercelResponse } from '@vercel/node';

function createMockRes() {
  const res: Partial<VercelResponse> & {
    _status: number;
    _json: any;
    _headers: Record<string, string>;
  } = {
    _status: 200,
    _json: null,
    _headers: {},
    status(code: number) {
      this._status = code;
      return this as VercelResponse;
    },
    json(data: any) {
      this._json = data;
      return this as VercelResponse;
    },
    setHeader(key: string, value: string) {
      this._headers[key] = value;
      return this as VercelResponse;
    },
  };
  return res as unknown as VercelResponse & {
    _status: number;
    _json: any;
    _headers: Record<string, string>;
  };
}

describe('api/summarize proxy handler', () => {
  const originalEnv = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    _resetRateLimits();
    process.env.GEMINI_API_KEY = 'test-server-api-key';
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalEnv;
  });

  it('rejects non-POST requests with 405 Method Not Allowed', async () => {
    const req = {
      method: 'GET',
      headers: {},
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);

    expect(res._status).toBe(405);
    expect(res._headers['Allow']).toBe('POST');
    expect(res._json?.summary).toBeNull();
  });

  it('rejects origin mismatch with 403 Forbidden', async () => {
    const req = {
      method: 'POST',
      headers: {
        origin: 'https://malicious-site.com',
        host: 'catchupzero.vercel.app',
      },
      body: { lines: ['Hello team'] },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);

    expect(res._status).toBe(403);
    expect(res._json?.summary).toBeNull();
  });

  it('allows matching origin and host', async () => {
    const req = {
      method: 'POST',
      headers: {
        origin: 'https://catchupzero.vercel.app',
        host: 'catchupzero.vercel.app',
      },
      body: { lines: ['Alice: We will launch tomorrow.'] },
    } as unknown as VercelRequest;
    const res = createMockRes();

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'Team agreed to launch tomorrow with full consensus.' }] } }],
      }),
    } as Response);

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json?.summary).toBe('Team agreed to launch tomorrow with full consensus.');
    expect(fetchSpy).toHaveBeenCalled();
  });

  it('returns 500 when GEMINI_API_KEY is missing from environment', async () => {
    delete process.env.GEMINI_API_KEY;

    const req = {
      method: 'POST',
      headers: {},
      body: { lines: ['Alice: Let us proceed.'] },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);

    expect(res._status).toBe(500);
    expect(res._json?.summary).toBeNull();
  });

  it('validates request body: rejects missing or empty lines with 400', async () => {
    const req = {
      method: 'POST',
      headers: {},
      body: { lines: [] },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);

    expect(res._status).toBe(400);
    expect(res._json?.summary).toBeNull();
  });

  it('validates request body: rejects lines over 40 count', async () => {
    const lines = Array.from({ length: 41 }, (_, i) => `Line ${i}`);
    const req = {
      method: 'POST',
      headers: {},
      body: { lines },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);

    expect(res._status).toBe(400);
  });

  it('validates request body: rejects individual line > 300 chars or total > 6000 chars', async () => {
    const req = {
      method: 'POST',
      headers: {},
      body: { lines: ['a'.repeat(301)] },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);

    expect(res._status).toBe(400);
  });

  it('enforces request body size limit of 16 KB', async () => {
    const req = {
      method: 'POST',
      headers: {
        'content-length': '20000',
      },
      body: { lines: ['test'] },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);

    expect(res._status).toBe(400);
  });

  it('applies server-side defense-in-depth redaction before forwarding to Gemini', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'Credentials were saved securely.' }] } }],
      }),
    } as Response);

    const sensitiveLine = 'my number is +91 98765 43210, otp 482913, password: hunter2';
    const req = {
      method: 'POST',
      headers: {},
      body: { lines: [sensitiveLine] },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(fetchSpy).toHaveBeenCalled();

    const callBody = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
    const forwardedText = callBody.contents[0].parts[0].text;
    expect(forwardedText).not.toContain('hunter2');
    expect(forwardedText).not.toContain('98765 43210');
    expect(forwardedText).toContain('[REDACTED]');
  });

  it('handles upstream Gemini error by returning 502', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const req = {
      method: 'POST',
      headers: {},
      body: { lines: ['Alice: Hello world'] },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);

    expect(res._status).toBe(502);
    expect(res._json?.summary).toBeNull();
  });

  it('returns summary: null when Gemini responds with UNCLEAR', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'UNCLEAR' }] } }],
      }),
    } as Response);

    const req = {
      method: 'POST',
      headers: {},
      body: { lines: ['Alice: ???'] },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json?.summary).toBeNull();
  });

  it('rate limits requests exceeding 8 per minute per IP with 429', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'Summary result' }] } }],
      }),
    } as Response);

    const ip = '203.0.113.195';

    for (let i = 0; i < 8; i++) {
      const req = {
        method: 'POST',
        headers: { 'x-forwarded-for': ip },
        body: { lines: ['Update line'] },
      } as unknown as VercelRequest;
      const res = createMockRes();
      await handler(req, res);
      expect(res._status).toBe(200);
    }

    // 9th request must be rejected with 429
    const req9 = {
      method: 'POST',
      headers: { 'x-forwarded-for': ip },
      body: { lines: ['Update line'] },
    } as unknown as VercelRequest;
    const res9 = createMockRes();
    await handler(req9, res9);

    expect(res9._status).toBe(429);
    expect(res9._json?.summary).toBeNull();
  });
});
