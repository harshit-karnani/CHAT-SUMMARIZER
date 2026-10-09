import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple pseudo-random seeded generator (LCG)
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
  "lol my bad fixing that typo",
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

// Start timestamp: 12 Oct 2026, 09:00 IST
let currentDate = new Date('2026-10-12T09:00:00+05:30');

const messages = [];

// Message 1 is an initial greeting
messages.push({
  date: new Date(currentDate),
  sender: 'Riya',
  text: 'Hey team! Welcome to the Hackathon Team chat 🚀',
  isSystem: false,
});

// Plant the join line early (at index 5)
for (let i = 1; i < 420; i++) {
  // Burst timing: sometimes 1-3 mins, sometimes 15-45 mins between bursts, overnight jumps
  const r = random();
  if (r < 0.7) {
    currentDate = new Date(currentDate.getTime() + randInt(1, 4) * 60 * 1000);
  } else if (r < 0.93) {
    currentDate = new Date(currentDate.getTime() + randInt(12, 45) * 60 * 1000);
  } else {
    currentDate = new Date(currentDate.getTime() + randInt(2, 6) * 60 * 60 * 1000);
  }

  // Exact system join line at message index 5
  if (i === 5) {
    messages.push({
      date: new Date(currentDate),
      sender: 'system',
      text: "Dev joined using this group's invite link",
      isSystem: true,
    });
    continue;
  }

  // Media omitted at specific indices
  if (i === 28 || i === 114 || i === 230 || i === 340) {
    const sender = senders[randInt(0, senders.length - 1)];
    messages.push({
      date: new Date(currentDate),
      sender,
      text: '<Media omitted>',
      isSystem: true,
    });
    continue;
  }

  // Multi-line message
  if (i === 45) {
    messages.push({
      date: new Date(currentDate),
      sender: 'Meera',
      text: "Quick summary of today's goals:\n1. Finalize heuristics engine\n2. Integrate ICS export\n3. Build crisp UI components",
      isSystem: false,
    });
    continue;
  }

  // In the final ~40% (indices 252 to 419), plant asks, deadlines, decisions, open questions
  // 1. Direct asks to Kabir (indices 260, 285, 335, 395)
  if (i === 260) {
    messages.push({
      date: new Date(currentDate),
      sender: 'Riya',
      text: 'Kabir can you review the auth PR before we merge to main?',
      isSystem: false,
    });
    continue;
  }

  if (i === 285) {
    messages.push({
      date: new Date(currentDate),
      sender: 'Meera',
      text: 'kabi please share the API key for the database',
      isSystem: false,
    });
    continue;
  }

  if (i === 335) {
    messages.push({
      date: new Date(currentDate),
      sender: 'Dev',
      text: 'Could you check the deploy logs Kabir? Need to verify zero-egress CSP headers',
      isSystem: false,
    });
    continue;
  }

  if (i === 395) {
    messages.push({
      date: new Date(currentDate),
      sender: 'Riya',
      text: 'Kabir can you send the updated pitch deck?',
      isSystem: false,
    });
    continue;
  }

  // 2. Deadlines (indices 275, 320, 380)
  if (i === 275) {
    messages.push({
      date: new Date(currentDate),
      sender: 'Aarav',
      text: 'Team reminder: we must submit the slide deck by 5 PM tomorrow',
      isSystem: false,
    });
    continue;
  }

  if (i === 320) {
    messages.push({
      date: new Date(currentDate),
      sender: 'Dev',
      text: 'QA announcement: all feature branches must be merged Friday EOD',
      isSystem: false,
    });
    continue;
  }

  if (i === 380) {
    messages.push({
      date: new Date(currentDate),
      sender: 'Meera',
      text: 'Hackathon organizers posted that booth registration closes on 14th',
      isSystem: false,
    });
    continue;
  }

  if (i === 360) {
    messages.push({
      date: new Date(currentDate),
      sender: 'Dev',
      text: 'submission deadline: we have to turn in our code tonight by 11 PM',
      isSystem: false,
    });
    continue;
  }

  // 3. Decisions (indices 295, 345, 405) - must not be sent by Kabir (user.me) and must have decision keywords
  if (i === 295) {
    messages.push({
      date: new Date(currentDate),
      sender: 'Dev',
      text: "let's go with Postgres for our database, confirmed by everyone",
      isSystem: false,
    });
    continue;
  }

  if (i === 345) {
    messages.push({
      date: new Date(currentDate),
      sender: 'Riya',
      text: 'we decided on the presentation deck structure, finalised and locked',
      isSystem: false,
    });
    continue;
  }

  if (i === 405) {
    messages.push({
      date: new Date(currentDate),
      sender: 'Meera',
      text: "confirmed: Tailwind v4 is approved and locked for styling all cards",
      isSystem: false,
    });
    continue;
  }

  // 4. Open group questions (indices 305, 365)
  if (i === 305) {
    messages.push({
      date: new Date(currentDate),
      sender: 'Aarav',
      text: 'can someone test the sign-up flow on mobile?',
      isSystem: false,
    });
    continue;
  }

  if (i === 365) {
    messages.push({
      date: new Date(currentDate),
      sender: 'Meera',
      text: 'does anyone know where the shared Figma link was pinned?',
      isSystem: false,
    });
    continue;
  }

  // General chatter
  const sender = senders[randInt(0, senders.length - 1)];
  const line = casualLines[randInt(0, casualLines.length - 1)];
  messages.push({
    date: new Date(currentDate),
    sender,
    text: line,
    isSystem: false,
  });
}

// Convert to Android WhatsApp export format
const outputLines = messages.map((m) => {
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

console.log(`Generated exactly ${messages.length} messages in ${outPath}`);
