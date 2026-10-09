const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const SYSTEM = 'Provide a crisp, 2-sentence executive summary highlighting key group consensus and pending blockers. Use only facts present in the messages. Do not invent names, numbers, dates or tasks. If the messages are too unclear to summarize, reply exactly: UNCLEAR.';

export async function geminiSummarize(
  lines: string[],
  apiKey: string,
  timeoutMs = 10000
): Promise<string | null> {
  if (!apiKey || lines.length === 0) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: 'user', parts: [{ text: lines.join('\n') }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 160, thinkingConfig: { thinkingBudget: 0 } },
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? '').join('').trim();
    if (!text || /^UNCLEAR\.?$/i.test(text) || text.split(/\s+/).length > 70) return null;
    return text.replace(/[*_`#]/g, '');
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
