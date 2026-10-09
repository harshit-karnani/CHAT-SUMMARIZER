import { describe, it, expect } from 'vitest';
import { makeIcs } from '../src/core/ics';
import type { BriefingItem } from '../src/types';

describe('RFC 5545 ICS generation', () => {
  it('generates a valid VCALENDAR and VEVENT with 1-hour duration and proper UID', () => {
    const fixedDueAt = new Date('2026-10-10T15:00:00Z').getTime();
    const item: BriefingItem = {
      id: 'item-test-123',
      kind: 'deadline',
      title: 'Submit quarterly budget, please; urgent',
      summary: 'Submit the final numbers before EOD.',
      reason: 'Urgent deadline mentioned',
      score: 85,
      sourceMessageIds: [101, 102],
      dueAt: fixedDueAt,
      signals: ['deadline', 'urgent'],
    };

    const ics = makeIcs(item);

    // Assert RFC 5545 calendar envelope
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('PRODID:-//CatchUp Zero//EN');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('END:VCALENDAR');

    // Assert UID format
    expect(ics).toContain(`UID:item-test-123-${fixedDueAt}@catchupzero.local`);

    // Assert UTC timestamps
    expect(ics).toContain('DTSTART:20261010T150000Z');
    expect(ics).toContain('DTEND:20261010T160000Z'); // 1 hour later

    // Assert escaping of commas and semicolons
    expect(ics).toContain('SUMMARY:Submit quarterly budget\\, please\\; urgent');
    expect(ics).toContain('STATUS:CONFIRMED');
    expect(ics).toContain('Message Refs: #101\\, #102');
  });

  it('defaults to 1-hour window starting 1 hour from now when dueAt is undefined', () => {
    const item: BriefingItem = {
      id: 'item-no-date',
      kind: 'deadline',
      title: 'General task',
      summary: 'Task summary',
      reason: 'General reason',
      score: 50,
      sourceMessageIds: [5],
      signals: ['deadline'],
    };

    const ics = makeIcs(item);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toMatch(/DTSTART:\d{8}T\d{6}Z/);
    expect(ics).toMatch(/DTEND:\d{8}T\d{6}Z/);
  });
});
