import type { VercelRequest, VercelResponse } from '@vercel/node';
import { redact } from '../src/core/redactor.ts';

export const config = {
  maxDuration: 15,
};

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const SYSTEM_INSTRUCTION =
  'Provide a crisp, 2-sentence executive summary highlighting key group consensus, action items, and pending blockers. Use only facts present in the messages. Do not invent names, numbers, dates or tasks. If the messages are too unclear, reply exactly: UNCLEAR.';

// In-memory per-IP rate limiter (best-effort across serverless instances)
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();

export function _resetRateLimits(): void {
  rateLimitMap.clear();
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= 8) {
    return false;
  }
  entry.count++;
  return true;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // 1. Method validation
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method Not Allowed', summary: null });
    return;
  }

  // 2. Origin check: If Origin header exists, host must match Request Host
  const originHeader = req.headers['origin'];
  const hostHeader = req.headers['host'];
  if (originHeader) {
    const originStr = Array.isArray(originHeader) ? originHeader[0] : originHeader;
    try {
      const originHost = new URL(originStr).host;
      if (!hostHeader || originHost !== hostHeader) {
        res.status(403).json({ error: 'Forbidden: origin mismatch', summary: null });
        return;
      }
    } catch {
      res.status(403).json({ error: 'Forbidden: malformed origin', summary: null });
      return;
    }
  }

  // 3. Rate limiting (max 8 requests / minute per IP)
  const xForwardedFor = req.headers['x-forwarded-for'];
  const ip =
    (typeof xForwardedFor === 'string'
      ? xForwardedFor.split(',')[0].trim()
      : Array.isArray(xForwardedFor)
      ? xForwardedFor[0].split(',')[0].trim()
      : req.socket?.remoteAddress) || '127.0.0.1';

  if (!checkRateLimit(ip)) {
    res.status(429).json({ error: 'Too Many Requests', summary: null });
    return;
  }

  // 4. Request body size check (max 16 KB)
  const contentLength = req.headers['content-length'];
  if (
    contentLength &&
    parseInt(Array.isArray(contentLength) ? contentLength[0] : contentLength, 10) > 16384
  ) {
    res.status(400).json({ error: 'Payload Too Large', summary: null });
    return;
  }

  let body: any = req.body;
  if (typeof body === 'string') {
    if (body.length > 16384) {
      res.status(400).json({ error: 'Payload Too Large', summary: null });
      return;
    }
    try {
      body = JSON.parse(body);
    } catch {
      res.status(400).json({ error: 'Invalid JSON', summary: null });
      return;
    }
  }

  // 5. Body payload validation: { lines: string[] }
  const lines = body?.lines;
  if (!Array.isArray(lines) || lines.length < 1 || lines.length > 40) {
    res.status(400).json({ error: 'Lines must be an array of 1 to 40 strings', summary: null });
    return;
  }

  let totalChars = 0;
  for (const line of lines) {
    if (typeof line !== 'string' || line.length > 300) {
      res.status(400).json({
        error: 'Each line must be a string of at most 300 characters',
        summary: null,
      });
      return;
    }
    totalChars += line.length;
  }

  if (totalChars > 6000) {
    res.status(400).json({
      error: 'Total lines exceed 6000 characters',
      summary: null,
    });
    return;
  }

  // 6. Defense in depth: Server-side re-redaction before forwarding
  const sanitizedLines = lines.map((line: string) => redact(line));

  // 7. API key check
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server configuration error', summary: null });
    return;
  }

  // 8. Call Gemini with 10s AbortController timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const upstreamRes = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: sanitizedLines.join('\n') }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 160,
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      }),
      signal: controller.signal,
    });

    if (!upstreamRes.ok) {
      res.status(502).json({ error: 'Upstream gateway error', summary: null });
      return;
    }

    const data: any = await upstreamRes.json();
    const rawText =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text ?? '')
        .join('')
        .trim() || '';

    // Strip markdown formatting characters
    const cleanText = rawText.replace(/[*_`#]/g, '').trim();

    if (!cleanText || /^UNCLEAR\.?$/i.test(cleanText) || cleanText.split(/\s+/).length > 70) {
      res.status(200).json({ summary: null });
      return;
    }

    res.status(200).json({ summary: cleanText });
  } catch {
    res.status(502).json({ error: 'Upstream request timeout or failure', summary: null });
  } finally {
    clearTimeout(timeoutId);
  }
}
