// Mock implementation of the data contract (docs/ai/SHARED.md).
// State lives in memory: it resets on reload / server restart. Supabase replaces this later
// with the same function signatures, so screens built on it keep working.
import type { Bag, Me } from './contract';
import type { BagLine, Board, Category, FeedItem, Maker, Order, Product, Taste } from '@/lib/types';
import { MAKERS, MAKER_EXTRAS, PRODUCTS } from './mock-data';

const state = {
  me: { id: 'demo-buyer', name: 'Lea Meier', role: 'buyer' as const, taste: { categories: [] as Category[], styles: [] as string[], materials: [] as string[] } },
  follows: new Set<string>(),
  saves: new Set<string>(['fold', 'ripple', 'hood']),
  boards: [
    { id: 'b1', name: 'Rings I like', productIds: ['fold'] },
    { id: 'b2', name: 'Gifts for my sister', productIds: ['hood', 'ripple'] },
  ] as Board[],
  bag: [] as BagLine[],
  orders: [] as Order[],
  makers: MAKERS.map((m) => ({ ...m })),
  products: PRODUCTS.map((p) => ({ ...p })),
  myMakerId: 'inez',
};

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));
const withMaker = (m: Maker): Maker => ({ ...m, isFollowing: state.follows.has(m.id) });
const withProduct = (p: Product): Product => ({ ...p, isSaved: state.saves.has(p.id) });
const findMaker = (id: string) => state.makers.find((m) => m.id === id);
const findProduct = (id: string) => state.products.find((p) => p.id === id);

export async function getFeed(opts: { cursor?: string; taste?: Taste } = {}): Promise<{ items: FeedItem[]; nextCursor?: string }> {
  const taste = opts.taste ?? state.me.taste;
  const pageSize = 5;
  const start = opts.cursor ? parseInt(opts.cursor, 10) || 0 : 0;
  // Taste matches first, followed makers boosted, then everyone else.
  const score = (m: Maker) =>
    (taste.categories.some((c) => m.categories.includes(c)) ? 2 : 0) + (state.follows.has(m.id) ? 1 : 0);
  const ordered = [...state.makers].sort((a, b) => score(b) - score(a));
  const page = ordered.slice(start, start + pageSize);
  const items: FeedItem[] = page.map((m) => {
    const x = MAKER_EXTRAS[m.id];
    const closer = x ? findProduct(x.closerProductId) : undefined;
    const media = x
      ? [...x.work, x.meet.image, x.process.image, ...(closer ? closer.images.slice(0, 1) : [])]
      : [m.coverUrl, m.portraitUrl];
    return {
      maker: withMaker(m),
      media: media.map((url) => ({ type: 'image' as const, url })),
      products: state.products.filter((p) => p.makerId === m.id).map(withProduct),
    };
  });
  const next = start + pageSize;
  return clone({ items, nextCursor: next < ordered.length ? String(next) : undefined });
}

export async function getMaker(slug: string): Promise<Maker | null> {
  const m = state.makers.find((x) => x.slug === slug);
  return m ? clone(withMaker(m)) : null;
}

export async function getMakerProducts(makerId: string): Promise<Product[]> {
  return clone(state.products.filter((p) => p.makerId === makerId).map(withProduct));
}

export async function getProduct(id: string): Promise<{ product: Product; maker: Maker } | null> {
  const p = findProduct(id);
  const m = p && findMaker(p.makerId);
  return p && m ? clone({ product: withProduct(p), maker: withMaker(m) }) : null;
}

export async function search(q: string, filters: { category?: Category; maxPriceCents?: number } = {}): Promise<{ makers: Maker[]; products: Product[] }> {
  const t = q.trim().toLowerCase();
  const hit = (s: string) => !t || s.toLowerCase().includes(t);
  const makers = state.makers.filter((m) =>
    hit(`${m.name} ${m.studio} ${m.city} ${m.categories.join(' ')}`) &&
    (!filters.category || m.categories.includes(filters.category)));
  const products = state.products.filter((p) => {
    const m = findMaker(p.makerId);
    return hit(`${p.title} ${p.materials.join(' ')} ${m?.name ?? ''}`) &&
      (!filters.category || p.category === filters.category) &&
      (filters.maxPriceCents === undefined || p.priceCents <= filters.maxPriceCents);
  });
  return clone({ makers: makers.map(withMaker), products: products.map(withProduct) });
}

export async function getMe(): Promise<Me | null> {
  return clone(state.me);
}

export async function saveTaste(t: Taste): Promise<void> {
  state.me.taste = clone(t);
}

export async function toggleFollow(makerId: string): Promise<boolean> {
  if (state.follows.has(makerId)) { state.follows.delete(makerId); return false; }
  state.follows.add(makerId); return true;
}

export async function toggleSave(productId: string): Promise<boolean> {
  if (state.saves.has(productId)) {
    state.saves.delete(productId);
    state.boards.forEach((b) => { b.productIds = b.productIds.filter((id) => id !== productId); });
    return false;
  }
  state.saves.add(productId); return true;
}

export async function getBoards(): Promise<Board[]> {
  return clone(state.boards);
}

export async function createBoard(name: string): Promise<Board> {
  const board: Board = { id: `b${Date.now()}`, name: name.trim() || 'New board', productIds: [] };
  state.boards.push(board);
  return clone(board);
}

export async function addToBoard(boardId: string, productId: string): Promise<void> {
  const b = state.boards.find((x) => x.id === boardId);
  if (!b) return;
  state.saves.add(productId);
  if (!b.productIds.includes(productId)) b.productIds.push(productId);
}

export async function getBag(): Promise<Bag> {
  return clone(state.bag);
}

const sameLine = (a: BagLine, b: BagLine) =>
  a.productId === b.productId && JSON.stringify(a.variant ?? {}) === JSON.stringify(b.variant ?? {});

export async function addToBag(line: BagLine): Promise<void> {
  const p = findProduct(line.productId);
  if (!p || p.stock <= 0) return;
  const existing = state.bag.find((l) => sameLine(l, line));
  if (existing) existing.qty += line.qty;
  else state.bag.push(clone(line));
}

export async function updateBag(lines: BagLine[]): Promise<void> {
  state.bag = clone(lines.filter((l) => l.qty > 0));
}

export async function getOrders(): Promise<Order[]> {
  return clone(state.orders);
}

// ---- Studio (maker side) ----

export async function getMyMaker(): Promise<Maker | null> {
  const m = findMaker(state.myMakerId);
  return m ? clone(withMaker(m)) : null;
}

export async function updateMyMaker(patch: Partial<Maker>): Promise<void> {
  const m = findMaker(state.myMakerId);
  if (!m) return;
  const { id: _id, slug: _slug, ...rest } = patch;
  Object.assign(m, rest);
}

export async function upsertProduct(p: Partial<Product>): Promise<Product> {
  const existing = p.id ? findProduct(p.id) : undefined;
  if (existing) {
    Object.assign(existing, { ...p, makerId: existing.makerId });
    return clone(existing);
  }
  const created: Product = {
    id: p.id ?? `p${Date.now()}`, makerId: state.myMakerId, title: p.title ?? 'Untitled piece',
    description: p.description ?? '', priceCents: p.priceCents ?? 0, currency: 'EUR', images: p.images ?? [],
    category: p.category ?? 'other', materials: p.materials ?? [], variants: p.variants,
    stock: p.stock ?? 1, oneOfAKind: p.oneOfAKind ?? false, shippingCents: p.shippingCents ?? 490,
  };
  state.products.push(created);
  return clone(created);
}

export async function deleteProduct(id: string): Promise<void> {
  state.products = state.products.filter((p) => !(p.id === id && p.makerId === state.myMakerId));
}

export async function uploadImage(file: File): Promise<string> {
  // Mock: a local preview URL in the browser. Real version uploads to Supabase Storage.
  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') return URL.createObjectURL(file);
  return '';
}

export async function markShipped(orderId: string, _tracking?: string): Promise<void> {
  const o = state.orders.find((x) => x.id === orderId);
  if (o && o.status === 'paid') o.status = 'shipped';
}
