import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Deterministic seeded generator
let seed = 4202026;
function random() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}

function randInt(min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function pad(n) {
  return n < 10 ? '0' + n : '' + n;
}

function formatAndroidTimestamp(date) {
  const d = pad(date.getDate());
  const m = pad(date.getMonth() + 1);
  const y = date.getFullYear();
  const hr = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${d}/${m}/${y}, ${hr}:${min}`;
}

const senders = ['Riya', 'Kabir', 'Meera', 'Dev', 'Aarav'];

const casualLines = [
  "gm team! ready for day two?",
  "coffee acquired ☕ let's crush this sprint",
  "wait did someone push without running lint?",
  "lol my bad fixing that typo now",
  "haha classic",
  "looks super clean",
  "yeah agree with that approach",
  "should we keep it async?",
  "async is fine let's just drop updates here",
  "working on the responsive card styles",
  "navbar is aligned nicely on mobile",
  "zinc-50 and orange accent looks crisp 👌",
  "agree it feels very executive",
  "no dark neon gradients please haha",
  "100% minimal and scannable is way better",
  "just pushed branch fix/layout-padding",
  "checking it out right now",
  "nice catch on that overflow issue",
  "almost done with the parsing benchmark",
  "parsing 500 messages takes under 15ms in browser!!",
  "zero egress is such a good privacy angle",
  "users will love that not a single byte leaves their browser",
  "totally, no server bills for us either lol",
  "the demo is shaping up really well",
  "make sure to test keyboard focus states",
  "added outline-offset for visible focus rings",
  "wcag aa contrast verified on all badges",
  "awesome work everyone",
  "grabbing a quick bite back soon",
  "back at desk",
  "sounds good to me",
  "let me know when preview build is up",
  "preview is live on the pr link",
  "tested on safari and chrome, looking solid",
  "nice one!",
  "let's keep pushing",
  "gotta love hackathon deadlines haha",
];

// Spanning Tue 6 Oct 2026 to Thu 8 Oct 2026
// Start: 2026-10-06 09:00 IST
let currentDate = new Date('2026-10-06T09:00:00+05:30');

const allMessages = [];
let nonSystemCount = 0;

// Helper to advance time realistically across 3 days
function advanceTime() {
  const r = random();
  if (r < 0.75) {
    currentDate = new Date(currentDate.getTime() + randInt(1, 3) * 60 * 1000);
  } else if (r < 0.95) {
    currentDate = new Date(currentDate.getTime() + randInt(5, 12) * 60 * 1000);
  } else {
    currentDate = new Date(currentDate.getTime() + randInt(35, 75) * 60 * 1000);
  }
}

// Initial greeting (non-system #1)
allMessages.push({
  date: new Date(currentDate),
  sender: 'Riya',
  text: 'Hey team! Welcome to the Hackathon Team chat 🚀',
  isSystem: false,
});
nonSystemCount++;

while (nonSystemCount < 420) {
  advanceTime();

  // 1 System join line at non-system count 5
  if (nonSystemCount === 5 && !allMessages.some(m => m.text.includes("joined using this group's invite link"))) {
    allMessages.push({
      date: new Date(currentDate),
      sender: 'system',
      text: "Dev joined using this group's invite link",
      isSystem: true,
    });
    advanceTime();
  }

  // Media placeholders (extra system lines)
  if (
    (nonSystemCount === 30 || nonSystemCount === 120 || nonSystemCount === 240 || nonSystemCount === 350) &&
    allMessages[allMessages.length - 1]?.text !== '<Media omitted>'
  ) {
    const s = senders[randInt(0, senders.length - 1)];
    allMessages.push({
      date: new Date(currentDate),
      sender: s,
      text: '<Media omitted>',
      isSystem: true,
    });
    advanceTime();
  }

  // Multi-line message
  if (nonSystemCount === 50) {
    allMessages.push({
      date: new Date(currentDate),
      sender: 'Meera',
      text: "Quick summary of sprint targets:\n1. Zero egress heuristic core\n2. Clean executive UI tokens\n3. RFC 5545 calendar export",
      isSystem: false,
    });
    nonSystemCount++;
    continue;
  }

  // In final ~40% (nonSystemCount >= 252, happening on Thu 8 Oct 2026):
  // 1. Direct asks to Kabir (indices 260, 285, 335, 395)
  if (nonSystemCount === 260) {
    allMessages.push({
      date: new Date(currentDate),
      sender: 'Riya',
      text: 'Kabir can you review the auth PR before we merge to main?',
      isSystem: false,
    });
    nonSystemCount++;
    continue;
  }

  if (nonSystemCount === 285) {
    allMessages.push({
      date: new Date(currentDate),
      sender: 'Meera',
      text: 'kabi please share the API key for the database',
      isSystem: false,
    });
    nonSystemCount++;
    continue;
  }

  if (nonSystemCount === 335) {
    allMessages.push({
      date: new Date(currentDate),
      sender: 'Dev',
      text: 'Could you check the deploy logs Kabir? Need to verify zero-egress CSP headers',
      isSystem: false,
    });
    nonSystemCount++;
    continue;
  }

  if (nonSystemCount === 395) {
    allMessages.push({
      date: new Date(currentDate),
      sender: 'Riya',
      text: 'Kabir can you send the updated pitch deck for the judges?',
      isSystem: false,
    });
    nonSystemCount++;
    continue;
  }

  // 2. Deadlines on Thu 8 Oct 2026:
  // - "by 5 PM tomorrow" -> Fri 9 Oct 17:00
  // - "Friday EOD" -> Fri 9 Oct 18:00
  // - "on 14th" -> 14 Oct 2026
  if (nonSystemCount === 275) {
    allMessages.push({
      date: new Date(currentDate),
      sender: 'Aarav',
      text: 'Team reminder: we must submit the slide deck by 5 PM tomorrow',
      isSystem: false,
    });
    nonSystemCount++;
    continue;
  }

  if (nonSystemCount === 320) {
    allMessages.push({
      date: new Date(currentDate),
      sender: 'Dev',
      text: 'Dev reminder: all feature branches must be merged Friday EOD',
      isSystem: false,
    });
    nonSystemCount++;
    continue;
  }

  if (nonSystemCount === 380) {
    allMessages.push({
      date: new Date(currentDate),
      sender: 'Meera',
      text: 'Organizers said the demo booth signup closes on 14th',
      isSystem: false,
    });
    nonSystemCount++;
    continue;
  }

  // 3. Decisions (indices 295, 345, 405) - sent by non-Kabir
  if (nonSystemCount === 295) {
    allMessages.push({
      date: new Date(currentDate),
      sender: 'Dev',
      text: "let's go with Postgres for our database, confirmed by everyone",
      isSystem: false,
    });
    nonSystemCount++;
    continue;
  }

  if (nonSystemCount === 345) {
    allMessages.push({
      date: new Date(currentDate),
      sender: 'Riya',
      text: 'we decided on the presentation deck structure, finalised and locked',
      isSystem: false,
    });
    nonSystemCount++;
    continue;
  }

  if (nonSystemCount === 405) {
    allMessages.push({
      date: new Date(currentDate),
      sender: 'Meera',
      text: "confirmed: Tailwind v4 is approved and locked for styling all cards",
      isSystem: false,
    });
    nonSystemCount++;
    continue;
  }

  // 4. Open group questions (indices 305, 365)
  if (nonSystemCount === 305) {
    allMessages.push({
      date: new Date(currentDate),
      sender: 'Aarav',
      text: 'can someone test the sign-up flow on mobile?',
      isSystem: false,
    });
    nonSystemCount++;
    continue;
  }

  if (nonSystemCount === 365) {
    allMessages.push({
      date: new Date(currentDate),
      sender: 'Meera',
      text: 'does anyone know where the shared Figma link was pinned?',
      isSystem: false,
    });
    nonSystemCount++;
    continue;
  }

  // General casual chatter
  const sender = senders[randInt(0, senders.length - 1)];
  const line = casualLines[randInt(0, casualLines.length - 1)];
  allMessages.push({
    date: new Date(currentDate),
    sender,
    text: line,
    isSystem: false,
  });
  nonSystemCount++;
}

// Convert to Android WhatsApp export format
const outputLines = allMessages.map((m) => {
  const tsStr = formatAndroidTimestamp(m.date);
  if (m.isSystem && m.sender === 'system') {
    return `${tsStr} - ${m.text}`;
  }
  return `${tsStr} - ${m.sender}: ${m.text}`;
});

const content = outputLines.join('\n') + '\n';

const outPath = path.resolve(__dirname, '../src/data/demo_chat.txt');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, content, 'utf-8');

const realCount = allMessages.filter(m => !m.isSystem).length;
const totalCount = allMessages.length;
console.log(`Generated demo chat: ${realCount} non-system messages (${totalCount} total lines)`);
console.log(`Span: ${allMessages[0].date.toDateString()} to ${allMessages[allMessages.length - 1].date.toDateString()}`);
