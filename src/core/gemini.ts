export async function summarize(lines: string[], timeoutMs = 12000): Promise<string | null> {
  if (!lines || lines.length === 0) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines }),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || typeof data.summary !== 'string') return null;
    return data.summary.trim() || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export { summarize as geminiSummarize };
