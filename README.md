# CatchUp Zero

> Executive "What did I miss?" briefing for WhatsApp chats. Client-only, zero-egress, deterministic-first.

CatchUp Zero is a privacy-first web application that transforms noisy WhatsApp group exports into prioritized, actionable executive briefings. It processes everything on-device in under 600 milliseconds without sending a single byte to any remote server or AI API.

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

---

## Local-First Explanation & Zero-Egress

Your WhatsApp conversations contain sensitive personal and business communications. CatchUp Zero ensures that your data stays strictly on your device:

1. **Zero Outbound Calls**: All processing (unzipping, regex parsing, relative date extraction, heuristic scoring, clustering) runs synchronously in your browser tab.
2. **Hardened Content Security Policy**: Configured with `connect-src 'none'`, preventing the browser from establishing any outbound HTTP, WebSocket, WebRTC, or EventSource connections.
3. **Zero-Egress Trap & Network Badge**: An inline interceptor wraps `window.fetch`, `XMLHttpRequest`, and `navigator.sendBeacon`. A live status badge confirms `0 Network Calls | 100% On-Device` and turns red if any connection is ever attempted.
4. **Airplane Mode Ready**: Once loaded, CatchUp Zero functions completely offline with zero connectivity.

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

CatchUp Zero is a static single-page application (SPA) that can be deployed to any static host (Vercel, Cloudflare Pages, Netlify, GitHub Pages) without servers or serverless functions.

### Deploying to Vercel
The repository includes a ready-to-deploy `vercel.json` with strict CSP headers:

```bash
# Deploy to Vercel
npx vercel --prod
```

---

## Architecture in Text

```
[ WhatsApp Export (.txt or .zip) ] or [ Offline Demo Chat ]
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
   - Clusters events in 15-minute windows
   - Groups into Needs You, Deadlines, Decisions, FYI, Noise
   - Grounded citations: each item references exact message IDs
                     │
                     ▼
            [ Executive UI ]
   - Density Gap Strip minimap with interactive pins
   - Scannable briefing cards with RFC 5545 .ics downloads
   - Context lineage drawer showing 5 messages before & after
```

---

## Gen AI Usage

**Engine 1 uses no generative AI.** Pure heuristics, deterministic regex parsing, rule-based scoring, and local calendar generation.
