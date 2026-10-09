import type { Message, Signal, TriageResult, UserContext } from '../types';
import { extractDeadlines } from './dates';

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatDueReason(ts: number): string {
  const d = new Date(ts);
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
  const day = d.getDate();
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
  return `due ${weekday} ${day} ${month}, ${time}`;
}

const REQUEST_VERBS_REGEX = /^\s*(?:can you|please|could you|share|send|review)\b/i;
const OPEN_QUESTION_REGEX = /\b(?:anyone|can someone|who can|does anyone)\b/i;
const URGENT_REGEX = /\b(?:asap|urgent|immediately|right now|tonight|eod|last date|deadline)\b/i;
const DECISION_REGEX =
  /\b(?:let's go with|we decided|final|finalised|finalized|confirmed|locked|agreed|approved|going ahead with|it's settled)\b/i;

export function triage(messages: Message[], user: UserContext): TriageResult[] {
  const allAliases = Array.from(new Set([user.me, ...(user.aliases || [])]))
    .map((a) => a.trim())
    .filter(Boolean);

  const aliasRegexes = allAliases.map(
    (alias) => new RegExp(`(?:^|\\W)@?${escapeRegex(alias)}(?:\\W|$)`, 'i')
  );

  const hasAliasMention = (text: string): boolean => {
    return aliasRegexes.some((regex) => regex.test(text));
  };

  const results: TriageResult[] = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];

    // System messages and messages from user.me score 0
    const isFromMe = msg.sender.trim().toLowerCase() === user.me.trim().toLowerCase();
    if (msg.isSystem || isFromMe) {
      results.push({
        messageId: msg.id,
        score: 0,
        signals: [],
        reasons: [],
      });
      continue;
    }

    const text = msg.text;
    const signals: Signal[] = [];
    const reasons: string[] = [];
    let score = 0;
    let dueAt: number | undefined;

    // 1. Mention (+40)
    const mentioned = hasAliasMention(text);
    if (mentioned) {
      signals.push('mention');
      reasons.push('mentions you');
      score += 40;
    }

    // Check if directly follows user message within 10 min
    let directlyFollowsUser = false;
    if (i > 0) {
      const prev = messages[i - 1];
      const prevFromMe = prev.sender.trim().toLowerCase() === user.me.trim().toLowerCase();
      if (prevFromMe && msg.ts - prev.ts <= 10 * 60 * 1000 && msg.ts >= prev.ts) {
        directlyFollowsUser = true;
      }
    }

    // 2. Direct question (+25)
    // contains "?" or starts with a request verb AND (mentions alias OR directly follows user message within 10m)
    const hasQuestionOrRequest = text.includes('?') || REQUEST_VERBS_REGEX.test(text);
    if (hasQuestionOrRequest && (mentioned || directlyFollowsUser)) {
      signals.push('direct_question');
      reasons.push('asked you directly');
      score += 25;
    }

    // 3. Open question (+10)
    // "?" aimed at the whole group
    if (text.includes('?') && OPEN_QUESTION_REGEX.test(text)) {
      signals.push('open_question');
      reasons.push('open question for team');
      score += 10;
    }

    // 4. Deadline (+25, +10 if within 48h)
    const deadlines = extractDeadlines(text, msg.ts);
    if (deadlines.length > 0) {
      // Pick earliest deadline
      deadlines.sort((a, b) => a.dueAt - b.dueAt);
      const earliest = deadlines[0];
      dueAt = earliest.dueAt;

      let deadlinePoints = 25;
      const diffHours = (dueAt - msg.ts) / (1000 * 3600);
      if (diffHours > 0 && diffHours <= 48) {
        deadlinePoints += 10;
      }

      signals.push('deadline');
      reasons.push(formatDueReason(dueAt));
      score += deadlinePoints;
    }

    // 5. Urgent (+15)
    if (URGENT_REGEX.test(text)) {
      signals.push('urgent');
      reasons.push('sounds urgent');
      score += 15;
    }

    // 6. Decision (+20)
    if (DECISION_REGEX.test(text)) {
      signals.push('decision');
      reasons.push('looks like a decision');
      score += 20;
    }

    // Cap total score at 100
    const finalScore = Math.min(100, score);

    results.push({
      messageId: msg.id,
      score: finalScore,
      signals,
      reasons,
      dueAt,
    });
  }

  return results;
}
