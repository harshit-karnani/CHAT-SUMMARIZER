import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  maxDuration: 5,
};

export default function handler(_req: VercelRequest, res: VercelResponse): void {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    status: 'healthy',
    service: 'SplitOff Executive Briefing Engine',
    model: 'gemini-2.5-flash',
    version: '1.0.0',
    mode: 'hybrid-privacy-gated',
    timestamp: new Date().toISOString(),
  });
}
