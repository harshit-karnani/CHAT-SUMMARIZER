import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { geminiSummarize } from '../src/core/gemini';

describe('geminiSummarize', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns null on empty key or empty lines without calling fetch', async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    expect(await geminiSummarize([], 'test-key')).toBeNull();
    expect(await geminiSummarize(['Alice: Hello'], '')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns clean summary on successful response', async () => {
    const sampleOutput = 'Team agreed to deploy on Friday. Kabir is blocked on API credentials.';
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: `**${sampleOutput}**` }],
            },
          },
        ],
      }),
    });

    const result = await geminiSummarize(['Alice: Let us launch Friday', 'Kabir: Need API key'], 'test-key');
    expect(result).toBe(sampleOutput);
  });

  it('returns null on non-200 HTTP response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: { message: 'API key not valid' } }),
    });

    const result = await geminiSummarize(['Alice: Hey'], 'bad-key');
    expect(result).toBeNull();
  });

  it('returns null when model responds UNCLEAR', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: 'UNCLEAR.' }],
            },
          },
        ],
      }),
    });

    const result = await geminiSummarize(['Alice: ???'], 'test-key');
    expect(result).toBeNull();
  });

  it('returns null when model responds with too many words (> 70 words)', async () => {
    const longText = new Array(75).fill('word').join(' ');
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: longText }],
            },
          },
        ],
      }),
    });

    const result = await geminiSummarize(['Alice: Some talk'], 'test-key');
    expect(result).toBeNull();
  });

  it('returns null on timeout / abort error', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('The operation was aborted'));

    const result = await geminiSummarize(['Alice: Timeout test'], 'test-key', 50);
    expect(result).toBeNull();
  });
});
