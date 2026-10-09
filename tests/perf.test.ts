import { describe, it, expect } from 'vitest';
import { parseChat } from '../src/core/parser';
import { buildBriefing } from '../src/core/briefing';
import type { UserContext } from '../src/types';

describe('Performance benchmark', () => {
  it('parses, triages, and builds briefing for 10,000 messages in under 3 seconds', () => {
    // Generate 10,000 realistic synthetic chat messages
    const senders = ['Alice Smith', 'Bob Jones', 'Charlie Brown', 'Kabir Sharma', 'Diana Prince'];
    const lines: string[] = [];

    const baseDate = new Date('2026-05-01T08:00:00Z').getTime();

    for (let i = 0; i < 10000; i++) {
      const msgDate = new Date(baseDate + i * 60000); // 1 min apart
      const day = String(msgDate.getUTCDate()).padStart(2, '0');
      const month = String(msgDate.getUTCMonth() + 1).padStart(2, '0');
      const year = msgDate.getUTCFullYear();
      const hours = String(msgDate.getUTCHours()).padStart(2, '0');
      const minutes = String(msgDate.getUTCMinutes()).padStart(2, '0');
      const sender = senders[i % senders.length];

      let text = 'Hey everyone, just checking in on the sprint progress.';
      if (i % 25 === 0) {
        text = 'Can you review this pull request by tomorrow 5pm?';
      } else if (i % 50 === 0) {
        text = 'Kabir, can you check the server logs?';
      } else if (i % 100 === 0) {
        text = 'We agreed to deploy the new release on Friday.';
      }

      lines.push(`${day}/${month}/${year}, ${hours}:${minutes} - ${sender}: ${text}`);
    }

    const rawExport = lines.join('\n');

    const startTime = performance.now();

    // 1. Parse
    const parsed = parseChat(rawExport);
    expect(parsed.messages.length).toBe(10000);

    // 2. Setup user context for last 500 messages unread slice
    const unreadTimestamp = parsed.messages[9500].ts;
    const userCtx: UserContext = {
      me: 'Kabir Sharma',
      aliases: ['Kabir', 'kabi'],
      lastReadAt: unreadTimestamp,
    };

    // 3. Triage + Briefing
    const briefing = buildBriefing(parsed, userCtx);

    const elapsedMs = performance.now() - startTime;

    expect(briefing.items.length).toBeGreaterThan(0);
    // Spec requires under 3s
    expect(elapsedMs).toBeLessThan(3000);
  });
});
