// Shared data contract (docs/ai/SHARED.md). Changes need a PR both founders approve.
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
