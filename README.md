# CatchUp Zero

> Executive "What did I miss?" briefing for WhatsApp chats. Client-only, deterministic-first, with a privacy-gated Gemini synthesis layer.

CatchUp Zero is a privacy-first web application that transforms noisy WhatsApp group exports into prioritized, actionable executive briefings. It processes chat transcripts on-device in under 600 milliseconds without sending a single byte anywhere by default.

---

## What It Is

When you return to an active WhatsApp group after hours away, CatchUp Zero scans the missed conversation slice and distills it into an executive summary:
- **Needs You**: Mentions, direct action requests, and questions targeted at your identity or aliases.
- **Deadlines**: Specific time-sensitive commitments with a 1-click **+ Add to Calendar** (RFC 5545 `.ics`) exporter.
- **Decisions**: Key team agreements, milestones, and approved proposals.
- **FYI**: Informational announcements and open discussions.
- **Noise**: Collapsed, safe-to-ignore chatter.
- **Density Gap Strip**: A horizontal minimap of chat activity highlighting your absence and plotting interactive pins.
- **Context Lineage Drawer**: Direct access to verbatim surrounding messages (5 before, 5 after) to verify ground truth.
- **Executive Summary**: Deterministic baseline overview, with optional user-keyed Gemini synthesis.

---

## Privacy Architecture & Zero-Egress

Your WhatsApp conversations contain sensitive personal and business communications. CatchUp Zero enforces strict privacy gates:

### 1. Default Mode: 100% On-Device & Zero Network Calls
- By default, all chat parsing, relative date extraction, triage scoring, clustering, and calendar generation run completely in your browser tab.
- Nothing leaves your computer. The app functions seamlessly with airplane mode enabled.
- A live Privacy Badge at the top monitors network traffic and displays: `100% Local Heuristics Active (0 Data Sent)`.

### 2. Optional Hybrid Synthesis (User-Keyed Google Gemini)
Users can optionally provide their own Google Gemini API key to generate a polished 2-sentence executive summary:
- **Stored in sessionStorage Only**: Your API key exists only in your current browser tab's `sessionStorage`. It is never transmitted to any third-party server, database, or stored in the repository.
- **Client-Side Redactor (`src/core/redactor.ts`)**: Before any text leaves your machine, a deterministic regex redactor scrubs:
  - Passwords, access tokens, API keys, and secrets (`password is ...`, `token: ...`, `api_key = ...`)
  - Google API keys (`AIza...`)
  - Provider tokens (Bearer tokens, JWT headers, GitHub, Slack, AWS keys)
  - URL query secrets (`?token=...`, `?key=...`, `?sig=...`)
  - Email addresses
  - Phone numbers (+CC formats, international numbers, 10-digit Indian mobiles)
  - One-time verification codes and OTPs in context
  - Card-like 13-19 digit numeric sequences
- **Curated Payload**: Banter, system messages, media placeholders, and low-score clusters are excluded. Only messages with a triage score &ge; 25 are sent (maximum 40 lines, capped at 6,000 characters).
- **Explicit Preview & Consent**: Clicking "Polish with Gemini" presents an inspection modal showing the exact redacted text. Nothing is transmitted until you explicitly click **Send**.
- **Transparent Network Log**: When Gemini synthesis is used, the privacy badge transitions to amber (`Sanitized Cloud Synthesis · N lines sent`) and logs the request in an auditable network modal.

### Redaction Limitations & Important Notes
- **Best-Effort Regex**: The client-side redactor is regex-based. While it scrubs common credential formats, keys, tokens, contact details, and OTPs, **it does not remove personal names or unstructured free-text contextual details**.
- **No Gen AI in Core**: Engine 1 is 100% deterministic and never depends on generative AI. If Gemini fails, times out, or has no key configured, the on-device deterministic summary is preserved.

---

## How to Export from WhatsApp

CatchUp Zero accepts exported `.txt` files or raw `.zip` archives (extracted on-device via `fflate`):

### Android
1. Open the WhatsApp chat or group.
2. Tap the **three vertical dots (⋮)** in the top right corner.
3. Select **More** &rarr; **Export chat**.
4. Choose **Without media** (CatchUp Zero only parses text logs).
5. Save or share the `.txt` file, then drop it into CatchUp Zero.

### iPhone (iOS)
1. Open the WhatsApp chat or group.
2. Tap the group or contact name at the top.
3. Scroll to the bottom and tap **Export Chat**.
4. Select **Without Media**.
5. Save to **Files** or AirDrop to your computer, then drop the `.txt` or `.zip` into CatchUp Zero.

---

## How to Run Locally

### Prerequisites
- Node.js 18+ (Node 20+ recommended)
- npm or pnpm

### Quickstart
```bash
# Clone repository
git clone https://github.com/h4r5h1t/CatchUp-Zero.git
cd PROTOCOLX

# Install dependencies
npm install

# Start local development server
npm run dev
```

### Verification & Testing
```bash
# Run unit test suite (vitest)
npm test

# Run deterministic pipeline smoke test
npm run smoke

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## Deployment

CatchUp Zero is a static single-page application (SPA) with zero backend code:

```bash
# Deploy to Vercel
npx vercel --prod
```

Strict CSP headers configured in `vercel.json`:
```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://generativelanguage.googleapis.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'
```

---

## Architecture in Text

```
[ WhatsApp Export (.txt or .zip) ] or [ Offline Bundled Demo ]
                     │
                     ▼
             [ parser.ts ]
   - Auto-detects DMY vs MDY date formats
   - Strips Unicode RTL/LTR marks & narrow spaces
   - Isolates system announcements from messages
   - Handles multiline message continuations
                     │
                     ▼
             [ dates.ts ]
   - Powered by chrono-node with forwardDate: true
   - Resolves "tomorrow", "tonight", "by 5 PM", "EOD",
     "Friday", "next Monday", "on 14th", "in 2 hours"
                     │
                     ▼
             [ triage.ts ]
   - Scans unread slice (ts > lastReadAt)
   - Evaluates strong aliases (+40) & weak aliases (+15)
   - Scores direct asks (+25), open questions (+10),
     deadlines (+25/+35), urgency (+15), decisions (+20)
                     │
                     ▼
            [ briefing.ts ]
   - Clusters events in 15-minute bursts
   - Groups into Needs You, Deadlines, Decisions, FYI, Noise
   - Grounded citations: each item references exact message IDs
                     │
                     ▼
            [ Executive UI ]
   - Density Gap Strip minimap with interactive pins
   - Scannable briefing cards with RFC 5545 .ics downloads
   - Context lineage drawer showing 5 messages before & after
                     │
    ┌────────────────┴────────────────┐
    ▼                                 ▼
[ 100% On-Device Summary ]    [ Optional Gemini Polish ]
(Always active, zero egress)   - Stored in sessionStorage only
                               - Redacted on-device (redactor.ts)
                               - User reviews lines before send
                               - 2-sentence executive synthesis
```

---

## Gen AI Usage

**Engine 1 uses no generative AI.** Pure heuristics, deterministic regex parsing, rule-based scoring, and local calendar generation.

**Optional Gemini Layer**: When the user supplies their own Gemini 2.5 Flash API key and clicks Send, up to 40 redacted high-signal lines are sent to Google Gemini from the browser to produce a 2-sentence executive summary (`src/core/gemini.ts`, `src/core/redactor.ts`). Without a key, or on any failure, the deterministic summary is used. No key is stored in the repo or bundle.
