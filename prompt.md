# CatchUp Zero — Project Tracker & Log

## Current State
- **What is built**: Project scaffold, design tokens, core domain types, WhatsApp parser, relative date resolution, deterministic triage heuristics, and briefing builder (`src/core/briefing.ts`) with unread slice filtering, candidate selection (score >= 25), 15-minute clustering, deterministic templating, and prioritized ordering.
- **What works**: Unread slice slicing, multi-message clustering, grounded citation linking to original message IDs, priority sorting (needs_you -> deadline -> decision -> fyi).
- **What is broken**: Nothing broken.
- **Next step**: Step 8 — Calendar export (`src/core/ics.ts`).

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
- **Key Decisions**: Added ordinal pattern recognizer for "on 14th" and bare "EOD" adjuster (18:00 same day / contextual day). Filtered matches lacking day or time signals.
- **Issues Resolved**: Handled edge case where chrono does not recognize bare "EOD" and bare ordinals without month.

### Step 6: Triage Heuristics [2026-10-09T14:05:30+05:30]
- **Prompt/Instruction Summary**: `src/core/triage.ts` exporting `triage(messages, user)`. System messages & user.me score 0. Weighted signals: mention (+40), direct_question (+25), open_question (+10), deadline (+25, +10 within 48h), urgent (+15), decision (+20). Cap score at 100. Human-readable reasons for each signal.
- **Files Modified**: `src/core/triage.ts`, `prompt.md`.
- **Key Decisions**: Computed contextual direct question detection combining verbs/question marks with alias or preceding user message within 10 minutes.
- **Issues Resolved**: None.

### Step 7: Briefing Builder [2026-10-09T14:06:30+05:30]
- **Prompt/Instruction Summary**: `src/core/briefing.ts` exporting `buildBriefing(chat, user)`. Unread slice (ts > lastReadAt), candidates (score >= 25), 15m consecutive clustering, classification (needs_you, deadline, decision, fyi), deterministic grounded summaries, sorting by priority & score.
- **Files Modified**: `src/core/briefing.ts`, `prompt.md`.
- **Key Decisions**: Clustered candidates within 15-minute bursts to prevent duplicate action items. Guaranteed grounded citation by attaching `sourceMessageIds`.
- **Issues Resolved**: None.

---

## Gen AI Usage
Engine 1 uses no generative AI. Pure heuristics.

---

## Architecture Principles
- **Zero-egress**: Nothing leaves the device, enforced by CSP `connect-src 'none'` plus a visible network trap.
- **Deterministic-first**: Engine 1 is rule-based and instant; any AI is optional and secondary.
- **Client-only**: Static SPA, no backend.
- **Grounded**: Every briefing item cites real message ids.
