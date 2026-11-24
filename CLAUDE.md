# Uplift marketplace

Marketplace for handmade makers (jewellery, ceramics, crochet and more). Two founders work in this repo: Justinas and Matas.

## Current state
- `prototype/index.html` + `prototype/img/` is the clickable prototype (Round 2, all 12 steps locked) and the source of truth for screens.
- The app is Next.js (App Router, TypeScript). UI gets data only from `@/lib/data` (mock today, Supabase later). See `docs/ai/SHARED.md`.

## What is locked and what is open (updated 2026-11-12)
**LOCKED: flows and behaviour.** The prototype defines which screens exist, what opens what, the order of steps, and how things move (vertical feed, swipe sideways through a maker, taste setup, bag, checkout, Studio). Do not change these without both founders' OK.

**OPEN: the visual look (design phase, ~3 days, led by Matas).** Colours, fonts, buttons, cards, spacing, imagery and mood are being redesigned step by step, following the buyer journey first, then the maker journey. Progress lives in `docs/design/JOURNEY.md`. Decided styles go into the tokens in `app/globals.css`, and that file is the single source of truth for the look.
- Until a step is marked decided in `docs/design/JOURNEY.md`, the current look below stays the default.
- Never hard-code colours, fonts or radii in components. Always use CSS variables from `app/globals.css`, so a redesign means changing tokens, not every screen.
- Only Matas (or Justinas with Matas's OK) decides visual changes. Don't restyle on your own initiative.

Current look: **direction 07 "Tamsus stiklas" (decided 2026-11-23, buyer journey).** Full spec: `docs/design/HANDOFF-07.md`, screens in `docs/design/screens/`, tokens `--u-*` in `app/globals.css`.
- Fonts: Rock Salt (maker names, piece titles, screen titles), Inter (everything else).
- Colours: base #665e58 under a blurred product photo, dark glass cards, cream text #fffaed, one accent butter #f3d27a.
- Buttons: pills 999px, primary 48px cream with a hard 3px #b8912f bottom edge; min tap 44px.
- Logo (2026-11-16): **uplift community**, files in `public/brand/`. Use the files, never redraw it. On dark backgrounds use the white version.
- Stickers: `public/stickers/` (maker-set and Uplift-set, rules in HANDOFF-07).
- Old tokens (Anton/Archivo, ink #141414, paper #f3f2ee) stay in globals.css only until every screen is moved to `--u-*`.
- Maker journey (Studio etc.) look is still open.

## Working together
- Work on a branch (`git checkout -b name/feature`), open a pull request, merge to `main`.
- Every push to `main` deploys automatically on Vercel; every branch gets a preview link.
