import { unzipSync, strFromU8 } from 'fflate';
import { ParseError } from '../types';
import type { Message, ParsedChat } from '../types';

const ANDROID_REGEX =
  /^(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:[\s\u202f]*[apAP]\.?[mM]\.?)?)\s*-\s*(.*)$/;

const IOS_REGEX =
  /^\[(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:[\s\u202f]*[apAP]\.?[mM]\.?)?)\]\s*(.*)$/;

const MEDIA_PLACEHOLDERS =
  /^(<media omitted>|media omitted|<image omitted>|image omitted|<sticker omitted>|sticker omitted|<video omitted>|video omitted|<audio omitted>|audio omitted|<document omitted>|document omitted|this message was deleted|you deleted this message|null)$/i;

const SYSTEM_PHRASES_REGEX =
  /\b(?:added|removed|left|joined|changed|created group|security code changed|end-to-end encrypted)\b/i;

interface HeaderMatch {
  dateStr: string;
  timeStr: string;
  remainder: string;
  format: 'android' | 'ios';
}

function matchHeader(line: string): HeaderMatch | null {
  const cleanLine = line.replace(/^\uFEFF/, '').replace(/[\u200e\u200f\u202f]/g, '').trim();
  const iosMatch = cleanLine.match(IOS_REGEX);
  if (iosMatch) {
    return {
      dateStr: iosMatch[1],
      timeStr: iosMatch[2],
      remainder: iosMatch[3],
      format: 'ios',
    };
  }
  const androidMatch = cleanLine.match(ANDROID_REGEX);
  if (androidMatch) {
    return {
      dateStr: androidMatch[1],
      timeStr: androidMatch[2],
      remainder: androidMatch[3],
      format: 'android',
    };
  }
  return null;
}

function parseTime(timeStr: string): { hours: number; minutes: number; seconds: number } {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:[\s\u202f]*([apAP])\.?[mM]\.?)?$/i);
  if (!match) return { hours: 0, minutes: 0, seconds: 0 };

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = match[3] ? parseInt(match[3], 10) : 0;
  const ampm = match[4] ? match[4].toLowerCase() : null;

  if (ampm === 'p' && hours < 12) hours += 12;
  if (ampm === 'a' && hours === 12) hours = 0;

  return { hours, minutes, seconds };
}

function parseTimestamp(dateStr: string, timeStr: string, dateOrder: 'dmy' | 'mdy'): number {
  const parts = dateStr.split(/[\/.-]/).map((p) => parseInt(p, 10));
  if (parts.length < 3) return Date.now();

  const [p1, p2, p3] = parts;
  const year = p3 < 100 ? 2000 + p3 : p3;
  const day = dateOrder === 'dmy' ? p1 : p2;
  const month = dateOrder === 'dmy' ? p2 : p1;

  const { hours, minutes, seconds } = parseTime(timeStr);
  return new Date(year, month - 1, day, hours, minutes, seconds).getTime();
}

function detectDateOrder(lines: string[]): { dateOrder: 'dmy' | 'mdy'; format: 'android' | 'ios' } {
  let anyFirstAbove12 = false;
  let anySecondAbove12 = false;
  let androidCount = 0;
  let iosCount = 0;

  for (const line of lines) {
    const match = matchHeader(line);
    if (!match) continue;

    if (match.format === 'ios') iosCount++;
    else androidCount++;

    const parts = match.dateStr.split(/[\/.-]/).map((p) => parseInt(p, 10));
    if (parts.length >= 2) {
      if (parts[0] > 12) anyFirstAbove12 = true;
      if (parts[1] > 12) anySecondAbove12 = true;
    }
  }

  const dateOrder: 'dmy' | 'mdy' = anyFirstAbove12 ? 'dmy' : anySecondAbove12 ? 'mdy' : 'dmy';
  const format: 'android' | 'ios' = iosCount > androidCount ? 'ios' : 'android';
  return { dateOrder, format };
}

export function parseChat(rawText: string): ParsedChat {
  if (!rawText || !rawText.trim()) {
    throw new ParseError('The chat export file is empty.');
  }

  const lines = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const { dateOrder, format } = detectDateOrder(lines);

  const messages: Message[] = [];
  const sendersSet = new Set<string>();

  for (const rawLine of lines) {
    const cleanedLine = rawLine.replace(/[\u200e\u200f]/g, '');
    const headerMatch = matchHeader(cleanedLine);

    if (headerMatch) {
      const ts = parseTimestamp(headerMatch.dateStr, headerMatch.timeStr, dateOrder);
      const colonIdx = headerMatch.remainder.indexOf(': ');

      let sender = 'system';
      let text = headerMatch.remainder.trim();
      let isSystem = true;

      const potentialSender = colonIdx !== -1 ? headerMatch.remainder.slice(0, colonIdx).trim() : '';
      const isSystemByPhrase = colonIdx !== -1 && SYSTEM_PHRASES_REGEX.test(potentialSender);

      if (colonIdx !== -1 && !isSystemByPhrase) {
        sender = potentialSender;
        text = headerMatch.remainder.slice(colonIdx + 2).trim();
        isSystem = MEDIA_PLACEHOLDERS.test(text);
      } else {
        // No "Name: " separator or matched common system phrase
        isSystem = true;
        sender = 'system';
        text = headerMatch.remainder.trim();
      }

      if (!isSystem && sender) {
        sendersSet.add(sender);
      }

      messages.push({
        id: messages.length + 1,
        ts,
        sender: isSystem ? 'system' : sender,
        text,
        isSystem,
        raw: rawLine,
      });
    } else if (messages.length > 0) {
      // Continuation line
      const lastMsg = messages[messages.length - 1];
      lastMsg.text += `\n${cleanedLine}`;
      lastMsg.raw += `\n${rawLine}`;
    }
  }

  const realMessages = messages.filter((m) => !m.isSystem);
  if (messages.length === 0 || realMessages.length === 0) {
    throw new ParseError('No valid WhatsApp messages found in the export.');
  }

  return {
    messages,
    senders: Array.from(sendersSet),
    dateOrder,
    format,
    warning:
      messages.length > 20000
        ? 'Over 20,000 messages detected. All messages are preserved and processed locally.'
        : undefined,
  };
}

export async function readUploadedFile(file: File): Promise<string> {
  const isZip = file.name.toLowerCase().endsWith('.zip') || file.type.includes('zip');
  if (isZip) {
    const buffer = await file.arrayBuffer();
    const unzipped = unzipSync(new Uint8Array(buffer));
    const candidateFiles = Object.keys(unzipped).filter(
      (k) =>
        k.toLowerCase().endsWith('.txt') &&
        !k.includes('__MACOSX') &&
        !k.toLowerCase().includes('media')
    );
    const txtFilename =
      candidateFiles.find((k) => k.toLowerCase().endsWith('_chat.txt') || k.toLowerCase() === '_chat.txt') ||
      candidateFiles[0];

    if (!txtFilename) {
      throw new ParseError('No .txt chat export found inside the zip archive.');
    }
    let content = strFromU8(unzipped[txtFilename]);
    if (content.charCodeAt(0) === 0xfeff) {
      content = content.slice(1);
    }
    return content;
  }
  let text = await file.text();
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }
  return text;
}
