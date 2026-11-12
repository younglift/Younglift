# Brief for Matas's AI

You are working with **Matas** on Young Lift. Read `CLAUDE.md` and `docs/ai/SHARED.md` first. Matas owns **what people see**: every buyer screen, the maker Studio, and the content (makers, photos, texts). Justinas (and his AI) builds the engine in parallel.

Talk to Matas in Lithuanian, short and plain. He is a creative strategist, not a developer: explain in one line what you did and what to check, no jargon. Write code, comments and commits in English.

## Before you start
Wait until Justinas's day-1 PR (Next.js scaffold + `lib/data` mocks) is merged into `main`. Until then, help Matas with content (see the bottom). Then `git pull origin main`.

## Your job: port the prototype faithfully
`prototype/index.html` is the source of truth. Rebuild each screen as Next.js pages + components with CSS Modules, matching it pixel for pixel on phone and desktop. **Design is LOCKED** (CLAUDE.md): never change fonts, colours, buttons, radius or copy unless Matas explicitly asks. Get all data from `@/lib/data` only, never from Supabase or Stripe directly.

## Order of work (one PR each)
1. **Shell**: header, bottom nav (phone), footer, `globals.css` tokens, shared components (Button pills, Tag, ProductCard, MakerAvatar, Toast, GlassCard).
2. **Discover** `/`: full-screen vertical snap scroll, one maker per screen, horizontal swipe through their media, video autoplay muted when visible, glass card with name, quote, "Meet the maker". Load more with `getFeed` cursor. This is the heart of the product: make it smooth on iPhone Safari.
3. **Taste setup** `/welcome`: 3 steps, skippable, `saveTaste`.
4. **Maker world** `/m/[slug]`: cover, portrait, studio name, bio, Follow / Message, tabs (Pieces, Journal, About), product grid. Supports `style: light | bold`.
5. **Product** `/p/[id]`: gallery, maker first, price, variants, Add to bag, save to board.
6. **Explore / search** `/explore`: categories, price filter, results for makers + pieces.
7. **Saved + boards** `/saved`, **Following** `/following`, **Bag** `/bag` (the Pay button calls `POST /api/checkout`, which is Justinas's), **Account** `/account` (orders, taste).
8. **Studio** `/studio`: profile editor with live preview (exists in the prototype), list/add/edit pieces with image upload (`uploadImage`), orders to ship (`markShipped`), "Connect payouts" button (Justinas gives you the URL function).
9. **Legal pages** from `content/*.md`: Terms, Privacy, Returns (14 days), Imprint.

## Rules
- Don't edit Justinas's folders. Missing data or a function? Tell Matas to ask Justinas, or note it in the PR.
- Need an npm package? Ask Justinas (he owns `package.json`).
- Every screen must work at 375px wide and on desktop. Check both on the Vercel preview before asking Matas to review.
- Small PRs, `npm run build` green. In the PR, list exactly which pages to click.
- Images: use `next/image`, 4:5 product crops.

## Content work (Matas's second job, help him with it)
- Target: 15–20 approved makers for launch, each with a portrait, cover, 5+ pieces with real photos (no AI images on the live site), a one-line quote, a short bio, prices.
- Help Matas write: the maker application form questions, the outreach message to makers, and the legal texts (draft them, then recommend a lawyer check).
- Store maker content in `content/makers/<slug>/` until Studio works, so Justinas can seed it.
