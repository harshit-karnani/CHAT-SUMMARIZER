import { describe, it, expect } from 'vitest';
import { triage } from '../src/core/triage';
import type { Message, UserContext } from '../types';

describe('triage module', () => {
  const user: UserContext = {
    me: 'Kabir',
    aliases: ['Kabir', 'kabi', 'bro'],
    lastReadAt: 1000,
  };

  const createMsg = (id: number, sender: string, text: string, ts = 2000): Message => ({
    id,
    sender,
    text,
    ts,
    isSystem: false,
    raw: text,
  });

  it('awards high score for strong alias mentions', () => {
    const messages = [createMsg(1, 'Dev', 'Hey Kabir, did you check the PR?')];
    const results = triage(messages, user);
    expect(results[0].score).toBeGreaterThanOrEqual(40);
    expect(results[0].signals).toContain('mention');
  });

  it('differentiates weak aliases requiring request context', () => {
    const withoutQuestion = [createMsg(1, 'Dev', 'thanks bro')];
    const res1 = triage(withoutQuestion, user);
    expect(res1[0].signals).not.toContain('direct_question');

    const withQuestion = [createMsg(2, 'Dev', 'can you send the link bro?')];
    const res2 = triage(withQuestion, user);
    expect(res2[0].signals).toContain('direct_question');
  });

  it('identifies decisions and approved proposals', () => {
    const messages = [createMsg(1, 'Aarav', "we decided to go ahead with PostgreSQL")];
    const results = triage(messages, user);
    expect(results[0].signals).toContain('decision');
  });

  it('flags urgent signals', () => {
    const messages = [createMsg(1, 'Dev', 'Please fix the server immediately, urgent!')];
    const results = triage(messages, user);
    expect(results[0].signals).toContain('urgent');
  });

  it('does not flag mentions when sender is user themselves', () => {
    const messages = [createMsg(1, 'Kabir', 'Hey everyone, I will review Kabir notes')];
    const results = triage(messages, user);
    expect(results[0].signals).not.toContain('direct_question');
  });
});
