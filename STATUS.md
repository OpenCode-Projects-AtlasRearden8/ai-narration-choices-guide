# STATUS — The Audiobook Voice Decision Guide

*Last updated: 2026-11-03 · Maintained by Asdale Dynamics, LLC*

## What was built

An author's manual on **audiobook narration choices**, addressing the original goal point
by point:

| Goal item | Delivered |
| --- | --- |
| Hiring human vs AI voice | `docs/01-human-vs-ai-voice.md` — honest trade-offs, incl. what AI is genuinely bad at today |
| Platform rules compared in plain words | `docs/02-platform-rules.md` — ACX, Findaway/Spotify, Google Play, aggregators, own store; exclusivity, royalties, AI rules, one comparison table |
| Sample-listening rubrics | `docs/03-sample-listening-rubric.md` — 5 dimensions × 5 points, red flags, decision bands |
| Rights and disclosure basics | `docs/04-rights-and-disclosure.md` — ownership, contract minimums, AI-narration disclosure, privacy of materials |
| Budget ladders | `docs/05-budget-ladders.md` — five rungs ($0 DIY → $2,500+ pro), PFH math, payback checks |
| Launch-day QC checklist | `docs/06-launch-day-qc.md` — audio, metadata, platform, human test, post-launch hygiene |
| Complements Audiobook Recording Handbook without repeating | Handoff statements in `docs/00-start-here.md`, `docs/01`, `docs/04`, and the README; no mic/room/recording content duplicated |
| Markdown docs/ | 7 chapters + 4 worksheets |
| Static HTML site/ with decision trees and worksheets | `site/` — hub, interactive decision tree, interactive listening-rubric scorer, 11 generated pages; checkboxes on worksheets; print styles |

Other deliverables: `README.md` (placement, run instructions, test coverage, credit to
Asdale Dynamics, LLC), `LICENSE` (MIT, exact line `Copyright (c) 2026 Asdale Dynamics,
LLC`), zero-dependency build and serve scripts, and a zero-dependency test suite.
**No secrets, API keys, or personal data anywhere; no vendor kickbacks or affiliate
links — enforced by a repo hygiene test.**

## How to run it

```bash
npm run build   # regenerate site/pages/ from docs/*.md
npm test        # full test suite
npm start       # serve site/ at http://localhost:8642   (Ctrl-C to stop)
```

No packages to install — Node.js 18+ only. The site also opens directly from
`site/index.html` (fully local, no CDN or network dependencies).

## Verification results (this run)

- `npm test` → **23 passed, 0 failed** (final run)
- `npm run build` → builds all **11 expected pages** into `site/pages/` + manifest
- Local server smoke test → `200` on `/`, `/decision-tree.html`, `/scorecard.html`,
  all 3 chapter pages sampled, all worksheets, CSS and all three JS files; `404` on a
  missing path (correctly handled, with a 404 page)
- Test suite covers: build parity; internal-link integrity (every href/src in every
  page and every Markdown link in docs/ resolves); page structure (nav/main/credits/
  doctype); no leftover Markdown artifacts in HTML; decision-tree logic across all
  branches (fiction-dialogue, fiction-quiet, nonfiction, rungs 0–4, schedule,
  author-voice, rung clamping, missing-input defaults); rubric bands and clamping;
  README/LICENSE contents; no affiliate/referral patterns; no secrets; interactive
  pages reference their JS modules; worksheets render as checkboxes

Bugs found and fixed during verification: server crashed on a wrong `node:url` import
(`dirname` is from `node:path`); a list-continuation bug mangled wrapped Markdown list
items; nested bold-with-italics failed under the old regex parser (replaced with a
tokenizer); two content typos and one garbled table row in the Markdown sources.

## Known gaps

- **Platform figures are approximations** (royalty percentages, AI-program limits,
  PFH floor rates). Deliberately labeled "verify current terms" in the docs; the
  comparison table is a structure map, not a quote source.
- **No browser-automated end-to-end test.** JS logic (decision tree, rubric) is tested
  under Node; page interactivity is code-reviewed rather than driven by a headless
  browser, since the project stays dependency-free.
- **Style sheet is hand-authored and untested in real printers** beyond a print
  media block; the interactive widgets (range sliders, radio wizard) have not been
  exercised on old browsers.
- The "Audiobook Recording Handbook" companion is referenced but lives outside this
  repository; links to it are prose references, not hyperlinks.
- Legal figures (e.g., 7-year exclusive terms on Royalty Share) reflect
  late-2025/2026 information and should be re-verified before publishing decisions.
