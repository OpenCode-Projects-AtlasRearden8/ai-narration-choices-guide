# The Audiobook Voice Decision Guide

An author's manual on **audiobook narration choices** — should your audiobook be
narrated by a hired human voice, an AI voice, or you? Written in plain English, step by
step, like a friend would explain it. Never condescending, no vendor kickbacks.

**A companion, not an echo.** This guide deliberately *complements* **Audiobook
Recording Handbook** (the self-recording craft manual) without repeating it: here you
decide *who reads your book and how to hire them well*; there you learn *how to record
it yourself*.

## What's inside

- **Hiring human vs AI voice** — the honest trade-offs, including what AI is genuinely
  bad at today
- **Platform rules compared in plain words** — Audible/ACX, Findaway/Spotify, Google
  Play, and your own store: exclusivity, royalties, AI-voice rules, in one table
- **Sample-listening rubrics** — a five-dimension scorecard (voice–book fit, pacing,
  character differentiation, technical polish, chapter consistency) with red flags and
  decision bands
- **Rights and disclosure basics** — ownership, contract minimums, AI-narration
  disclosure, privacy of your materials
- **Budget ladders** — five rungs from $0 DIY to premium pro, with per-finished-hour
  math and payback reality checks
- **Launch-day QC checklist** — audio, metadata, platform, and human tests before you
  cash the re-upload spiral

Plus four printable worksheets (voice decision, rubric scorecard, budget-ladder
planner, launch-day QC) and two interactive web tools.

## Repository layout

```
docs/               the manual in Markdown (7 chapters + 4 worksheets, plain and searchable)
site/               static HTML site — no frameworks, no external dependencies
  pages/            generated from docs/ (do not edit by hand; run npm run build)
  js/               interactive logic (decision tree, listening-rubric scorer)
scripts/            build script (docs -> HTML), tiny local server (no dependencies)
tests/              zero-dependency test suite
```

## Build, test, run

Node.js 18+ required. No packages to install.

```bash
npm run build   # regenerate site/pages/ from docs/*.md
npm test        # run the test suite (build parity, link integrity, logic, hygiene)
npm start       # serve site/ at http://localhost:8642
```

You can also just open `site/index.html` directly in a browser — everything is static
and local-first.

## What the tests check

- The site builds and all 11 pages are generated from their Markdown sources
- Every internal link in every HTML page and Markdown file resolves
- Page structure (nav, main content, Asdale Dynamics footer) on every page
- The decision-tree logic across all scenario branches (fiction vs nonfiction,
  budget rungs, schedule, author-voice branding)
- The rubric scorer's decision bands and input clamping
- Hygiene: no affiliate/referral link patterns, no secrets, credits present,
  MIT license line intact

## Privacy, honesty, and money

- **No secrets, API keys, or personal data** in this repository
- **No affiliate links, referral codes, or vendor compensation of any kind** — when
  platforms are named, it's because you'll meet them anyway. Figures quoted are
  approximations to compare deal *shapes*; always verify current terms on the
  platform's own page before signing
- All content is **educational, not legal advice**

## Credits

Written and maintained by **Asdale Dynamics, LLC** — beginner-friendly AI education,
books, and practical tools. Companion project: *Audiobook Recording Handbook*.

Copyright (c) 2026 Asdale Dynamics, LLC. Licensed under the [MIT License](LICENSE).
