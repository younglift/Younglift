// Mock backend for design 07. Same rules the Supabase version will have (docs/design/HANDOFF-07.md):
// real 15-minute holds on every piece with limited stock (HANDOFF-07, FIXES 5.6), stickers computed from data, one order per maker,
// maker applications with approve/reject, reviews only from delivered orders, posts with kinds.
// State lives in memory and, in the browser, in localStorage, so a reload keeps everything.
import type {
  BagLine, Board, BudgetBand, CartHold, Category, ChatMessage, CustomRequest, Delivery, FeedItem, Maker,
  MakerApplication, MakerSticker, MakerStats, Order, Post, PostKind, Product, Review, Stickers, Taste, UpliftSticker,
} from '@/lib/types';
import {
  DEMO_ME, ago, ahead, seedApplications, seedMakers, seedMessages, seedOrders, seedPosts, seedProducts,
  seedRequests, seedReviews, seedStats,
} from './mock-data';

export const HOLD_MINUTES = 15;
const MY_CART = 'me';
const DAY = 864e5;
const KEY = 'uplift-demo-v3';

type State = ReturnType<typeof fresh>;
function fresh() {
  const products = seedProducts();
  const byId = new Map(products.map((p) => [p.id, p]));
  return {
    me: { ...DEMO_ME, taste: { categories: [] as Category[], styles: [] as string[], materials: [] as string[] } as Taste, onboarded: false, hintsSeen: false },
    makers: seedMakers(),
    products,
    follows: ['inez', 'mara', 'ula'] as string[],
    saves: ['bracelet', 'plates', 'bag', 'candle', 'lake'] as string[],
    boards: [
      { id: 'b1', name: 'For my sister', productIds: ['bag', 'plates'] },
      { id: 'b2', name: 'Rings I like', productIds: ['bracelet'] },
    ] as Board[],
    bag: [] as BagLine[],
    // Demo: another shopper holds Inez's Soft loop, so "In someone's bag" can be seen.
    holds: [{ pieceId: 'soft', cartId: 'someone-else', qty: 1, expiresAt: new Date(Date.now() + 11 * 60e3).toISOString() }] as CartHold[],
    orders: seedOrders().map((o) => ({ ...o, lines: o.lines.map((l) => ({ ...l, product: { ...byId.get(l.productId)! } })) })) as Order[],
    reviews: seedReviews(),
    posts: seedPosts(),
    messages: seedMessages(),
    requests: seedRequests(),
    applications: seedApplications(),
    stats: seedStats() as Record<string, MakerStats>,
    hiddenMakers: [] as string[],
    myMakerId: 'mara' as string | null,
    payouts: { mara: 'connected' } as Record<string, 'connected' | 'not_connected'>,
    readThreads: [] as string[],
  };
}

let state: State = fresh();
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...fresh(), ...JSON.parse(raw) };
  } catch { /* storage blocked or corrupt: start fresh */ }
}
function save() {
  if (typeof window !== 'undefined') {
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* full or blocked */ }
  }
  listeners.forEach((fn) => fn());
}
/** Re-render hooks when data changes (lib/useData.ts). */
export function subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }
export async function resetDemo() { state = fresh(); save(); }

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));
const now = () => Date.now();
const within = (iso: string | undefined, days: number) => !!iso && now() - new Date(iso).getTime() < days * DAY;
const uid = (p: string) => `${p}${now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const makerOf = (id: string) => state.makers.find((m) => m.id === id);
const productOf = (id: string) => state.products.find((p) => p.id === id);

// ---------- stickers (computed, never stored) ----------

function validMakerSticker(p: Product): MakerSticker | undefined {
  const s = p.makerSticker;
  if (!s) return undefined;
  if (s === 'one_of_one' && !p.oneOfAKind) return undefined;
  if (s === 'made_to_order' && !p.madeToOrder) return undefined;
  if (s === 'small_batch' && !p.batchSize) return undefined;
  if (s === 'made_in_collab' && !p.collabMakerId) return undefined;
  return s;
}
function upliftSticker(p: Product, m: Maker | undefined): UpliftSticker | undefined {
  if (state.posts.some((x) => x.kind === 'in_progress' && x.productIds.includes(p.id) && within(x.createdAt, 30))) return 'in_progress';
  if (!p.madeToOrder && p.madeCount > 1 && p.stock === 1) return 'last_one_left';
  if (within(p.restockedAt, 7) && p.stock > 0) return 'back_in_stock';
  if (within(p.createdAt, 7)) return 'just_dropped';
  if (m && within(m.liveAt, 30)) return 'new_maker';
  return undefined;
}
export function stickersFor(p: Product, m?: Maker): Stickers {
  return { maker: validMakerSticker(p), uplift: upliftSticker(p, m ?? makerOf(p.makerId)) };
}

// ---------- holds (cart_holds) ----------

function activeHolds() {
  state.holds = state.holds.filter((h) => new Date(h.expiresAt).getTime() > now() || h.cartId === MY_CART);
  return state.holds.filter((h) => new Date(h.expiresAt).getTime() > now());
}
/** Pieces others hold right now. Free stock for me = stock − that. */
const othersHold = (id: string) => activeHolds().filter((h) => h.pieceId === id && h.cartId !== MY_CART).reduce((a, h) => a + h.qty, 0);
const limited = (p: Product) => !p.madeToOrder;
const freeFor = (p: Product) => (p.madeToOrder ? Infinity : Math.max(0, p.stock - othersHold(p.id)));
const heldByOther = (id: string) => { const p = productOf(id); return !!p && limited(p) && !p.sold && freeFor(p) <= 0; };
const myHold = (id: string) => state.holds.find((h) => h.pieceId === id && h.cartId === MY_CART);
const bagQty = (id: string) => state.bag.filter((l) => l.productId === id).reduce((a, l) => a + l.qty, 0);
/** (Re)hold everything of this piece in my bag for 15 minutes. */
function holdMine(id: string) {
  const p = productOf(id); state.holds = state.holds.filter((h) => !(h.pieceId === id && h.cartId === MY_CART));
  const q = bagQty(id); if (p && limited(p) && q > 0) state.holds.push({ pieceId: id, cartId: MY_CART, qty: q, expiresAt: new Date(now() + HOLD_MINUTES * 60e3).toISOString() });
}

function view(p: Product): Product {
  const m = makerOf(p.makerId);
  return { ...p, isSaved: state.saves.includes(p.id), stickers: stickersFor(p, m), heldByOther: heldByOther(p.id) };
}
function rating(makerId: string) {
  const r = state.reviews.filter((x) => x.makerId === makerId);
  return r.length ? { avg: Math.round((r.reduce((a, x) => a + x.rating, 0) / r.length) * 10) / 10, count: r.length } : undefined;
}
function viewMaker(m: Maker): Maker {
  return { ...m, isFollowing: state.follows.includes(m.id), rating: rating(m.id) };
}
const visible = (p: Product) => p.status === 'live' && makerOf(p.makerId)?.status === 'live' && !p.privateFor;
/** Private listings are visible (and buyable) only for the buyer they were made for. */
const buyable = (p: Product) => p.status === 'live' && makerOf(p.makerId)?.status === 'live' && (!p.privateFor || p.privateFor === MY_CART);

// ---------- buyer: browse ----------

export async function getMe() { load(); return clone(state.me); }
export async function saveTaste(t: Taste) { load(); state.me.taste = clone(t); state.me.onboarded = true; save(); }
export async function saveAddress(a: typeof DEMO_ME.address) { load(); state.me.address = clone(a); save(); }
export async function saveNotify(n: typeof DEMO_ME.notify) { load(); state.me.notify = clone(n); save(); }
export async function markOnboarded() { load(); state.me.onboarded = true; save(); }
export async function markHintsSeen() { load(); if (!state.me.hintsSeen) { state.me.hintsSeen = true; save(); } }

/** One maker per screen: taste first, followed boosted, and every 5th a maker outside the taste ("Picked for you"). */
export async function getFeed(): Promise<FeedItem[]> {
  load();
  const taste = state.me.taste.categories;
  const live = state.makers.filter((m) => m.status === 'live' && !state.hiddenMakers.includes(m.id));
  const fits = (m: Maker) => !taste.length || m.categories.some((c) => taste.includes(c));
  const score = (m: Maker) => (state.follows.includes(m.id) ? 1 : 0);
  const inTaste = live.filter(fits).sort((a, b) => score(b) - score(a));
  const outside = live.filter((m) => !fits(m));
  const items: FeedItem[] = [];
  inTaste.forEach((m, i) => {
    items.push({ maker: viewMaker(m), products: productsFor(m.id), reason: 'taste' });
    if ((i + 1) % 2 === 0 && outside.length) {
      const s = outside.shift()!;
      items.push({ maker: viewMaker(s), products: productsFor(s.id), reason: 'surprise' });
    }
  });
  outside.forEach((s) => items.push({ maker: viewMaker(s), products: productsFor(s.id), reason: 'surprise' }));
  return clone(items.filter((x) => x.products.length));
}
function productsFor(makerId: string) {
  const m = makerOf(makerId);
  const list = state.products.filter((p) => p.makerId === makerId && visible(p)).map(view);
  // collage pieces first, available before sold
  const order = (p: Product) => (m?.collage.indexOf(p.id) ?? -1) >= 0 ? m!.collage.indexOf(p.id) : 9;
  return list.sort((a, b) => Number(a.sold) - Number(b.sold) || order(a) - order(b));
}
/** "Not for me" on a surprise maker: don't show her in Discover again. */
export async function hideMaker(makerId: string) { load(); state.hiddenMakers.push(makerId); save(); }

export async function getMakers(): Promise<Maker[]> { load(); return clone(state.makers.filter((m) => m.status === 'live').map(viewMaker)); }
export async function getMaker(slug: string): Promise<Maker | null> {
  load(); const m = state.makers.find((x) => x.slug === slug); return m ? clone(viewMaker(m)) : null;
}
export async function getMakerProducts(makerId: string): Promise<Product[]> { load(); return clone(productsFor(makerId)); }
export async function getProduct(id: string): Promise<{ product: Product; maker: Maker } | null> {
  load(); const p = productOf(id); const m = p && makerOf(p.makerId);
  if (p?.privateFor && p.privateFor !== MY_CART) return null;
  return p && m ? clone({ product: view(p), maker: viewMaker(m) }) : null;
}
export async function getPosts(makerId: string): Promise<Post[]> {
  load(); return clone(state.posts.filter((p) => p.makerId === makerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}
export async function getReviews(makerId: string): Promise<(Review & { productTitle: string })[]> {
  load();
  return clone(state.reviews.filter((r) => r.makerId === makerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((r) => ({ ...r, productTitle: productOf(r.productId)?.title ?? '' })));
}

export const CATEGORY_LABEL: Record<Category, string> = {
  jewelry: 'Jewellery', ceramics: 'Ceramics', crochet: 'Crochet & knit', clothing: 'Clothing',
  accessories: 'Bags & accessories', home: 'Home', prints: 'Art & prints', other: 'Other',
};
export async function getCategories() {
  load();
  const live = state.products.filter((p) => visible(p) && !p.sold);
  const cats: Category[] = ['jewelry', 'ceramics', 'clothing', 'accessories', 'home', 'prints', 'crochet'];
  return cats.map((c) => {
    const list = live.filter((p) => p.category === c);
    return { id: c, label: CATEGORY_LABEL[c], count: list.length, image: list[0]?.images[0] };
  });
}

export async function search(q: string, filters: { category?: Category } = {}): Promise<{ makers: Maker[]; products: Product[] }> {
  load();
  const t = q.trim().toLowerCase();
  const words = t.split(/\s+/).filter(Boolean);
  const hit = (s: string) => words.every((w) => s.toLowerCase().includes(w));
  const products = state.products.filter((p) => {
    if (!visible(p)) return false;
    const m = makerOf(p.makerId);
    if (filters.category && p.category !== filters.category) return false;
    return !words.length || hit(`${p.title} ${p.kind ?? ''} ${p.materials.join(' ')} ${p.description} ${m?.name} ${m?.city} ${CATEGORY_LABEL[p.category]}`);
  }).map(view);
  const makers = state.makers.filter((m) => m.status === 'live' && words.length && hit(`${m.name} ${m.studio} ${m.city} ${m.categories.map((c) => CATEGORY_LABEL[c]).join(' ')}`)).map(viewMaker);
  return clone({ makers, products });
}
export async function getSimilar(productId: string): Promise<Product[]> {
  load(); const p = productOf(productId); if (!p) return [];
  return clone(state.products.filter((x) => x.id !== p.id && visible(x) && !x.sold && x.makerId === p.makerId).slice(0, 3).map(view));
}

// ---------- follow, save, boards ----------

export async function toggleFollow(makerId: string): Promise<boolean> {
  load(); const m = makerOf(makerId); const on = !state.follows.includes(makerId);
  state.follows = on ? [...state.follows, makerId] : state.follows.filter((x) => x !== makerId);
  if (m) m.followers += on ? 1 : -1;
  save(); return on;
}
export async function getFollowing(): Promise<Maker[]> { load(); return clone(state.makers.filter((m) => state.follows.includes(m.id)).map(viewMaker)); }
/** New pieces and posts from followed makers, newest first. */
export async function getFollowingFeed() {
  load();
  type Upd = { makerId: string; at: string; kind: 'pieces'; products: Product[] } | { makerId: string; at: string; kind: 'post'; post: Post };
  const out: Upd[] = [];
  for (const id of state.follows) {
    const fresh14 = state.products.filter((p) => p.makerId === id && visible(p) && within(p.createdAt, 21)).map(view);
    if (fresh14.length) out.push({ makerId: id, kind: 'pieces', products: fresh14, at: fresh14.map((p) => p.createdAt).sort().reverse()[0] });
    state.posts.filter((p) => p.makerId === id && within(p.createdAt, 21)).forEach((post) => out.push({ makerId: id, kind: 'post', post, at: post.createdAt }));
  }
  return clone(out.sort((a, b) => b.at.localeCompare(a.at)));
}
export async function toggleSave(productId: string): Promise<boolean> {
  load();
  if (state.saves.includes(productId)) {
    state.saves = state.saves.filter((x) => x !== productId);
    state.boards.forEach((b) => { b.productIds = b.productIds.filter((x) => x !== productId); });
    save(); return false;
  }
  state.saves = [productId, ...state.saves]; save(); return true;
}
export async function getSaved(): Promise<Product[]> {
  load(); return clone(state.saves.map(productOf).filter((p): p is Product => !!p).map(view));
}
export async function getBoards(): Promise<Board[]> { load(); return clone(state.boards); }
export async function createBoard(name: string): Promise<Board> {
  load(); const b: Board = { id: uid('b'), name: name.trim() || 'New board', productIds: [] }; state.boards.push(b); save(); return clone(b);
}
export async function addToBoard(boardId: string, productId: string) {
  load(); const b = state.boards.find((x) => x.id === boardId); if (!b) return;
  if (!state.saves.includes(productId)) state.saves.unshift(productId);
  if (!b.productIds.includes(productId)) b.productIds.unshift(productId);
  save();
}
export async function removeFromBoard(boardId: string, productId: string) {
  load(); const b = state.boards.find((x) => x.id === boardId); if (!b) return;
  b.productIds = b.productIds.filter((x) => x !== productId); save();
}
export async function deleteBoard(boardId: string) { load(); state.boards = state.boards.filter((b) => b.id !== boardId); save(); }

// ---------- bag + 15-minute holds ----------

export type BagView = {
  groups: {
    maker: Maker
    lines: (BagLine & { product: Product; hold?: { expiresAt: string; expired: boolean } })[]
    itemsCents: number; shippingCents: number; freeShippingLeftCents?: number; upsell: Product[]
  }[]
  holdEndsAt?: string   // earliest active hold in my bag
  heldCount: number     // pieces held for me right now
  count: number
}
function shippingFor(m: Maker, itemsCents: number, delivery: Delivery = 'locker') {
  if (m.freeShippingFromCents != null && itemsCents >= m.freeShippingFromCents) return 0;
  return delivery === 'door' ? 690 : 490;
}
export async function getBag(): Promise<BagView> {
  load(); activeHolds();
  const lines = state.bag.map((l) => ({ ...l, product: productOf(l.productId) })).filter((l) => l.product) as (BagLine & { product: Product })[];
  const makerIds = Array.from(new Set(lines.map((l) => l.product.makerId)));
  const groups = makerIds.map((id) => {
    const m = makerOf(id)!;
    const mine = lines.filter((l) => l.product.makerId === id).map((l) => {
      const h = myHold(l.productId);
      return { ...l, product: view(l.product), hold: h ? { expiresAt: h.expiresAt, expired: new Date(h.expiresAt).getTime() <= now() } : undefined };
    });
    const itemsCents = mine.reduce((a, l) => a + l.product.priceCents * l.qty, 0);
    const left = m.freeShippingFromCents != null ? Math.max(0, m.freeShippingFromCents - itemsCents) : undefined;
    const upsell = left ? state.products.filter((p) => p.makerId === id && visible(p) && !p.sold && !heldByOther(p.id) && !state.bag.some((b) => b.productId === p.id) && !p.sizes).slice(0, 3).map(view) : [];
    return { maker: viewMaker(m), lines: mine, itemsCents, shippingCents: shippingFor(m, itemsCents), freeShippingLeftCents: left, upsell };
  });
  const active = state.holds.filter((h) => h.cartId === MY_CART && new Date(h.expiresAt).getTime() > now()).map((h) => h.expiresAt).sort();
  const heldCount = state.holds.filter((h) => h.cartId === MY_CART && new Date(h.expiresAt).getTime() > now()).reduce((a, h) => a + h.qty, 0);
  return clone({ groups, holdEndsAt: active[0], heldCount, count: lines.reduce((a, l) => a + l.qty, 0) });
}
/** For checkout: the hold timer and how many pieces it covers. */
export async function getHoldInfo() { const b = await getBag(); return { endsAt: b.holdEndsAt, count: b.heldCount }; }
export async function getBagCount() { load(); return state.bag.reduce((a, l) => a + l.qty, 0); }

export type AddResult = { ok: true } | { ok: false; reason: 'sold' | 'held' | 'size' | 'missing' };
export async function addToBag(line: BagLine): Promise<AddResult> {
  load();
  const p = productOf(line.productId);
  if (!p || !buyable(p)) return { ok: false, reason: 'missing' };
  if (p.sold) return { ok: false, reason: 'sold' };
  if (p.sizes && !line.variant?.[p.sizes.label]) return { ok: false, reason: 'size' };
  const free = freeFor(p) - bagQty(p.id);
  if (limited(p) && free <= 0) return bagQty(p.id) ? { ok: true } : { ok: false, reason: 'held' };
  const same = state.bag.find((l) => l.productId === p.id && JSON.stringify(l.variant ?? {}) === JSON.stringify(line.variant ?? {}));
  const add = Math.min(line.qty, p.madeToOrder ? 10 : free);
  if (same) same.qty += add; else state.bag.push({ productId: p.id, qty: add, variant: line.variant });
  holdMine(p.id);
  save(); return { ok: true };
}
export async function isInBag(productId: string) { load(); return state.bag.some((l) => l.productId === productId); }
export async function setBagQty(productId: string, variant: Record<string, string> | undefined, qty: number) {
  load(); const p = productOf(productId);
  const l = state.bag.find((x) => x.productId === productId && JSON.stringify(x.variant ?? {}) === JSON.stringify(variant ?? {}));
  if (!l || !p) return;
  const others = bagQty(productId) - l.qty;
  l.qty = Math.max(1, Math.min(p.madeToOrder ? 10 : freeFor(p) - others, qty)); holdMine(productId); save();
}
export async function removeFromBag(productId: string, variant?: Record<string, string>) {
  load();
  state.bag = state.bag.filter((x) => !(x.productId === productId && JSON.stringify(x.variant ?? {}) === JSON.stringify(variant ?? {})));
  holdMine(productId);
  save();
}
/** Hold ended: hold it again if enough is still free. */
export async function holdAgain(productId: string): Promise<AddResult> {
  load(); const p = productOf(productId); if (!p) return { ok: false, reason: 'missing' };
  if (freeFor(p) < bagQty(productId)) return { ok: false, reason: 'held' };
  holdMine(productId); save(); return { ok: true };
}

// ---------- checkout (one order + PaymentIntent per maker; "Pay for all" = one group) ----------

export type CheckoutInput = {
  makerIds?: string[]; email: string; name: string; phone?: string; city?: string
  delivery: Delivery; gift?: { toName: string; note: string; wrapMakers: string[] }
}
export async function quote(makerIds: string[] | undefined, delivery: Delivery, wrapMakers: string[] = []) {
  const bag = await getBag();
  const groups = bag.groups.filter((g) => !makerIds?.length || makerIds.includes(g.maker.id));
  const rows = groups.map((g) => {
    const wrap = wrapMakers.includes(g.maker.id) && g.maker.giftWrap?.enabled ? g.maker.giftWrap.priceCents : 0;
    const ship = shippingFor(g.maker, g.itemsCents, delivery);
    return { maker: g.maker, lines: g.lines, itemsCents: g.itemsCents, shippingCents: ship, giftWrapCents: wrap, totalCents: g.itemsCents + ship + wrap };
  });
  const sum = (k: 'itemsCents' | 'shippingCents' | 'giftWrapCents' | 'totalCents') => rows.reduce((a, r) => a + r[k], 0);
  return { rows, itemsCents: sum('itemsCents'), shippingCents: sum('shippingCents'), giftWrapCents: sum('giftWrapCents'), totalCents: sum('totalCents'), pieces: rows.reduce((a, r) => a + r.lines.reduce((x, l) => x + l.qty, 0), 0) };
}
export type CheckoutResult = { ok: true; groupId: string } | { ok: false; reason: string };
/** Test mode: no money moves. The real version creates one Stripe PaymentIntent per maker. */
export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  load(); activeHolds();
  const q = await quote(input.makerIds, input.delivery, input.gift?.wrapMakers);
  if (!q.rows.length) return { ok: false, reason: 'Your bag is empty.' };
  for (const r of q.rows) for (const l of r.lines) {
    const p = productOf(l.productId)!;
    if (!buyable(p)) return { ok: false, reason: `${p.title} is no longer available.` };
    if (p.sold || (!p.madeToOrder && p.stock < l.qty)) return { ok: false, reason: `${p.title} just sold out.` };
    if (limited(p) && freeFor(p) < l.qty) return { ok: false, reason: `${p.title} is in someone else’s bag right now.` };
  }
  const groupId = uid('g-');
  let n = Math.max(1042, ...state.orders.map((o) => o.number));
  for (const r of q.rows) {
    n += 1;
    const lines = r.lines.map((l) => ({ productId: l.productId, qty: l.qty, variant: l.variant, product: clone(productOf(l.productId)!) }));
    const days = Math.max(...lines.map((l) => l.product.shipsWithinDays || 1));
    state.orders.unshift({
      id: `o-${n}`, number: n, makerId: r.maker.id, paymentGroupId: groupId, createdAt: new Date().toISOString(), status: 'paid',
      lines, itemsCents: r.itemsCents, shippingCents: r.shippingCents, giftWrapCents: r.giftWrapCents, totalCents: r.totalCents,
      delivery: input.delivery, buyer: { name: input.name || state.me.name, email: input.email, city: input.city || state.me.city },
      gift: input.gift ? { toName: input.gift.toName, note: input.gift.note, wrap: input.gift.wrapMakers.includes(r.maker.id) } : undefined,
      shipBy: ahead(days),
    });
    for (const l of lines) {
      const p = productOf(l.productId)!;
      if (!p.madeToOrder) p.stock = Math.max(0, p.stock - l.qty);
      p.sold = !p.madeToOrder && p.stock <= 0;
      state.holds = state.holds.filter((h) => !(h.pieceId === p.id && h.cartId === MY_CART));
      state.bag = state.bag.filter((b) => b.productId !== p.id);
    }
  }
  if (input.email) state.me.email = input.email;
  if (input.name) state.me.name = input.name.split(' ')[0];
  save(); return { ok: true, groupId };
}
const isMine = (o: Order) => o.buyer.email === state.me.email || o.buyer.email === DEMO_ME.email;
export async function getOrders(): Promise<(Order & { maker: Maker; reviewed: boolean })[]> {
  load();
  return clone(state.orders.filter(isMine).map((o) => ({ ...o, maker: viewMaker(makerOf(o.makerId)!), reviewed: o.lines.every((l) => state.reviews.some((r) => r.orderItemId === `${o.id}:${l.productId}`)) })));
}
export async function getOrderGroup(groupId: string) {
  load(); return clone(state.orders.filter((o) => o.paymentGroupId === groupId).map((o) => ({ ...o, maker: viewMaker(makerOf(o.makerId)!) })));
}
/** 14-day returns on ready pieces (not made to order or private/custom). Sends the maker a note. */
export function canReturn(o: Order) {
  return o.status === 'delivered' && !o.returnRequestedAt && !!o.deliveredAt && now() - new Date(o.deliveredAt).getTime() < 14 * DAY && o.lines.every((l) => !l.product.madeToOrder && !l.product.privateFor);
}
export async function requestReturn(orderId: string, reason: string) {
  load(); const o = state.orders.find((x) => x.id === orderId); if (!o || !isMine(o) || !canReturn(o)) return false;
  o.returnRequestedAt = new Date().toISOString(); o.returnReason = reason.trim();
  state.messages.push({ id: uid('m'), makerId: o.makerId, fromMe: true, at: o.returnRequestedAt, text: `I’d like to return order #UL-${o.number}${reason.trim() ? `: ${reason.trim()}` : '.'}` });
  save(); return true;
}
/** Only the buyer of a delivered order can review it. */
export async function addReview(orderId: string, productId: string, rating: number, text: string) {
  load(); const o = state.orders.find((x) => x.id === orderId);
  if (!o || !isMine(o) || o.status !== 'delivered') return false;
  const key = `${orderId}:${productId}`;
  state.reviews = state.reviews.filter((r) => r.orderItemId !== key);
  state.reviews.push({ id: uid('r'), orderItemId: key, makerId: o.makerId, productId, rating: Math.max(1, Math.min(5, Math.round(rating))), text: text.trim(), who: `${state.me.name}, ${state.me.city}`, createdAt: new Date().toISOString() });
  save(); return true;
}

// ---------- messages and custom requests ----------

/** "Active now" if she was active in the last 15 minutes. */
export function isActive(m: Pick<Maker, 'lastActiveAt'>) { return !!m.lastActiveAt && now() - new Date(m.lastActiveAt).getTime() < 15 * 60e3; }
/** Shown only when she replies within 3 days. */
export function replyLine(m: Pick<Maker, 'name' | 'replyHours'>) {
  if (m.replyHours == null || m.replyHours > 72) return undefined;
  return m.replyHours <= 24 ? `${m.name} usually replies within a day` : `${m.name} usually replies within a few days`;
}
export async function getThreads() {
  load();
  const out: { maker: Maker; last: ChatMessage; unread: boolean }[] = [];
  for (const m of state.makers) {
    const msgs = state.messages.filter((x) => x.makerId === m.id && (x.buyer ?? MY_CART) === MY_CART);
    if (!msgs.length) continue;
    const last = msgs[msgs.length - 1];
    out.push({ maker: viewMaker(m), last, unread: !last.fromMe && !state.readThreads.includes(`${m.id}:${last.id}`) });
  }
  return clone(out.sort((a, b) => b.last.at.localeCompare(a.last.at)));
}
export async function getUnreadCount() { return (await getThreads()).filter((t) => t.unread).length; }
export async function getMessages(makerId: string) { load(); return clone(state.messages.filter((x) => x.makerId === makerId && (x.buyer ?? MY_CART) === MY_CART)); }
export async function markThreadRead(makerId: string) {
  load(); const msgs = state.messages.filter((x) => x.makerId === makerId && (x.buyer ?? MY_CART) === MY_CART); const last = msgs[msgs.length - 1];
  if (last && !last.fromMe && !state.readThreads.includes(`${makerId}:${last.id}`)) { state.readThreads.push(`${makerId}:${last.id}`); save(); }
}
export async function sendMessage(makerId: string, text: string, productId?: string, imageUrl?: string): Promise<ChatMessage | null> {
  load(); if (!text.trim() && !imageUrl) return null;
  const msg: ChatMessage = { id: uid('m'), makerId, fromMe: true, text: text.trim(), at: new Date().toISOString(), productId, imageUrl };
  state.messages.push(msg); save(); return clone(msg);
}
export const BUDGET_LABEL: Record<BudgetBand, string> = { under_100: 'Under 100€', '100_200': '100–200€', '200_400': '200–400€', not_sure: 'Not sure' };
export async function sendCustomRequest(r: Omit<CustomRequest, 'id' | 'status' | 'createdAt' | 'buyerName'>): Promise<CustomRequest> {
  load();
  const req: CustomRequest = { ...r, id: uid('cr'), status: 'sent', createdAt: new Date().toISOString(), buyerName: state.me.name };
  state.requests.unshift(req);
  const when = r.when === 'by_date' && r.date ? ` · by ${r.date}` : ' · no rush';
  state.messages.push({ id: uid('m'), makerId: r.makerId, fromMe: true, at: req.createdAt, requestId: req.id, text: `Custom request: ${r.kind}. ${r.text} (${BUDGET_LABEL[r.budget]}${when})` });
  save(); return clone(req);
}

// ---------- maker applications + admin ----------

export async function submitApplication(a: Omit<MakerApplication, 'id' | 'status' | 'createdAt'>): Promise<MakerApplication> {
  load(); const app: MakerApplication = { ...a, id: uid('app'), status: 'pending', createdAt: new Date().toISOString() };
  state.applications.unshift(app); save(); return clone(app);
}
export async function getApplications() { load(); return clone(state.applications); }
/** Approve: creates her maker account (status approved, hidden until Go live) and, in the demo, makes it yours. */
export async function approveApplication(id: string) {
  load(); const a = state.applications.find((x) => x.id === id); if (!a || a.status !== 'pending') return;
  const slugBase = a.name.split(' ')[0].toLowerCase().normalize('NFD').replace(/[^a-z]/g, '') || 'maker';
  let slug = slugBase; let i = 2; while (state.makers.some((m) => m.slug === slug)) slug = `${slugBase}${i++}`;
  const maker: Maker = {
    id: slug, slug, name: a.name.split(' ')[0], studio: '', city: a.city, country: 'LT', categories: a.categories,
    tagline: '', bio: a.about, portraitUrl: a.photos[0] ?? '/img/studio-table.jpg', coverUrl: a.photos[1] ?? a.photos[0] ?? '/img/studio-table.jpg',
    status: 'approved', followers: 0, shipsInDays: [2, 3], customRequestsOpen: true,
    collage: [], slideOrder: ['work', 'meet', 'process', 'piece'], lastActiveAt: new Date().toISOString(),
  };
  state.makers.push(maker); a.status = 'approved'; a.makerId = maker.id; state.myMakerId = maker.id;
  state.payouts[maker.id] = 'not_connected';
  save();
}
export async function rejectApplication(id: string) {
  load(); const a = state.applications.find((x) => x.id === id); if (a && a.status === 'pending') { a.status = 'rejected'; save(); }
}

// ---------- studio (maker side) ----------

export async function getMyMaker(): Promise<Maker | null> { load(); const m = state.myMakerId && makerOf(state.myMakerId); return m ? clone(viewMaker(m)) : null; }
export async function switchToDemoMaker() { load(); state.myMakerId = 'mara'; save(); }
export async function updateMyMaker(patch: Partial<Maker>) {
  load(); const m = state.myMakerId && makerOf(state.myMakerId); if (!m) return;
  const { id: _i, slug: _s, status: _st, ...rest } = patch;
  Object.assign(m, rest); m.lastActiveAt = new Date().toISOString(); save();
}
/** Steps to Go live: profile, 3 pieces, payouts (video optional). */
export async function getChecklist() {
  load(); const m = state.myMakerId ? makerOf(state.myMakerId) : undefined; if (!m) return null;
  const pieces = state.products.filter((p) => p.makerId === m.id && p.status === 'live').length;
  const steps = {
    profile: !!(m.tagline && m.portraitUrl && m.collage.length === 3),
    pieces: pieces >= 3,
    payouts: state.payouts[m.id] === 'connected',
    video: !!m.video,
  };
  return { steps, pieces, done: Object.values(steps).filter(Boolean).length, canGoLive: steps.profile && steps.pieces, status: m.status };
}
export async function goLive(): Promise<boolean> {
  const c = await getChecklist(); if (!c?.canGoLive) return false;
  const m = makerOf(state.myMakerId!)!; m.status = 'live'; m.liveAt = new Date().toISOString(); save(); return true;
}
export async function getStudioProducts(): Promise<Product[]> {
  load(); return clone(state.products.filter((p) => p.makerId === state.myMakerId).map(view));
}
export async function getMyProduct(id: string): Promise<Product | null> {
  load(); const p = productOf(id); return p && p.makerId === state.myMakerId ? clone(view(p)) : null;
}
export async function upsertProduct(p: Partial<Product>): Promise<Product> {
  load();
  const existing = p.id ? productOf(p.id) : undefined;
  const base: Product = existing ?? {
    id: uid('p'), makerId: state.myMakerId!, title: 'Untitled piece', description: '', priceCents: 0, currency: 'EUR', images: [],
    category: 'other', materials: [], madeToOrder: false, stock: 1, madeCount: 1, shipsWithinDays: 3, shippingCents: 490,
    status: 'draft', createdAt: new Date().toISOString(), oneOfAKind: true, sold: false,
  };
  const wasOut = !base.madeToOrder && base.stock <= 0;
  const next = { ...base, ...p, id: base.id, makerId: base.makerId, createdAt: base.createdAt } as Product;
  if (next.madeToOrder) { next.stock = 0; next.madeCount = 0; }
  next.madeCount = next.madeToOrder ? 0 : Math.max(next.madeCount, next.stock, existing ? next.madeCount : next.stock);
  next.oneOfAKind = !next.madeToOrder && next.madeCount === 1;
  next.sold = !next.madeToOrder && next.stock <= 0;
  if (existing && wasOut && next.stock > 0) next.restockedAt = new Date().toISOString();
  if (next.makerSticker === 'one_of_one' && !next.oneOfAKind) next.makerSticker = undefined;   // "1 of 1" only when quantity is 1
  if (next.makerSticker !== 'small_batch') next.batchSize = undefined;
  if (next.makerSticker !== 'made_in_collab') next.collabMakerId = undefined;
  if (existing) Object.assign(existing, next); else state.products.unshift(next);
  if (!existing && next.status === 'live') next.createdAt = new Date().toISOString();
  save(); return clone(view(next));
}
export async function deleteProduct(id: string) {
  load(); state.products = state.products.filter((p) => !(p.id === id && p.makerId === state.myMakerId));
  state.bag = state.bag.filter((l) => l.productId !== id); save();
}
export async function getStudioOrders(): Promise<Order[]> {
  load(); return clone(state.orders.filter((o) => o.makerId === state.myMakerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}
export async function getStudioOrder(id: string): Promise<Order | null> {
  load(); const o = state.orders.find((x) => x.id === id && x.makerId === state.myMakerId); return o ? clone(o) : null;
}
export async function markPacking(orderId: string) {
  load(); const o = state.orders.find((x) => x.id === orderId && x.makerId === state.myMakerId); if (o && o.status === 'paid') { o.status = 'packing'; save(); }
}
/** Maker presses "Mark as shipped". In the real version this also releases her payout. */
export async function markShipped(orderId: string, tracking?: string) {
  load(); const o = state.orders.find((x) => x.id === orderId && x.makerId === state.myMakerId);
  if (!o || (o.status !== 'paid' && o.status !== 'packing')) return;
  o.status = 'shipped'; o.shippedAt = new Date().toISOString(); if (tracking?.trim()) o.trackingNumber = tracking.trim(); save();
}
/** Demo helper: the parcel arrives (real version: from the carrier's tracking). */
export async function markDelivered(orderId: string) {
  load(); const o = state.orders.find((x) => x.id === orderId); if (o && o.status === 'shipped') { o.status = 'delivered'; o.deliveredAt = new Date().toISOString(); save(); }
}
export async function getStats(): Promise<MakerStats> {
  load(); const m = state.myMakerId ? makerOf(state.myMakerId) : undefined;
  const s = (m && state.stats[m.id]) || { views: 0, viewsChangePct: 0, saves: 0, savesChange: 0, followers: 0, followersChange: 0, avgReplyHours: 0, weeklySalesCents: [0, 0, 0, 0, 0, 0, 0, 0] };
  return clone({ ...s, followers: m?.followers ?? 0 });
}
export async function getMostLoved(): Promise<Product[]> {
  load(); return clone(state.products.filter((p) => p.makerId === state.myMakerId && p.status === 'live').slice(0, 3).map(view));
}
export async function createPost(p: { kind: PostKind; caption: string; imageUrl?: string; seconds?: number; productIds: string[]; showAsStory?: boolean }) {
  load(); const m = state.myMakerId && makerOf(state.myMakerId); if (!m) return null;
  const post: Post = { ...p, id: uid('post'), makerId: m.id, createdAt: new Date().toISOString() };
  state.posts.unshift(post);
  if (p.kind === 'video' && p.showAsStory && p.imageUrl) m.video = { posterUrl: p.imageUrl, caption: p.caption, seconds: p.seconds ?? 30, hasCaptions: true };
  save(); return clone(post);
}
export async function getStudioRequests() { load(); return clone(state.requests.filter((r) => r.makerId === state.myMakerId)); }
/** Studio inbox: one thread per buyer. */
export async function getStudioThreads() {
  load(); const msgs = state.messages.filter((x) => x.makerId === state.myMakerId);
  const keys = Array.from(new Set(msgs.map((x) => x.buyer ?? MY_CART)));
  return clone(keys.map((k) => {
    const mine = msgs.filter((x) => (x.buyer ?? MY_CART) === k);
    const last = mine[mine.length - 1];
    return { buyer: k, name: k === MY_CART ? state.me.name : mine.find((x) => x.buyerName)?.buyerName ?? 'Buyer', last, count: mine.length, waiting: last.fromMe };
  }).sort((a, b) => b.last.at.localeCompare(a.last.at)));
}
export async function getStudioMessages(buyer: string) {
  load(); return clone(state.messages.filter((x) => x.makerId === state.myMakerId && (x.buyer ?? MY_CART) === buyer));
}
/** Maker answers a buyer (studio side of the same thread). */
export async function replyAsMaker(text: string, buyer: string = MY_CART) {
  load(); const m = state.myMakerId && makerOf(state.myMakerId); if (!m || !text.trim()) return;
  state.messages.push({ id: uid('m'), makerId: m.id, buyer: buyer === MY_CART ? undefined : buyer, fromMe: false, text: text.trim(), at: new Date().toISOString() });
  m.lastActiveAt = new Date().toISOString();
  if (buyer === MY_CART) state.requests.filter((r) => r.makerId === m.id && r.status === 'sent').forEach((r) => { r.status = 'replied'; });
  save();
}
/** After a custom request: the maker sends a private listing only that buyer can see and buy. */
export async function sendPrivateListing(requestId: string, l: { title: string; priceCents: number; shipsWithinDays: number; description: string; imageUrl?: string }) {
  load(); const r = state.requests.find((x) => x.id === requestId && x.makerId === state.myMakerId); const m = r && makerOf(r.makerId);
  if (!r || !m) return null;
  const p: Product = {
    id: uid('p'), makerId: m.id, title: l.title.trim() || `${r.kind} for ${r.buyerName}`, description: l.description.trim(), subtitle: `Made for ${r.buyerName}`,
    priceCents: l.priceCents, currency: 'EUR', images: [l.imageUrl || r.photos[0] || m.coverUrl], category: m.categories[0], materials: [],
    madeToOrder: false, stock: 1, madeCount: 1, shipsWithinDays: l.shipsWithinDays || 14, shippingCents: 490, status: 'live',
    privateFor: MY_CART, createdAt: new Date().toISOString(), oneOfAKind: true, sold: false,
  };
  state.products.unshift(p);
  r.status = 'agreed'; r.listingId = p.id;
  state.messages.push({ id: uid('m'), makerId: m.id, fromMe: false, text: `Here is your private listing: ${p.title}. Only you can see it.`, at: new Date().toISOString(), listingId: p.id });
  m.lastActiveAt = new Date().toISOString();
  save(); return clone(p);
}
export async function declineRequest(requestId: string) {
  load(); const r = state.requests.find((x) => x.id === requestId && x.makerId === state.myMakerId); if (!r) return;
  r.status = 'declined';
  state.messages.push({ id: uid('m'), makerId: r.makerId, fromMe: false, text: 'Thank you for asking! I can’t take this one on right now.', at: new Date().toISOString(), requestId: r.id });
  save();
}
/** Reviews of my studio, and my public reply under one. */
export async function getStudioReviews() { load(); return clone(state.reviews.filter((r) => r.makerId === state.myMakerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((r) => ({ ...r, productTitle: productOf(r.productId)?.title ?? '' }))); }
export async function replyToReview(reviewId: string, text: string) {
  load(); const r = state.reviews.find((x) => x.id === reviewId && x.makerId === state.myMakerId); if (!r) return;
  r.reply = text.trim() || undefined; save();
}
export async function getPayouts() { load(); return state.myMakerId ? (state.payouts[state.myMakerId] ?? 'not_connected') : 'not_connected'; }
/** Test mode until Stripe Connect is set up: marks payouts as connected. */
export async function connectPayouts() { load(); if (state.myMakerId) { state.payouts[state.myMakerId] = 'connected'; save(); } }

/** Images: in the demo a resized data URL. Real version uploads to Supabase Storage. */
export async function uploadImage(file: File): Promise<string> {
  if (typeof window === 'undefined') return '';
  const url = URL.createObjectURL(file);
  try {
    const im = new Image(); im.src = url; await im.decode();
    const k = Math.min(1, 900 / Math.max(im.width, im.height));
    const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
    c.getContext('2d')!.drawImage(im, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.8);
  } catch { return url; } finally { setTimeout(() => URL.revokeObjectURL(url), 5000); }
}

export { ago, ahead };
