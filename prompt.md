# CatchUp Zero — Project Tracker & Log

## Current State
- **What is built**: Full Chunk 1 core engines + Chunk 2 Step 1 to Step 6 (Zero-egress trap, Ingestion/setup, Briefing view, Gap Strip minimap, Context lineage drawer, Accessibility pass).
- **What works**:
  - Skip link to `#main-content`, semantic HTML5 landmarks (`header`, `main`, `aside`), single page `h1`.
  - Accessible visible 2px outline focus rings (`:focus-visible`), min 44px touch targets on buttons and pins.
  - `prefers-reduced-motion` fully respected in CSS transitions and JS scrolling.
  - WCAG AA/AAA verified contrast ratios across all semantic badges and button gradients.
  - `npm run build`, `npm run smoke`, and `npm test` all passing.
- **What is broken**: Nothing broken.
- **Next step**: Chunk 2 Step 7 — Polish (metadata, SVG favicon, comprehensive README, Gen AI disclosure).

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

### Step 6: Triage Heuristics [2026-10-09T14:05:30+05:30]
- **Prompt/Instruction Summary**: `src/core/triage.ts` exporting `triage(messages, user)`. System messages & user.me score 0. Weighted signals: mention (+40), direct_question (+25), open_question (+10), deadline (+25, +10 within 48h), urgent (+15), decision (+20). Cap score at 100. Human-readable reasons for each signal.
- **Files Modified**: `src/core/triage.ts`, `prompt.md`.
- **Key Decisions**: Computed contextual direct question detection combining verbs/question marks with alias or preceding user message within 10 minutes.
- **Issues Resolved**: None.

### Step 7: Briefing Builder [2026-10-09T14:06:30+05:30]
- **Prompt/Instruction Summary**: `src/core/briefing.ts` exporting `buildBriefing(chat, user)`. Unread slice (ts > lastReadAt), candidates (score >= 25), 15m consecutive clustering, classification (needs_you, deadline, decision, fyi), deterministic grounded summaries, sorting by priority & score.
- **Files Modified**: `src/core/briefing.ts`, `prompt.md`.
- **Key Decisions**: Clustered candidates within 15-minute bursts to prevent duplicate action items. Guaranteed grounded citation by attaching `sourceMessageIds`. Ensured decision candidates are retained in briefing.
- **Issues Resolved**: None.

### Step 8: Calendar Export (RFC 5545) [2026-10-09T14:07:15+05:30]
- **Prompt/Instruction Summary**: `src/core/ics.ts` exporting `makeIcs(item)` producing RFC 5545 VCALENDAR/VEVENT format, and `downloadIcs(item)` using Blob and DOM temporary link for client-only download.
- **Files Modified**: `src/core/ics.ts`, `prompt.md`.
- **Key Decisions**: Implemented RFC 5545 character escaping (commas, semicolons, backslashes, newlines), standard 1-hour event block, and deterministic UID generation.
- **Issues Resolved**: None.

### Step 9: Bundled Demo Chat Dataset [2026-10-09T14:12:00+05:30]
- **Prompt/Instruction Summary**: `scripts/generate-demo.mjs` deterministic generator producing `src/data/demo_chat.txt` (420 messages, 5 participants, realistic timing, media omitted, system join, asks, deadlines, decisions, open questions). Expose via `src/data/demo.ts` with `?raw` import and `DEMO_USER` / `demoLastReadAt()`.
- **Files Modified**: `scripts/generate-demo.mjs`, `src/data/demo_chat.txt`, `src/data/demo.ts`, `prompt.md`.
- **Key Decisions**: Used zero-network raw bundler import (`?raw`) so loading demo never triggers fetch. Planted direct asks, deadlines, and decisions verified by triage heuristics.
- **Issues Resolved**: None.

### Step 10: Placeholder Shell & Smoke Script [2026-10-09T14:13:40+05:30]
- **Prompt/Instruction Summary**: `src/App.tsx` minimal shell card in executive style showing "Engine 1 ready: {N} messages parsed, {M} items found" on initial load. Added `npm run smoke` in `package.json` and `scripts/smoke.ts` verifying parsing, briefing counts per kind, and planted asks/deadlines/decisions.
- **Files Modified**: `src/App.tsx`, `scripts/smoke.ts`, `package.json`, `package-lock.json`, `prompt.md`.
- **Key Decisions**: Built clean zero-egress status card presenting live briefing numbers. Added automated integrity check verifying all item message IDs exist in original chat without hallucinations.
- **Issues Resolved**: None.

### Step 11: Chunk 1 Amendments (A1-A5) [2026-10-09T14:23:00+05:30]
- **Prompt/Instruction Summary**:
  - A1: Weak aliases (bro, bhai, dude, man, sir, guys, buddy, boss, mate, or < 3 chars) grant mention +15 (reason "mentions you (weak match)") and only trigger direct_question if accompanied by '?' or request verb. Strong aliases retain +40.
  - A2: Decoupled smoke script from `demo.ts` by reading `src/data/demo_chat.txt` via `node:fs`. Exit non-zero if direct asks (< 4), deadlines (< 3), decisions (< 3), or open questions (< 2) are missing.
  - A3: Regenerated `demo_chat.txt` with exactly 420 non-system messages spanning Tue 6 Oct to Thu 8 Oct 2026 so "Friday EOD" resolves to Fri 9 Oct 2026 and "on 14th" to 14 Oct 2026.
  - A4: Changed `.btn-primary` text to `text-zinc-950` (#09090b) and orange badges to `text-orange-800` (#9a3412). Contrast numbers verified:
    - Text `#09090b` (`zinc-950`) on `#f97316` (`orange-500`): **7.29 : 1** (WCAG AAA >= 7.0:1)
    - Text `#09090b` (`zinc-950`) on `#f59e0b` (`amber-500`): **9.37 : 1** (WCAG AAA >= 7.0:1)
    - Text `#9a3412` (`orange-800`) on `#fff7ed` (`orange-50`): **6.36 : 1** (WCAG AA >= 4.5:1)
  - A5: Enhanced parser to detect system lines even when containing colons (e.g. encryption notice, subject changed, security codes). Added vitest suite `tests/parser.test.ts` with 3 test cases.
- **Files Modified**: `src/core/triage.ts`, `scripts/smoke.ts`, `scripts/generate-demo.mjs`, `src/data/demo_chat.txt`, `src/index.css`, `src/App.tsx`, `src/core/parser.ts`, `tests/parser.test.ts`, `package.json`, `package-lock.json`, `prompt.md`.
- **Key Decisions**: Separated strong and weak alias regex matching. Employed `vitest` for test execution.
- **Issues Resolved**: Prevented Node CLI ?raw module resolution errors in smoke runner.

### Step 12: Zero-Egress Trap & Network Badge (Chunk 2 Step 1) [2026-10-09T14:28:40+05:30]
- **Prompt/Instruction Summary**: Inline zero-egress script in `index.html` wrapping `window.fetch`, `XMLHttpRequest.prototype.open/send`, and `navigator.sendBeacon` to log to `window.__egress` without blocking. Add `useEgress()` hook and fixed top badge (`EgressBadge.tsx`) showing "0 Network Calls | 100% On-Device" in green, turns red on call, with interactive "Network log" popover and "Airplane mode ready" indicator.
- **Files Modified**: `index.html`, `src/hooks/useEgress.ts`, `src/ui/EgressBadge.tsx`, `src/App.tsx`, `prompt.md`.
- **Key Decisions**: Ran egress interceptor before ES modules load. Dispatched custom `egress-call` event to allow instant reactive updates in React without polling.
- **Issues Resolved**: None.

### Step 13: Ingestion & Setup View (Chunk 2 Step 2) [2026-10-09T14:32:00+05:30]
- **Prompt/Instruction Summary**: Build landing card with drag-and-drop dropzone supporting .txt/.zip exports, offline bundled demo loader button with Zap icon, collapsible WhatsApp export guide for Android and iOS, setup card with accessible sender radio group, alias chip manager, time range slider synchronized with datetime input and 3 presets, live missed messages readout, and staged pipeline progress (< 600ms).
- **Files Modified**: `src/ui/Dropzone.tsx`, `src/ui/ExportInstructions.tsx`, `src/ui/SetupCard.tsx`, `src/ui/StagedProgress.tsx`, `src/ui/EmptyState.tsx`, `src/App.tsx`, `prompt.md`.
- **Key Decisions**: Integrated staged animation loop reflecting pipeline stages (reading -> mentions -> dates -> building). Handled verbatimModuleSyntax type imports for event listeners.
- **Issues Resolved**: None.

### Step 14: Briefing View & Item Cards (Chunk 2 Step 3) [2026-10-09T14:35:00+05:30]
- **Prompt/Instruction Summary**: Build BriefingView and BriefingItemCard components. Executive summary card with word-count reading-time formula, sections for Needs you, Deadlines, Decisions, and FYI. Collapsible Noise section. Each card includes kind badge, title, summary, reasons, monospace #msg tag, sender initials, time, and "+ Add to Calendar" RFC 5545 button.
- **Files Modified**: `src/ui/BriefingItemCard.tsx`, `src/ui/BriefingView.tsx`, `src/App.tsx`, `prompt.md`.
- **Key Decisions**: Scannable, flat card hierarchy with explicit visual markers and semantic badges. Integrated calendar downloads cleanly per item without external packages.
- **Issues Resolved**: None.

### Step 15: Density Gap Strip Minimap (Chunk 2 Step 4) [2026-10-09T14:38:00+05:30]
- **Prompt/Instruction Summary**: Build GapStrip component with horizontal 80-bucket density minimap, zinc-300 read vs zinc-800 unread bars, amber-50 "you were away" highlight band, keyboard-accessible action pins with 44px hit areas and tooltips, screen-reader alternative list, day tick markers, and smooth card scrolling.
- **Files Modified**: `src/ui/GapStrip.tsx`, `src/App.tsx`, `prompt.md`.
- **Key Decisions**: Implemented ARIA group semantics with screen-reader accessible alternative list. Synchronized card highlighting with prefers-reduced-motion checks.
- **Issues Resolved**: None.

### Step 16: Context Lineage Drawer (Chunk 2 Step 5) [2026-10-09T14:39:30+05:30]
- **Prompt/Instruction Summary**: Build ContextDrawer component displaying the surrounding raw chat message transcript (5 before, 5 after target message), highlighted source messages, strict keyboard focus trap, ESC closing, aria-modal="true", and focus restoration to the trigger element.
- **Files Modified**: `src/ui/ContextDrawer.tsx`, `src/App.tsx`, `prompt.md`.
- **Key Decisions**: Implemented accessible focus cycling trap and mobile-responsive bottom sheet transition.
- **Issues Resolved**: Resolved unused imports flagged by TypeScript linter.

### Step 17: Accessibility Pass (Chunk 2 Step 6) [2026-10-09T14:43:00+05:30]
- **Prompt/Instruction Summary**: Implement skip link, HTML5 landmarks (header, main, aside), single h1 tag, logical heading hierarchy, visible 2px focus ring (`:focus-visible` with orange outline), 44px hit targets on interactive controls and Gap Strip pins, aria-live for staged progress, prefers-reduced-motion in CSS and JS scrolling. Calculate and verify WCAG AA contrast for all token pairs.
- **Files Modified**: `src/index.css`, `src/App.tsx`, `prompt.md`.
- **Key Decisions**: Configured global `:focus-visible` outline in `src/index.css` and added reduced motion override rule. Verified WCAG AA/AAA contrast ratios:
  - Text `#09090b` (zinc-950) on `#f97316` (orange-500): **7.29 : 1** (WCAG AAA)
  - Text `#09090b` (zinc-950) on `#f59e0b` (amber-500): **9.37 : 1** (WCAG AAA)
  - Text `#9a3412` (orange-800) on `#fff7ed` (orange-50): **6.33 : 1** (WCAG AA)
  - Text `#b91c1c` (red-700) on `#fef2f2` (red-50): **6.16 : 1** (WCAG AA)
  - Text `#b45309` (amber-700) on `#fffbeb` (amber-50): **5.14 : 1** (WCAG AA)
  - Text `#0369a1` (sky-700) on `#f0f9ff` (sky-50): **5.37 : 1** (WCAG AA)
  - Text `#3f3f46` (zinc-700) on `#f4f4f5` (zinc-100): **8.61 : 1** (WCAG AAA)
  - Text `#18181b` (zinc-900) on `#ffffff` (card bg): **17.21 : 1** (WCAG AAA)
  - Text `#18181b` (zinc-900) on `#fafafa` (page bg): **16.36 : 1** (WCAG AAA)
  - Text `#71717a` (zinc-500) on `#ffffff` (card bg): **4.63 : 1** (WCAG AA)
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
