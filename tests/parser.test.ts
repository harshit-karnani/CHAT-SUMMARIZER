import { describe, it, expect } from 'vitest';
import { parseChat } from '../src/core/parser';

describe('WhatsApp Parser Robustness', () => {
  it('case 1: parses standard Android export lines', () => {
    const raw = `14/10/2026, 10:15 - Kabir: Hey team, auth is ready\n14/10/2026, 10:16 - Riya: Looks great!`;
    const parsed = parseChat(raw);

    expect(parsed.format).toBe('android');
    expect(parsed.dateOrder).toBe('dmy');
    expect(parsed.messages.length).toBe(2);
    expect(parsed.messages[0].sender).toBe('Kabir');
    expect(parsed.messages[0].text).toBe('Hey team, auth is ready');
    expect(parsed.messages[0].isSystem).toBe(false);
  });

  it('case 2: parses standard iOS export lines with LTR marks and am/pm', () => {
    const raw = `[14/10/26, 10:15:30 AM] Riya: Great progress on the dashboard!\n[14/10/26, 10:16:00 AM] Dev: Thanks Riya`;
    const parsed = parseChat(raw);

    expect(parsed.format).toBe('ios');
    expect(parsed.messages.length).toBe(2);
    expect(parsed.messages[0].sender).toBe('Riya');
    expect(parsed.messages[0].text).toBe('Great progress on the dashboard!');
    expect(parsed.messages[0].isSystem).toBe(false);
  });

  it('case 3: correctly identifies system messages even when containing a colon', () => {
    const raw = `14/10/2026, 10:15 - Messages and calls are end-to-end encrypted: No one outside can read them.\n14/10/2026, 10:16 - Dev changed the subject to: CatchUp Zero Demo\n14/10/2026, 10:17 - Kabir: Ready to review now`;
    const parsed = parseChat(raw);

    expect(parsed.messages.length).toBe(3);

    // Message 1: encryption notice with colon
    expect(parsed.messages[0].isSystem).toBe(true);
    expect(parsed.messages[0].sender).toBe('system');

    // Message 2: changed subject with colon
    expect(parsed.messages[1].isSystem).toBe(true);
    expect(parsed.messages[1].sender).toBe('system');

    // Message 3: real user message
    expect(parsed.messages[2].isSystem).toBe(false);
    expect(parsed.messages[2].sender).toBe('Kabir');
    expect(parsed.messages[2].text).toBe('Ready to review now');
  });
});
