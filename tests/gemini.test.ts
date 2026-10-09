import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { summarize, geminiSummarize } from '../src/core/gemini';

describe('client summarize (/api/summarize)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns null on empty lines without calling fetch', async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    expect(await summarize([])).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns clean summary on successful response from /api/summarize', async () => {
    const sampleOutput = 'Team agreed to deploy on Friday. Blockers cleared.';
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ summary: sampleOutput }),
    });

    const result = await summarize(['Alice: Launch Friday']);
    expect(result).toBe(sampleOutput);
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/summarize', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines: ['Alice: Launch Friday'] }),
    }));
  });

  it('returns null on non-200 HTTP response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ summary: null }),
    });

    const result = await summarize(['Alice: Launch Friday']);
    expect(result).toBeNull();
  });

  it('returns null when server responds with summary: null', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ summary: null }),
    });

    const result = await summarize(['Alice: ???']);
    expect(result).toBeNull();
  });

  it('returns null on abort / timeout error without throwing', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('The operation was aborted'));

    const result = await summarize(['Alice: Slow response'], 50);
    expect(result).toBeNull();
  });

  it('geminiSummarize alias works identically', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ summary: 'Alias summary works.' }),
    });

    expect(await geminiSummarize(['Line 1'])).toBe('Alias summary works.');
  });
});
