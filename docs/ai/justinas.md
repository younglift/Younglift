# Brief for Justinas's AI

You are working with **Justinas** on Young Lift. Read `CLAUDE.md` and `docs/ai/SHARED.md` first. Justinas owns the **engine**: project setup, data, auth, payments, orders, emails, admin. Matas (and his AI) builds the screens in parallel and depends on you, so **unblock him first**.

Talk to Justinas in Lithuanian, short and plain. Write code, comments and commits in English.

## Day 1: unblock Matas (highest priority, ship as one PR before anything else)
1. Scaffold Next.js (App Router, TypeScript, ESLint) in the repo root. Move the prototype to `prototype/index.html` + `prototype/img/` so it stays viewable.
2. Fonts via `next/font/google`: Anton, Archivo, Geist, IBM Plex Mono.
3. Create an empty `app/globals.css` with the `:root` tokens copied from the prototype (Matas owns it after this).
4. `lib/types.ts` exactly as in SHARED.md.
5. `lib/data/index.ts` + `lib/data/mock.ts`: every function from the contract, backed by mock data copied from the prototype (makers Mara, Inez etc., their products, images from `public/img/`). Keep state in memory or cookies.
6. `lib/format.ts` with `formatEUR(cents)`.
7. `.env.example`, a README "how to run" section, `npm run build` passing, Vercel still deploying.
Then tell Justinas: "Matas can start."

## Then, in order
1. **Supabase**: migrations for `profiles`, `makers`, `maker_applications`, `products`, `media`, `posts`, `follows`, `saves`, `boards`, `board_items`, `bag_items`, `orders`, `order_items`, `messages`. Row Level Security on every table (buyers see only their own saves, bag, orders; makers edit only their own maker row and products; public read for approved makers and their products). Storage bucket `media`. Seed script with the mock data.
2. **Auth**: email magic link + Google. `middleware.ts` protects `/studio`, `/admin`, `/account`.
3. **Swap mocks for real** inside `lib/data` without changing any signature. Matas's screens must keep working untouched.
4. **Feed logic** (`getFeed`): approved makers matching taste categories/materials first, followed makers boosted, one "surprise" maker every ~5 items, cursor pagination. No ML.
5. **Stripe Connect**: makers onboard via Express account links from Studio. `POST /api/checkout` creates a Checkout Session; split the bag per maker (one PaymentIntent per maker using destination charges with `application_fee_amount` = commission). The commission % lives in one env var `COMMISSION_PERCENT`. Webhook `app/api/stripe/webhook` marks orders paid. Use test mode until founders say go.
6. **Orders + emails (Resend)**: buyer order confirmation, shipped; maker new order. Maker marks order shipped in Studio (Matas builds the button, you provide `markShipped(orderId, tracking?)` in `lib/data`).
7. **Admin** (`/admin`, role = admin): list maker applications, approve/reject, list orders.

## Rules
- Do not edit Matas's folders (see SHARED.md). If his screen needs data that the contract lacks, add a function to `lib/data` and tell him in the PR.
- Changing `lib/types.ts` needs a PR Matas approves.
- Never commit secrets: the repo is public.
- Small PRs, `npm run build` green, describe what to click on the preview.
- If something blocks you for >30 min (accounts, keys, a decision), ask Justinas instead of guessing.

## Open decisions (ask Justinas, don't assume)
Commission %, shipping model (maker sets vs flat), company entity for Stripe.
