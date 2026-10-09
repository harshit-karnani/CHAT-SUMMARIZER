# CatchUp Zero — Project Tracker & Log

## Current State
- **What is built**: Project scaffold, design tokens, core domain interfaces, and WhatsApp parser (`src/core/parser.ts`) supporting both Android and iOS formats, 12h/24h timestamps, narrow no-break space normalization, date order auto-detection (dmy vs mdy), system messages, media placeholders, continuation lines, typed `ParseError`, and `.zip`/`.txt` reading via `fflate`.
- **What works**: WhatsApp parsing for Android and iOS formats, clean TypeScript compilation, and build.
- **What is broken**: Nothing broken.
- **Next step**: Step 5 — Relative date resolution (`src/core/dates.ts`).

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

---

## Gen AI Usage
Engine 1 uses no generative AI. Pure heuristics.

---

## Architecture Principles
- **Zero-egress**: Nothing leaves the device, enforced by CSP `connect-src 'none'` plus a visible network trap.
- **Deterministic-first**: Engine 1 is rule-based and instant; any AI is optional and secondary.
- **Client-only**: Static SPA, no backend.
- **Grounded**: Every briefing item cites real message ids.
