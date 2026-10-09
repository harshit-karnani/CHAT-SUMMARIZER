import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseChat } from '../src/core/parser.ts';
import { buildBriefing } from '../src/core/briefing.ts';
import { triage } from '../src/core/triage.ts';
import type { UserContext } from '../src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- CATCHUP ZERO: SMOKE TEST ---');

// 1. Read demo chat directly with node:fs (no browser ?raw import)
const demoChatPath = path.resolve(__dirname, '../src/data/demo_chat.txt');
const rawChat = fs.readFileSync(demoChatPath, 'utf-8');

// 2. Parse chat
const parsed = parseChat(rawChat);
const nonSystemCount = parsed.messages.filter((m) => !m.isSystem).length;
console.log(`Parsed ${nonSystemCount} non-system messages (${parsed.messages.length} total)`);

if (nonSystemCount !== 420) {
  console.error(`ERROR: Expected exactly 420 non-system messages, found ${nonSystemCount}`);
  process.exit(1);
}

// 3. User context with last-read at ~60% of the span
const index60 = Math.floor(parsed.messages.length * 0.6);
const lastReadAt = parsed.messages[index60]?.ts ?? 0;

const user: UserContext = {
  me: 'Kabir',
  aliases: ['Kabir', 'kabi'],
  lastReadAt,
};

// 4. Build briefing
const briefing = buildBriefing(parsed, user);
console.log('Counts per kind:', briefing.counts);
console.log(`Unread Slice Missed: ${briefing.missedCount}, Clustered Items: ${briefing.items.length}, Noise: ${briefing.noiseCount}`);

// 5. Verify 2 open questions in the unread slice
const slice = parsed.messages.filter((m) => m.ts > user.lastReadAt);
const triageResults = triage(parsed.messages, user);
const triageMap = new Map(triageResults.map((t) => [t.messageId, t]));

const openQuestionMessages = slice.filter((m) => {
  const tr = triageMap.get(m.id);
  return tr && tr.signals.includes('open_question');
});

console.log(`Open group questions detected in unread slice: ${openQuestionMessages.length}`);

// 6. Verify all 4 planted categories
const missingCategories: string[] = [];

if (briefing.counts.needs_you < 4) {
  missingCategories.push(`Direct asks to Kabir (expected >= 4, found ${briefing.counts.needs_you})`);
}

if (briefing.counts.deadline < 3) {
  missingCategories.push(`Deadlines (expected >= 3, found ${briefing.counts.deadline})`);
}

if (briefing.counts.decision < 3) {
  missingCategories.push(`Decisions (expected >= 3, found ${briefing.counts.decision})`);
}

if (openQuestionMessages.length < 2) {
  missingCategories.push(`Open group questions (expected >= 2, found ${openQuestionMessages.length})`);
}

if (missingCategories.length > 0) {
  console.error('\nFAIL: Missing planted categories:');
  for (const cat of missingCategories) {
    console.error(`  - ${cat}`);
  }
  process.exit(1);
}

// 7. Verify grounded citations (all source IDs exist in chat)
const validIds = new Set(parsed.messages.map((m) => m.id));
for (const item of briefing.items) {
  for (const id of item.sourceMessageIds) {
    if (!validIds.has(id)) {
      console.error(`FAIL: Hallucinated message ID #${id} in item ${item.id}`);
      process.exit(1);
    }
  }
}

console.log('\nSUCCESS: All planted categories found and all message citations verified.');
console.log(`- Direct Asks (Needs You): ${briefing.counts.needs_you}`);
console.log(`- Deadlines:               ${briefing.counts.deadline}`);
console.log(`- Decisions:               ${briefing.counts.decision}`);
console.log(`- Open Group Questions:    ${openQuestionMessages.length}`);
console.log('Smoke test passed successfully!\n');
