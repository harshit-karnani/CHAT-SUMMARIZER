import { describe, it, expect } from 'vitest';
import { extractDeadlines } from '../src/core/dates';

describe('extractDeadlines', () => {
  const refTs = new Date(2026, 9, 14, 10, 0, 0).getTime(); // Oct 14, 2026, 10:00 AM

  it('detects tomorrow with contextual forward instant', () => {
    const matches = extractDeadlines('Please review this by tomorrow 5pm', refTs);
    expect(matches.length).toBeGreaterThan(0);
    const date = new Date(matches[0].dueAt);
    expect(date.getDate()).toBe(15);
    expect(date.getHours()).toBe(17);
  });

  it('handles EOD defaults to 18:00', () => {
    const matches = extractDeadlines('Send reports by EOD', refTs);
    expect(matches.length).toBeGreaterThan(0);
    const date = new Date(matches[0].dueAt);
    expect(date.getHours()).toBe(18);
    expect(date.getMinutes()).toBe(0);
  });

  it('detects ordinal day format', () => {
    const matches = extractDeadlines('Deployment set for 18th', refTs);
    expect(matches.length).toBeGreaterThan(0);
    const date = new Date(matches[0].dueAt);
    expect(date.getDate()).toBe(18);
  });

  it('ignores conversational words like "may" or "now"', () => {
    const matches = extractDeadlines('We may need to discuss this right now', refTs);
    expect(matches.length).toBe(0);
  });

  it('returns empty array when text has no date hints', () => {
    const matches = extractDeadlines('Sounds great, let us sync later', refTs);
    expect(matches.length).toBe(0);
  });
});
