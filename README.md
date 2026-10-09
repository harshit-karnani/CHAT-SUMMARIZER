# CatchUp Zero

> "What did I miss?" briefing for WhatsApp chats. Client-only, zero-egress, deterministic-first.

CatchUp Zero is a private, in-browser intelligence engine that turns noisy WhatsApp chat exports into prioritized, actionable executive briefings without sending a single byte to external servers or AI APIs.

## Architecture Principles

- **Zero-egress**: Nothing leaves the device. The application enforces a strict Content Security Policy (`connect-src 'none'`) ensuring that the browser itself terminates any outbound network calls.
  > *Note on CSP*: `connect-src 'none'` makes the browser itself block all outbound requests; if production shows CSP errors that break the app, relax only the offending directive.
- **Deterministic-first**: Engine 1 is 100% rule-based, deterministic, and instant using in-browser heuristic parsers, chrono date extraction, and scoring algorithms. No generative AI or LLMs are used.
- **Client-only**: Static SPA with no backend servers, databases, or API routes.
- **Grounded**: Every briefing item directly cites real message IDs from the original chat export. No hallucinated content.

## Getting Started

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Run smoke test
npm run smoke

# Build production bundle
npm run build
```
