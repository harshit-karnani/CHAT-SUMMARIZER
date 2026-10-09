import type { BriefingItem } from '../types';

function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

export function makeIcs(item: BriefingItem): string {
  const now = new Date();
  const dtstamp = formatIcsDate(now);

  const startMs = item.dueAt ?? now.getTime() + 3600 * 1000;
  const startDate = new Date(startMs);
  const endDate = new Date(startMs + 60 * 60 * 1000); // 1-hour duration

  const dtstart = formatIcsDate(startDate);
  const dtend = formatIcsDate(endDate);

  const uid = `${item.id}-${startMs}@catchupzero.local`;
  const summary = escapeIcsText(item.title);
  const description = escapeIcsText(
    `${item.summary}\n\nSignals: ${item.signals.join(', ')}\nReason: ${item.reason}\nMessage Refs: #${item.sourceMessageIds.join(', #')}`
  );

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CatchUp Zero//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcs(item: BriefingItem): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const icsContent = makeIcs(item);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const safeTitle = item.title.slice(0, 24).replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `catchup-${safeTitle || item.id}.ics`;

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
