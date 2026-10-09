# SplitOff

> Executive "What did I miss?" briefing for WhatsApp chats. Client-only, deterministic-first, with a privacy-gated serverless Gemini synthesis layer.

SplitOff is a privacy-first web application that transforms noisy WhatsApp group exports into prioritized, actionable executive briefings. It processes chat transcripts on-device in under 300 milliseconds without sending a single byte anywhere by default.

---

## What It Is

When you return to an active WhatsApp group after hours away, SplitOff scans the missed conversation slice and distills it into an executive summary:
- **Needs You**: Mentions, direct action requests, and questions targeted at your identity or aliases.
- **Deadlines**: Specific time-sensitive commitments with a 1-click **+ Add to Calendar** (RFC 5545 `.ics`) exporter.
- **Decisions**: Key team agreements, milestones, and approved proposals.
- **FYI**: Informational announcements and open discussions.
- **Noise**: Collapsed, safe-to-ignore chatter.
- **Density Gap Strip**: A horizontal minimap of chat activity highlighting your absence and plotting interactive pins.
- **Context Lineage Drawer**: Direct access to verbatim surrounding messages (5 before, 5 after) to verify ground truth.
- **Executive Summary**: Deterministic baseline overview, with an optional one-click Gemini 2.5 Flash synthesis proxy.

---

## Privacy Architecture & Zero-Egress

Your WhatsApp conversations contain sensitive personal and business communications. SplitOff enforces strict privacy gates:

### 1. Default Mode: 100% On-Device & Zero Network Calls
- By default, all chat parsing, relative date extraction, triage scoring, clustering, and calendar generation run completely in your browser tab.
- Nothing leaves your computer. The app functions seamlessly with airplane mode enabled.
- **Refresh Persistence via IndexedDB**: Your parsed chat and session parameters are saved only in this browser's `IndexedDB` on-device so page refreshes don't lose your place. Nothing is ever uploaded to a server or cloud. You can click **"Forget this chat"** at any time to permanently wipe the local database.
- A live Privacy Badge at the top monitors network traffic and displays: `100% Local Heuristics Active (0 Data Sent)`.

### 2. Optional Hybrid Synthesis (Zero-Key Serverless Gemini Proxy)
Users can optionally generate a polished 2-sentence executive summary with a single click. Judges and end-users are never asked for an API key:
- **Server-Side Key Isolation**: The Google Gemini API key resides solely as a server-side environment variable (`GEMINI_API_KEY`) on the Vercel serverless function [`api/summarize.ts`](api/summarize.ts). No keys exist in client code, bundles, or browser storage.
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
- **Defense-in-Depth Server Redaction**: The serverless proxy re-runs redaction on incoming lines, enforces origin verification (same-origin check), limits request body to 16 KB, and rate-limits requests to 8 req/min per IP.
- **Explicit Preview & Disclosure**: A collapsible inspection panel allows reviewing the exact redacted text lines prior to sending.
- **Transparent Network Log**: When Gemini synthesis is used, the privacy badge transitions to amber (`Redacted lines sent to Gemini via our server (N lines sent)`) and logs the request in an auditable network log at `/privacy`.

### Redaction Limitations & Important Notes
- **Best-Effort Regex**: The client-side redactor is regex-based. While it scrubs common credential formats, keys, tokens, contact details, and OTPs, **it does not remove personal names or unstructured free-text contextual details**.
- **No Gen AI in Core**: Engine 1 is 100% deterministic and never depends on generative AI. If Gemini fails or times out, the on-device deterministic summary is preserved.

---

## How to Export from WhatsApp

SplitOff accepts exported `.txt` files or raw `.zip` archives (extracted on-device via `fflate`):

### Android
1. Open the WhatsApp chat or group.
2. Tap the **three vertical dots (⋮)** in the top right corner.
3. Select **More** &rarr; **Export chat**.
4. Choose **Without media** (SplitOff only parses text logs).
5. Save or share the `.txt` file, then drop it into SplitOff.

### iPhone (iOS)
1. Open the WhatsApp chat or group.
2. Tap the group or contact name at the top.
3. Scroll to the bottom and tap **Export Chat**.
4. Select **Without Media**.
5. Save to **Files** or AirDrop to your computer, then drop the `.txt` or `.zip` into SplitOff.

---

## How to Run Locally

### Prerequisites
- Node.js 18+ (Node 20+ recommended)
- npm or pnpm

### Quickstart
```bash
# Clone repository
git clone https://github.com/harshit-karnani/CHAT-SUMMARIZER.git
cd CHAT-SUMMARIZER

# Install dependencies
npm install

# Start local development server
npm run dev

# Run unit tests
npm test

# Run smoke test
npm run smoke

# Build production bundle
npm run build
```

---

## Deployment (Vercel)

SplitOff is designed for seamless zero-config deployment on Vercel:

1. Push your code to GitHub.
2. Import the repository in **Vercel**.
3. Under **Settings &rarr; Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Gemini API key from [Google AI Studio](https://aistudio.google.com).
4. Deploy! Static assets build to `/dist` and `/api/summarize.ts` deploys as a Vercel Serverless Function.

---

## Gen AI Disclosure

Engine 1 uses no generative AI. Optional, user-triggered: up to 40 locally redacted high-signal lines are sent through a serverless proxy (`api/summarize.ts`, key held only in a Vercel environment variable) to Gemini 2.5 Flash to produce a 2-sentence summary. Without a click, or on any failure, the deterministic summary is used.
