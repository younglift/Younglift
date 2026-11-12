# Young Lift marketplace

Marketplace for handmade makers (jewellery, ceramics, crochet and more). Two founders work in this repo: Justinas and Matas.

## Current state
- `prototype/index.html` + `prototype/img/` is the clickable prototype (Round 2, all 12 steps locked) and the source of truth for screens.
- The app is Next.js (App Router, TypeScript). UI gets data only from `@/lib/data` (mock today, Supabase later). See `docs/ai/SHARED.md`.

## Design rules (LOCKED, do not change without the founders' explicit OK)
- Fonts: Anton (display headings), Archivo (UI, buttons), Geist (meta / grey text), IBM Plex Mono (prices).
- Colours: ink #141414, grey #6e6e73, paper #f3f2ee / #f5f4f0, lines #ecebe6 / #d9d7d0, logo green #4fe061 on "LIFT" rotated -6deg.
- Buttons: pills, border-radius 999px, height 48px, Archivo 600 15px, sentence case. Black pill = primary.
- Glass card on Discover: rgba(255,255,255,.22), backdrop-filter blur(10px) saturate(1.4), inset 1px rgba(255,255,255,.65).
- Minimal, little text, rounded shapes. References: Vinted, Etsy.
- Change structure only when asked. Never restyle buttons, fonts or colours on your own. Ask before changing anything locked.

## Working together
- Work on a branch (`git checkout -b name/feature`), open a pull request, merge to `main`.
- Every push to `main` deploys automatically on Vercel; every branch gets a preview link.
