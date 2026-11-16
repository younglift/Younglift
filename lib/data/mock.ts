// Mock implementation of the data contract (docs/ai/SHARED.md).
// State lives in memory and, in the browser, is kept in localStorage so a reload keeps the
// bag, saves, follows and taste. Supabase replaces this later with the same function signatures.
import type { Bag, Me } from './contract';
import type { BagLine, Board, Category, FeedItem, Maker, Order, Product, Taste } from '@/lib/types';
import { MAKERS, MAKER_EXTRAS, PRODUCTS } from './mock-data';

/** Messages between the buyer and a maker (one thread per maker). Not in the shared contract yet. */
export type ChatMessage = { id: string; makerId: string; me: boolean; text: string; at: string; productId?: string; request?: { budget: string } };

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
  messages: [] as ChatMessage[],
};

const KEY = 'yl-mock-v1';

function hydrate() {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    if (d.taste) state.me.taste = d.taste;
    if (Array.isArray(d.follows)) state.follows = new Set(d.follows);
    if (Array.isArray(d.saves)) state.saves = new Set(d.saves);
    if (Array.isArray(d.boards)) state.boards = d.boards;
    if (Array.isArray(d.bag)) state.bag = d.bag;
    if (Array.isArray(d.orders)) state.orders = d.orders;
    if (Array.isArray(d.messages)) state.messages = d.messages;
  } catch { /* storage blocked or corrupt: start fresh */ }
}

function persist() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({
      taste: state.me.taste, follows: [...state.follows], saves: [...state.saves],
      boards: state.boards, bag: state.bag, orders: state.orders, messages: state.messages,
    }));
  } catch { /* ignore */ }
}

hydrate();

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
  persist();
}

export async function toggleFollow(makerId: string): Promise<boolean> {
  const on = !state.follows.has(makerId);
  if (on) state.follows.add(makerId); else state.follows.delete(makerId);
  persist();
  return on;
}

export async function toggleSave(productId: string): Promise<boolean> {
  if (state.saves.has(productId)) {
    state.saves.delete(productId);
    state.boards.forEach((b) => { b.productIds = b.productIds.filter((id) => id !== productId); });
    persist();
    return false;
  }
  state.saves.add(productId);
  persist();
  return true;
}

export async function getBoards(): Promise<Board[]> {
  return clone(state.boards);
}

export async function createBoard(name: string): Promise<Board> {
  const board: Board = { id: `b${Date.now()}`, name: name.trim() || 'New board', productIds: [] };
  state.boards.push(board);
  persist();
  return clone(board);
}

export async function addToBoard(boardId: string, productId: string): Promise<void> {
  const b = state.boards.find((x) => x.id === boardId);
  if (!b) return;
  state.saves.add(productId);
  if (!b.productIds.includes(productId)) b.productIds.push(productId);
  persist();
}

export async function removeFromBoard(boardId: string, productId: string): Promise<void> {
  const b = state.boards.find((x) => x.id === boardId);
  if (!b) return;
  b.productIds = b.productIds.filter((id) => id !== productId);
  persist();
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
  persist();
}

export async function updateBag(lines: BagLine[]): Promise<void> {
  state.bag = clone(lines.filter((l) => l.qty > 0));
  persist();
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
  persist();
}

// ---- Messages (mock) ----

export async function getThreads(): Promise<{ maker: Maker; last: ChatMessage }[]> {
  const out: { maker: Maker; last: ChatMessage }[] = [];
  for (const m of state.makers) {
    const msgs = state.messages.filter((x) => x.makerId === m.id);
    if (msgs.length) out.push({ maker: withMaker(m), last: msgs[msgs.length - 1] });
  }
  out.sort((a, b) => b.last.at.localeCompare(a.last.at));
  return clone(out);
}

export async function getMessages(makerId: string): Promise<ChatMessage[]> {
  return clone(state.messages.filter((x) => x.makerId === makerId));
}

export async function sendMessage(makerId: string, text: string, productId?: string, request?: { budget: string }): Promise<ChatMessage> {
  const msg: ChatMessage = { id: `m${Date.now()}${Math.random().toString(36).slice(2, 6)}`, makerId, me: true, text: text.trim(), at: new Date().toISOString(), productId, request };
  state.messages.push(msg);
  persist();
  return clone(msg);
}

// ---- Checkout (mock) ----

/** Payments are not live yet: this records a TEST order from the bag and empties the bag. */
export async function placeTestOrder(): Promise<Order | null> {
  const lines = state.bag
    .map((l) => ({ ...l, product: state.products.find((p) => p.id === l.productId) }))
    .filter((l): l is BagLine & { product: Product } => !!l.product);
  if (!lines.length) return null;
  const makers = new Set(lines.map((l) => l.product.makerId));
  const items = lines.reduce((a, l) => a + l.product.priceCents * l.qty, 0);
  let shipping = 0;
  makers.forEach((id) => {
    const mine = lines.filter((l) => l.product.makerId === id);
    const sub = mine.reduce((a, l) => a + l.product.priceCents * l.qty, 0);
    const limit = MAKER_EXTRAS[id]?.freeShippingOverCents;
    shipping += limit != null && sub >= limit ? 0 : Math.max(...mine.map((l) => l.product.shippingCents));
  });
  const order: Order = {
    id: `YL-${1000 + state.orders.length + 41}`,
    createdAt: new Date().toISOString(),
    status: 'paid',
    lines: clone(lines),
    totalCents: items + shipping,
  };
  state.orders.unshift(order);
  state.bag = [];
  persist();
  return clone(order);
}
