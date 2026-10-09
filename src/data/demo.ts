import type { UserContext } from '../types';
import { parseChat } from '../core/parser';
import demoChat from './demo_chat.txt?raw';

export { demoChat };

let cachedLastReadAt: number | null = null;

export function demoLastReadAt(): number {
  if (cachedLastReadAt !== null) {
    return cachedLastReadAt;
  }

  const parsed = parseChat(demoChat);
  const targetIndex = Math.floor(parsed.messages.length * 0.6); // ~60% through chat
  cachedLastReadAt = parsed.messages[targetIndex]?.ts ?? 0;
  return cachedLastReadAt;
}

export const DEMO_USER: UserContext = {
  me: 'Kabir',
  aliases: ['Kabir', 'kabi'],
  get lastReadAt() {
    return demoLastReadAt();
  },
};
