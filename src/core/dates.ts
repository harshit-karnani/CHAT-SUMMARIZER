import * as chrono from 'chrono-node';

export interface DeadlineMatch {
  dueAt: number;
  matchedText: string;
}

export function extractDeadlines(text: string, refTs: number): DeadlineMatch[] {
  if (!text || !text.trim()) return [];

  const refDate = new Date(refTs);
  const results: DeadlineMatch[] = [];
  const coveredRanges: [number, number][] = [];

  const isCovered = (start: number, end: number) =>
    coveredRanges.some(([s, e]) => Math.max(s, start) < Math.min(e, end));

  // 1. Check for ordinal patterns like "on 14th", "by 14th", "14th"
  const ordinalRegex = /\b(?:(?:on|by)\s+)?(\d{1,2})(?:st|nd|rd|th)\b/gi;
  let ordMatch: RegExpExecArray | null;
  while ((ordMatch = ordinalRegex.exec(text)) !== null) {
    const day = parseInt(ordMatch[1], 10);
    if (day >= 1 && day <= 31) {
      const matchIndex = ordMatch.index;
      const matchEnd = matchIndex + ordMatch[0].length;
      
      const targetDate = new Date(refDate);
      targetDate.setDate(day);
      targetDate.setHours(18, 0, 0, 0);

      // If day has already passed in this month, forward to next month
      if (targetDate.getTime() < refDate.getTime()) {
        targetDate.setMonth(targetDate.getMonth() + 1);
      }

      results.push({
        dueAt: targetDate.getTime(),
        matchedText: ordMatch[0],
      });
      coveredRanges.push([matchIndex, matchEnd]);
    }
  }

  // 2. Chrono parse with forwardDate
  const parsed = chrono.parse(text, refDate, { forwardDate: true });

  for (const p of parsed) {
    const startIdx = p.index;
    const endIdx = p.index + p.text.length;

    if (isCovered(startIdx, endIdx)) continue;

    const hasDay = p.start.isCertain('day') || p.start.isCertain('weekday');
    const hasTime = p.start.isCertain('hour') || p.start.isCertain('minute');

    // Ignore month words used as ordinary words ("may", "march")
    const lower = p.text.trim().toLowerCase();
    if ((lower === 'may' || lower === 'march') && !hasDay && !hasTime) {
      continue;
    }

    // Ignore matches that have neither a day nor a time-of-day signal
    if (!hasDay && !hasTime) {
      continue;
    }

    const d = p.date();
    let dueAt = d.getTime();
    let matchedText = p.text;

    // Check if followed by EOD e.g. "Friday EOD"
    const afterMatch = text.slice(endIdx, endIdx + 10);
    const eodAfter = afterMatch.match(/^\s+EOD\b/i);
    if (eodAfter) {
      const adjusted = new Date(dueAt);
      adjusted.setHours(18, 0, 0, 0);
      dueAt = adjusted.getTime();
      matchedText = `${p.text}${eodAfter[0]}`;
      coveredRanges.push([startIdx, endIdx + eodAfter[0].length]);
    } else {
      coveredRanges.push([startIdx, endIdx]);
    }

    results.push({ dueAt, matchedText });
  }

  // 3. Standalone / Bare EOD ("EOD", "by EOD") -> 18:00 same day
  const eodRegex = /\b(?:(?:by)\s+)?EOD\b/gi;
  let eodMatch: RegExpExecArray | null;
  while ((eodMatch = eodRegex.exec(text)) !== null) {
    const startIdx = eodMatch.index;
    const endIdx = startIdx + eodMatch[0].length;

    if (!isCovered(startIdx, endIdx)) {
      const sameDay18 = new Date(refDate);
      sameDay18.setHours(18, 0, 0, 0);

      results.push({
        dueAt: sameDay18.getTime(),
        matchedText: eodMatch[0],
      });
      coveredRanges.push([startIdx, endIdx]);
    }
  }

  return results;
}
