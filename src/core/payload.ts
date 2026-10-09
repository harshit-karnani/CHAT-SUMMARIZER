import type { Briefing, ParsedChat, UserContext } from '../types';
import { triage } from './triage';
import { redact } from './redactor';

export interface CloudPayload {
  lines: string[];
  redactedCount: number;
  messageIds: number[];
}

export function buildCloudPayload(
  chat: ParsedChat,
  _briefing: Briefing,
  user: UserContext
): CloudPayload {
  const allMessages = chat.messages;
  const isMediaText = (text: string) =>
    /<Media omitted>|<attached:|image omitted|video omitted|audio omitted|sticker omitted/i.test(text);

  const slice = allMessages.filter(
    (m) => m.ts > user.lastReadAt && !m.isSystem && !isMediaText(m.text)
  );

  const triageResults = triage(allMessages, user);
  const triageMap = new Map<number, number>();
  for (const tr of triageResults) {
    let s = tr.score;
    if (tr.signals.includes('decision') && s < 25) {
      s = 25;
    }
    triageMap.set(tr.messageId, s);
  }

  // Candidates in slice with score >= 25, in original time order
  let candidates = slice
    .filter((m) => (triageMap.get(m.id) ?? 0) >= 25)
    .map((m) => {
      const redactedText = redact(m.text);
      let line = `${m.sender}: ${redactedText}`;
      if (line.length > 300) {
        line = line.slice(0, 300);
      }
      return {
        id: m.id,
        ts: m.ts,
        score: triageMap.get(m.id) ?? 25,
        line,
      };
    });

  // Limit to max 40 lines (drop lowest-score lines first when over)
  while (candidates.length > 40) {
    let minScore = Infinity;
    let minIdx = -1;
    for (let i = 0; i < candidates.length; i++) {
      if (candidates[i].score < minScore) {
        minScore = candidates[i].score;
        minIdx = i;
      }
    }
    if (minIdx !== -1) {
      candidates.splice(minIdx, 1);
    } else {
      break;
    }
  }

  // Limit total characters to max 6000 (drop lowest-score lines first when over)
  const calcTotalLen = () =>
    candidates.reduce((sum, c) => sum + c.line.length, 0);

  while (calcTotalLen() > 6000 && candidates.length > 0) {
    let minScore = Infinity;
    let minIdx = -1;
    for (let i = 0; i < candidates.length; i++) {
      if (candidates[i].score < minScore) {
        minScore = candidates[i].score;
        minIdx = i;
      }
    }
    if (minIdx !== -1) {
      candidates.splice(minIdx, 1);
    } else {
      break;
    }
  }

  // Ensure remaining lines remain in chronological time order
  candidates.sort((a, b) => a.ts - b.ts);

  const lines = candidates.map((c) => c.line);
  const messageIds = candidates.map((c) => c.id);

  let redactedCount = 0;
  for (const line of lines) {
    const matches = line.match(/\[REDACTED\]/g);
    if (matches) {
      redactedCount += matches.length;
    }
  }

  return {
    lines,
    redactedCount,
    messageIds,
  };
}
