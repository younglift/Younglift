# Young Lift

Marketplace for young makers. Next.js (App Router) + TypeScript, deployed on Vercel from `main`.

## Run it locally
1. Install Node.js 20 or newer.
2. `npm install`
3. `cp .env.example .env.local` (values come later; mocks work without them)
4. `npm run dev` and open http://localhost:3000

Before opening a PR: `npm run build` must pass.

## Where things are
- `prototype/` – the clickable prototype, source of truth for screens and copy. Also served live at `/prototype/index.html` (copy in `public/prototype/`).
- `app/` – Next.js pages. `/` redirects to the prototype until Discover is built (see `next.config.mjs`).
- `lib/types.ts` – shared data types.
- `lib/data` – the only place UI gets data from. Today it is mock data from the prototype; later Supabase, same functions.
- `lib/format.ts` – `formatEUR(cents)`.
- `docs/` – work plan and AI briefs.
