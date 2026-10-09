# SplitOff — Project Tracker & Log

## Current State
- **Product Name**: SplitOff (rebranded from CatchUp Zero).
- **Server-Side Gemini Proxy (`api/summarize.ts`)**:
  - Vercel Serverless Function (Node runtime, maxDuration: 15s).
  - POST-only (405), same-origin verification (403), IP rate-limiting (8 req/min, 429), 16 KB body limit.
  - Defense-in-depth server-side regex re-redaction before forwarding to Gemini.
  - 10s abort timeout to Gemini 2.5 Flash API.
  - Key isolation: `process.env.GEMINI_API_KEY` lives strictly in server environment. Zero client keys or storage.
- **Client & UI Architecture**:
  - `KeyControl.tsx` removed; users and judges are never prompted for an API key.
  - Executive summary card features a single tactile primary button: "Generate Executive Briefing".
  - Privacy disclosure clearly displayed with collapsible "Show exactly what will be sent" preview panel.
  - Dynamic 3-state privacy badge: Green LOCAL (0 calls), Amber CLOUD (only `/api/summarize` called, N lines sent), Red ALERT (unauthorized egress).
  - Egress guard interceptor updated with `pathname` tracking for same-origin verification.
- **Performance & Testing**:
  - 36 unit tests passing (`tests/api.test.ts`, `tests/store.test.ts`, `tests/ics.test.ts`, `tests/redactor.test.ts`, `tests/gemini.test.ts`, `tests/parser.test.ts`, `tests/perf.test.ts`).
  - Smoke test passing (`scripts/smoke.ts` verifying all 4 planted categories and unread citations).
  - Production build clean in 1.4s with 0 type errors across `src/` and `api/`. Zero `AIza` keys in bundles.
- **What works**:
  - 100% deterministic on-device operation with zero data sent by default.
  - Optional one-click executive synthesis via serverless proxy to Gemini 2.5 Flash.
  - Refresh-safe on-device state via IndexedDB.
  - RFC 5545 `.ics` export with mini calendar badge on deadlines.
- **What is broken**: Nothing broken.

---

## Log

### Step 1: Scaffold [2026-10-09T13:57:30+05:30]
- **Prompt/Instruction Summary**: Vite + React + TypeScript scaffold. Dependencies: tailwindcss v4 with @tailwindcss/vite, lucide-react, chrono-node, fflate, @fontsource-variable/manrope, tsx. vercel.json with SPA rewrite and zero-egress CSP headers (connect-src 'none'). .gitignore, .env.example, README.md skeleton.
- **Files Modified**: `package.json`, `package-lock.json`, `vite.config.ts`, `vercel.json`, `.env.example`, `README.md`, `.gitignore`, `prompt.md`.
- **Key Decisions**: Used `@tailwindcss/vite` plugin for Vite 6+ integration with Tailwind v4. Added strict CSP headers with `connect-src 'none'` in `vercel.json`. Included `tsx` for smoke script executions.
- **Issues Resolved**: None.

### Step 2: Design Tokens & Base Styles [2026-10-09T13:58:40+05:30]
- **Prompt/Instruction Summary**: Crisp executive aesthetic. Tokens for zinc-50 background, white rounded-2xl cards with 1px border and soft shadow, warm orange gradient (.btn-primary, 44px min height, focus ring), semantic marker badges (.badge-needs-you, .badge-deadline, .badge-decision, .badge-fyi) meeting WCAG AA contrast (> 4.5:1), self-hosted Manrope Variable font.
- **Files Modified**: `src/index.css`, `src/main.tsx`, `index.html`, `prompt.md`.
- **Key Decisions**: Configured `@import "tailwindcss";` in Tailwind v4 alongside custom CSS variables. Verified WCAG AA contrast by pairing 700-weight text with 50-weight backgrounds. Self-hosted font via `@fontsource-variable/manrope`.
- **Issues Resolved**: None.

### Step 3: Types [2026-10-09T13:59:30+05:30]
- **Prompt/Instruction Summary**: Define core TypeScript interfaces in `src/types.ts` for Message, ParsedChat, Signal, TriageResult, BriefingItem, Briefing, UserContext, and ParseError.
- **Files Modified**: `src/types.ts`, `prompt.md`.
- **Key Decisions**: Defined clean, strict types supporting zero-egress briefing representation with epoch timestamps. Added custom `ParseError` class.
- **Issues Resolved**: None.

### Step 4: WhatsApp Parser (Android + iOS) [2026-10-09T14:01:45+05:30]
- **Prompt/Instruction Summary**: Regex parser in `src/core/parser.ts` for Android and iOS chat exports. Auto-detect date order across all headers (> 12 detection), strip unicode marks (\u200e, \u200f), support 12h/24h and narrow no-break space (\u202f), identify system messages and media placeholders, handle multiline continuations, export `parseChat` and `readUploadedFile` (.txt and .zip with fflate).
- **Files Modified**: `src/core/parser.ts`, `prompt.md`.
- **Key Decisions**: Auto-detected date order through global scan of date parts. Handled zip extraction via `fflate.unzipSync` without network access. Kept file compact (~150 lines).
- **Issues Resolved**: Resolved TypeScript `verbatimModuleSyntax` type-only import requirements for `Message` and `ParsedChat`.

### Step 5: Relative Date Resolution [2026-10-09T14:04:30+05:30]
- **Prompt/Instruction Summary**: `src/core/dates.ts` using chrono-node with forwardDate: true and message ts as reference instant. Resolve tomorrow, tonight, by 5 PM, EOD (18:00 same day), Friday, next Monday, on 14th, in 2 hours, by Sunday evening. Ignore matches with neither day nor time-of-day signal, and ignore month words as ordinary text ("may", "march").
- **Files Modified**: `src/core/dates.ts`, `prompt.md`.
- **Key Decisions**: Added ordinal pattern recognizer for "on 14th" and bare "EOD" adjuster (18:00 same day / contextual day). Filtered matches lacking day or time signals. Ignored conversational "now" / "right now" as deadline dates.
- **Issues Resolved**: Handled edge case where chrono does not recognize bare "EOD" and bare ordinals without month.

### Step 19: Architecture Pivot: WebLLM Removed, Redactor + Opt-in Gemini Added [2026-10-09T15:10:00+05:30]
- **Prompt/Instruction Summary**: Pivot to hybrid privacy-gated architecture. Drop WebLLM/WebGPU entirely due to large model download sizes (multi-GB), high client memory consumption, and erratic WebGPU driver support across devices. Introduce client-side deterministic redactor (`src/core/redactor.ts`), selective cloud payload builder (`src/core/payload.ts`), user-keyed Gemini synthesis layer (`src/core/gemini.ts`), key modal (`src/ui/KeyControl.tsx`), executive summary review panel (`src/ui/ExecutiveSummary.tsx`), and 3-state privacy badge (`src/ui/EgressBadge.tsx`).
- **Files Modified**: `vercel.json`, `index.html`, `public/egress-guard.js`, `src/core/redactor.ts`, `src/core/payload.ts`, `src/core/gemini.ts`, `src/hooks/useEgress.ts`, `src/ui/KeyControl.tsx`, `src/ui/EgressBadge.tsx`, `src/ui/ExecutiveSummary.tsx`, `src/ui/BriefingView.tsx`, `src/App.tsx`, `tests/redactor.test.ts`, `tests/gemini.test.ts`, `README.md`, `prompt.md`.
- **Key Decisions**: Privacy-gated architecture where raw messages never reach the network. Only high-signal candidates (triage score >= 25) are pre-filtered, redacted on-device for credentials/PII, and previewed by the user before dispatch.

### Step 20: Visual Refinement, Routing & Full Reconciliation [2026-10-09T15:43:00+05:30]
- **Prompt/Instruction Summary**: Full feature reconciliation against master spec. Visual refresh: Poppins (display 600, 700), Inter (sans 400, 500, 600), JetBrains Mono (mono 400, 500). Tactile orange button system with layered micro-borders and directional shadows (`.btn-primary`), utility button styling (`.btn-secondary`). Asymmetric, high-density cards with left-border accents. On-device IndexedDB refresh persistence (`src/core/store.ts`). Unit tests for RFC 5545 `.ics` structure (`tests/ics.test.ts`) and 10,000 message performance benchmark under 3s (`tests/perf.test.ts`).
- **Files Modified**: `package.json`, `package-lock.json`, `tailwind.config.js`, `src/index.css`, `index.html`, `public/egress-guard.js`, `src/core/parser.ts`, `src/core/briefing.ts`, `src/core/dates.ts`, `src/core/payload.ts`, `src/core/store.ts`, `src/context/ChatContext.tsx`, `src/ui/Navigation.tsx`, `src/ui/Dropzone.tsx`, `src/ui/SetupCard.tsx`, `src/ui/BriefingItemCard.tsx`, `src/ui/ExecutiveSummary.tsx`, `src/ui/GapStrip.tsx`, `src/ui/ContextDrawer.tsx`, `src/pages/HomePage.tsx`, `src/pages/SetupPage.tsx`, `src/pages/BriefingPage.tsx`, `src/pages/PrivacyPage.tsx`, `src/pages/HelpPage.tsx`, `src/pages/NotFoundPage.tsx`, `tests/store.test.ts`, `tests/ics.test.ts`, `tests/perf.test.ts`, `README.md`, `prompt.md`.

### Step 21: Server-Side Gemini Proxy & Rebrand to SplitOff [2026-10-09T16:10:00+05:30]
- **Prompt/Instruction Summary**: Replace client BYOK flow with a secure server-side Gemini proxy (`api/summarize.ts`). Rebrand product across all documentation, UI, and packages to SplitOff. Set up seamless Vercel deployment with `@vercel/node` and zero-key flow for users and hackathon judges.
- **Files Modified**: `api/summarize.ts`, `vercel.json`, `package.json`, `tsconfig.node.json`, `index.html`, `public/egress-guard.js`, `src/core/gemini.ts`, `src/hooks/useEgress.ts`, `src/context/ChatContext.tsx`, `src/ui/Navigation.tsx`, `src/ui/ExecutiveSummary.tsx`, `src/ui/BriefingView.tsx`, `src/ui/EgressBadge.tsx`, `src/pages/BriefingPage.tsx`, `src/pages/PrivacyPage.tsx`, `src/pages/HelpPage.tsx`, `tests/api.test.ts`, `tests/gemini.test.ts`, `README.md`, `prompt.md`.
- **Key Decisions**:
  - Implemented serverless proxy `api/summarize.ts` with POST-only checks (405), Origin checks (403), IP rate limiting (8 req/min, 429), 16 KB body limit, and defense-in-depth re-redaction.
  - Eliminated client key management: `KeyControl.tsx` deleted, `apiKey` removed from `ChatContext` and localStorage/sessionStorage.
  - Configured Vercel rewrites: `/((?!api/).*)` to `/index.html` with strict CSP `connect-src 'self'`.
  - Added 12 comprehensive unit tests in `tests/api.test.ts` covering proxy validation and error handling.
- **Issues Resolved**: Added explicit `.ts` extension to `api/summarize.ts` imports for Node ECMAScript compatibility, fixed unused imports in `EgressBadge.tsx`.

---

## Gen AI Disclosure
Engine 1 uses no generative AI. Optional, user-triggered: up to 40 locally redacted high-signal lines are sent through a serverless proxy (api/summarize.ts, key held only in a Vercel environment variable) to Gemini 2.5 Flash to produce a 2-sentence summary. Without a click, or on any failure, the deterministic summary is used.

---

## Architecture Principles
- **Deterministic-first**: Engine 1 always works, zero-fail; any AI is optional and secondary.
- **Client-only core**: Static SPA with all parsing, triage scoring, clustering, and calendar creation in RAM.
- **Privacy-gated proxy**: Redact on-device first, server re-redacts (defense-in-depth), same-origin verified, key held only in server environment variable, explicit click required.
- **Grounded**: sourceMessageIds from code only, zero hallucinations.
