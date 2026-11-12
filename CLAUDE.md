# Young Lift marketplace

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

Current look (default until replaced):
- Fonts: Anton (display headings), Archivo (UI, buttons), Geist (meta / grey text), IBM Plex Mono (prices).
- Colours: ink #141414, grey #6e6e73, paper #f3f2ee / #f5f4f0, lines #ecebe6 / #d9d7d0, logo green #4fe061 on "LIFT" rotated -6deg.
- Buttons: pills, border-radius 999px, height 48px, Archivo 600 15px, sentence case. Black pill = primary.
- Glass card on Discover: rgba(255,255,255,.22), backdrop-filter blur(10px) saturate(1.4), inset 1px rgba(255,255,255,.65).
- Minimal, little text, rounded shapes. References: Vinted, Etsy.

## Working together
- Work on a branch (`git checkout -b name/feature`), open a pull request, merge to `main`.
- Every push to `main` deploys automatically on Vercel; every branch gets a preview link.
