# Young Lift: shared contract for both AIs

Read `CLAUDE.md` first (flows are LOCKED, the visual look is being redesigned, see `docs/design/JOURNEY.md`). Then read your person's file (`justinas.md` or `matas.md`). This file is what both sides must agree on.

## Product in one paragraph
A curated marketplace for young makers (jewellery, ceramics, crochet, textiles, prints...) that feels like a pop-up market on a phone. Buyers pick their taste, then scroll a vertical feed: one maker per screen (swipe up = next maker, swipe sideways = that maker's photos/video). Tapping a maker opens their "world" (personal shop). Buyers follow makers, save pieces into boards ("For birthday", "For my sister"), message makers, and buy. Makers are accepted by application only. Young Lift takes a commission on each sale. Launch markets: Lithuania, Latvia, Estonia, Poland. UI language: English first.

The clickable prototype `index.html` is the source of truth for screens, copy and behaviour. Port it faithfully; do not redesign.

## Stack (fixed)
- Next.js (App Router) + TypeScript, deployed on Vercel from `main`
- Plain CSS: global tokens in `app/globals.css` (copied from the prototype's `:root`) + CSS Modules per component. No Tailwind, no UI kit.
- Supabase: Postgres, Auth (email magic link + Google), Storage (images)
- Stripe Connect (Express accounts, destination charges + `application_fee_amount`)
- Resend for emails
- Secrets only in `.env.local` and Vercel env vars. The repo is PUBLIC: never commit keys. Keep `.env.example` with empty values.

## Folder ownership (do not edit the other person's folders; ask instead)
| Owner | Paths |
|---|---|
| Justinas | `lib/data/**`, `lib/supabase/**`, `lib/stripe/**`, `supabase/**` (migrations, seed), `app/api/**`, `app/checkout/**`, `app/admin/**`, `emails/**`, `middleware.ts`, `next.config.*`, `package.json` |
| Matas | `app/(site)/**` (all buyer pages), `app/studio/**`, `components/**`, `app/globals.css`, `public/**`, `content/**` (legal texts) |
| Shared, change only via PR both approve | `lib/types.ts`, `CLAUDE.md`, `docs/**` |

Need a new dependency? Matas asks Justinas (he owns `package.json`).

## The data contract (the key to working in parallel)
UI code NEVER talks to Supabase or Stripe directly. It only imports from `@/lib/data`. Justinas ships mock implementations on day 1 (from the prototype's data), then swaps them for real ones without changing signatures.

```ts
// lib/types.ts
export type Category = 'jewelry' | 'ceramics' | 'textiles' | 'clothing' | 'prints' | 'wood' | 'accessories' | 'other'
export type Maker = {
  id: string; slug: string; name: string; studio: string; city: string; country: 'LT' | 'LV' | 'EE' | 'PL'
  categories: Category[]; quote: string; bio: string
  portraitUrl: string; coverUrl: string; introVideoUrl?: string
  style: 'light' | 'bold'; sections: ('featured' | 'pieces' | 'journal' | 'about')[]
  followers: number; isFollowing?: boolean
}
export type Product = {
  id: string; makerId: string; title: string; description: string
  priceCents: number; currency: 'EUR'; images: string[]
  category: Category; materials: string[]; variants?: { name: string; options: string[] }[]
  stock: number; oneOfAKind: boolean; shippingCents: number; isSaved?: boolean
}
export type FeedItem = { maker: Maker; media: { type: 'image' | 'video'; url: string }[]; products: Product[] }
export type Board = { id: string; name: string; productIds: string[] }
export type Taste = { categories: Category[]; styles: string[]; materials: string[] }
export type BagLine = { productId: string; qty: number; variant?: Record<string, string> }
export type Order = { id: string; createdAt: string; status: 'paid' | 'shipped' | 'delivered' | 'refunded'; lines: (BagLine & { product: Product })[]; totalCents: number }
```

```ts
// lib/data/index.ts (signatures; all async)
getFeed(opts: { cursor?: string; taste?: Taste }): { items: FeedItem[]; nextCursor?: string }
getMaker(slug): Maker | null
getMakerProducts(makerId): Product[]
getProduct(id): { product: Product; maker: Maker } | null
search(q: string, filters?: { category?: Category; maxPriceCents?: number }): { makers: Maker[]; products: Product[] }
getMe(): { id: string; name: string; taste: Taste; role: 'buyer' | 'maker' | 'admin' } | null
saveTaste(t: Taste)
toggleFollow(makerId): boolean
toggleSave(productId): boolean
getBoards(): Board[]; createBoard(name): Board; addToBoard(boardId, productId)
getBag(): BagLine[]; addToBag(line); updateBag(lines)
getOrders(): Order[]
// Studio (maker side)
getMyMaker(): Maker | null; updateMyMaker(patch: Partial<Maker>)
upsertProduct(p: Partial<Product>): Product; deleteProduct(id)
uploadImage(file: File): string // returns public URL
```
Money is always integer cents. Format with one shared helper `formatEUR(cents)` in `lib/format.ts` (Justinas creates it on day 1), shown in IBM Plex Mono.

Checkout is Justinas's: UI calls `POST /api/checkout` with the bag and gets a Stripe Checkout URL.

## Git
- Branch per task: `justinas/<thing>` or `matas/<thing>`. Small PRs, at least daily.
- Before starting: `git pull origin main`. Before opening a PR: `npm run build` must pass.
- PR description: what changed + which screen to check on the Vercel preview.
- The other person approves, then merge to `main` (auto-deploys).
- Never force-push `main`.

## Design decisions
Before building any screen, read `docs/design/JOURNEY.md`: the decision log and the navigation rules (back = one step with destination label, tapping the active tab returns to its root, the feed restores position, product is a full page with its own URL) apply to both of you.
