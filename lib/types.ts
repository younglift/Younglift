// Shared data contract (docs/ai/SHARED.md). Updated 2026-11-24 for design 07 (docs/design/HANDOFF-07.md).
// Changes need a PR both founders approve. Money is always integer cents.

export type Category = 'jewelry' | 'ceramics' | 'crochet' | 'clothing' | 'accessories' | 'home' | 'prints' | 'other'
export type Country = 'LT' | 'LV' | 'EE' | 'PL' | 'DE'

/** applied → approved (sees Studio, profile hidden) → live (buyers can find her). */
export type MakerStatus = 'applied' | 'approved' | 'live'
/** Slides buyers swipe through on her profile (profile editor step 4). */
export type Slide = 'work' | 'meet' | 'process' | 'piece'
/** How the maker wants to be called (FIXES 12.4). Missing = 'they'. Copy uses the maker's name; pronoun() only for the rare sentence that needs one. */
export type Pronouns = 'she' | 'he' | 'they'

export type Maker = {
  id: string; slug: string; name: string; studio: string; city: string; country: Country
  categories: Category[]
  pronouns?: Pronouns        // default 'they'
  tagline: string            // "One line about your work" (≤140)
  bio: string
  portraitUrl: string
  coverUrl: string           // separate from the avatar
  video?: { posterUrl: string; caption: string; seconds: number; hasCaptions: boolean }
  status: MakerStatus
  liveAt?: string            // ISO; "New maker" sticker for 30 days after this
  followers: number
  shipsInDays: [number, number]
  replyHours?: number        // median reply time; hidden when slow (> 72h)
  lastActiveAt?: string      // "Active now" within 15 min, otherwise "Offline"
  customRequestsOpen: boolean
  giftWrap?: { enabled: boolean; priceCents: number; description: string }
  freeShippingFromCents?: number
  collage: string[]          // 3 product ids that open her profile
  slideOrder: Slide[]
  thankYouNote?: string
  isFollowing?: boolean
  rating?: { avg: number; count: number }   // computed from reviews
}

/** Sticker the maker picks for one piece (max 1). */
export type MakerSticker = 'one_of_one' | 'handmade' | 'small_batch' | 'made_in_city' | 'made_in_collab' | 'made_to_order'
/** Stickers Uplift adds, computed from data, never set by hand. */
export type UpliftSticker = 'new_maker' | 'just_dropped' | 'last_one_left' | 'back_in_stock' | 'in_progress' | 'picked_for_you'
export type Stickers = { maker?: MakerSticker; uplift?: UpliftSticker }

export type Product = {
  id: string; makerId: string; title: string; description: string
  subtitle?: string          // short line, e.g. "Set of 3", "Oat glaze"
  priceCents: number; currency: 'EUR'; images: string[]
  hero?: { tall: string; wide: string }   // Discover photos made for the screen: tall 9:16 phone, wide 4:3 desktop (DISCOVER.md 1.5)
  category: Category; kind?: string   // e.g. Rings, Necklaces (Explore sub-filter)
  materials: string[]
  sizes?: { label: string; options: string[]; unavailable?: string[] }
  madeToOrder: boolean
  stock: number              // ready pieces left (made to order: ignored)
  madeCount: number          // how many she made in total (1 = one of a kind)
  shipsWithinDays: number    // ready: days to ship, made to order: days to make
  shippingCents: number
  makerSticker?: MakerSticker; batchSize?: number; collabMakerId?: string
  status: 'live' | 'draft'
  privateFor?: string        // private listing made after a custom request: only this buyer sees it
  createdAt: string; restockedAt?: string
  oneOfAKind: boolean        // madeCount === 1 && !madeToOrder
  sold: boolean              // ready, not made to order, stock 0
  isSaved?: boolean
  stickers?: Stickers        // filled by the data layer
  heldByOther?: boolean      // in someone else's bag right now (cart_holds)
  freeStock?: number         // stock minus other buyers' active holds (filled by the data layer)
}

export type FeedItem = { maker: Maker; products: Product[]; reason?: 'taste' | 'surprise' }
export type Board = { id: string; name: string; productIds: string[] }
export type Taste = { categories: Category[]; styles: string[]; materials: string[] }
export type BagLine = { productId: string; qty: number; variant?: Record<string, string> }
/** A real 15-minute hold on a one-of-a-kind piece (table cart_holds). */
/** A real 15-minute hold on pieces with limited stock (1 of 1, small batch, "X left"); not made to order (table cart_holds). */
export type CartHold = { pieceId: string; cartId: string; qty: number; expiresAt: string }

export type OrderStatus = 'paid' | 'packing' | 'shipped' | 'delivered' | 'refunded'
export type Delivery = 'locker' | 'door'
/** One order per maker (one PaymentIntent each). "Pay for all" shares a paymentGroupId. */
export type Order = {
  id: string; number: number; makerId: string; paymentGroupId: string
  createdAt: string; status: OrderStatus
  lines: (BagLine & { product: Product })[]
  itemsCents: number; shippingCents: number; giftWrapCents: number; totalCents: number
  delivery: Delivery; lockerAddress?: string
  buyer: { name: string; email: string; city: string }
  gift?: { toName: string; note: string; wrap: boolean }
  shipBy: string; trackingNumber?: string; shippedAt?: string; deliveredAt?: string
  returnRequestedAt?: string; returnReason?: string
}

export type Review = { id: string; orderItemId: string; makerId: string; productId: string; rating: number; text: string; who: string; createdAt: string; reply?: string }
export type PostKind = 'video' | 'journal' | 'in_progress'
export type Post = { id: string; makerId: string; kind: PostKind; caption: string; imageUrl?: string; seconds?: number; productIds: string[]; showAsStory?: boolean; createdAt: string }

/** One thread per maker + buyer. fromMe = written by the buyer. buyer defaults to the signed-in buyer ('me'). */
export type ChatMessage = { id: string; makerId: string; buyer?: string; buyerName?: string; fromMe: boolean; text: string; at: string; productId?: string; requestId?: string; listingId?: string; imageUrl?: string }
export type BudgetBand = 'under_100' | '100_200' | '200_400' | 'not_sure'
export type CustomRequest = {
  id: string; makerId: string; kind: string; text: string; photos: string[]
  budget: BudgetBand; when: 'no_rush' | 'by_date'; date?: string
  status: 'sent' | 'replied' | 'agreed' | 'declined'; createdAt: string; buyerName: string; listingId?: string
}

export type MakerApplication = {
  id: string; name: string; email: string; city: string; country: string; link?: string
  categories: Category[]; photos: string[]; about: string; makesItself: boolean
  pronouns?: Pronouns
  status: 'pending' | 'approved' | 'rejected'; createdAt: string; makerId?: string
}

export type MakerStats = { views: number; viewsChangePct: number; saves: number; savesChange: number; followers: number; followersChange: number; avgReplyHours: number; weeklySalesCents: number[] }
