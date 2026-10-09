export interface Message {
  id: number;
  ts: number; /* epoch ms */
  sender: string;
  text: string;
  isSystem: boolean;
  raw: string;
}

export interface ParsedChat {
  messages: Message[];
  senders: string[];
  dateOrder: 'dmy' | 'mdy';
  format: 'android' | 'ios';
}

export type Signal =
  | 'mention'
  | 'direct_question'
  | 'open_question'
  | 'deadline'
  | 'urgent'
  | 'decision';

export interface TriageResult {
  messageId: number;
  score: number;
  signals: Signal[];
  reasons: string[];
  dueAt?: number;
}

export interface BriefingItem {
  id: string;
  kind: 'needs_you' | 'deadline' | 'decision' | 'fyi';
  title: string;
  summary: string;
  reason: string;
  score: number;
  sourceMessageIds: number[];
  dueAt?: number;
  signals: Signal[];
}

export interface Briefing {
  items: BriefingItem[];
  counts: Record<BriefingItem['kind'], number>;
  noiseCount: number;
  missedCount: number;
  slice: { from: number; to: number };
  chatSpan: { from: number; to: number };
}

export interface UserContext {
  me: string;
  aliases: string[];
  lastReadAt: number;
}

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}
