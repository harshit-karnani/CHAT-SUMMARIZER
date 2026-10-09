import { parseChat } from '../src/core/parser.ts';
import { buildBriefing } from '../src/core/briefing.ts';
import { demoChat, DEMO_USER } from '../src/data/demo.ts';

console.log('--- CATCHUP ZERO: SMOKE TEST ---');

// 1. Parse demo chat
const parsed = parseChat(demoChat);
console.log(`Parsed ${parsed.messages.length} messages (format: ${parsed.format}, dateOrder: ${parsed.dateOrder})`);

if (parsed.messages.length !== 420) {
  console.error(`ERROR: Expected exactly 420 messages, got ${parsed.messages.length}`);
  process.exit(1);
}

// 2. Build briefing
const briefing = buildBriefing(parsed, DEMO_USER);
console.log('Briefing Counts per kind:', briefing.counts);
console.log(`Unread Missed: ${briefing.missedCount}, Clustered Items: ${briefing.items.length}, Noise: ${briefing.noiseCount}`);

// 3. Verify planted categories
const missingCategories: string[] = [];

if (!briefing.counts.needs_you || briefing.counts.needs_you < 1) {
  missingCategories.push('needs_you (direct asks to user)');
}

if (!briefing.counts.deadline || briefing.counts.deadline < 1) {
  missingCategories.push('deadline (time-sensitive action items)');
}

if (!briefing.counts.decision || briefing.counts.decision < 1) {
  missingCategories.push('decision (locked group decisions)');
}

if (missingCategories.length > 0) {
  console.error('\nFAIL: Missing planted briefing categories:');
  for (const cat of missingCategories) {
    console.error(`  - ${cat}`);
  }
  process.exit(1);
}

// Verify real message citations (no hallucinated IDs)
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
console.log(`Asks (Needs You): ${briefing.counts.needs_you}`);
console.log(`Deadlines:        ${briefing.counts.deadline}`);
console.log(`Decisions:        ${briefing.counts.decision}`);
console.log('Smoke test passed successfully!\n');
