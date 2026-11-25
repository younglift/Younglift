// Demo content for design 07 (makers and pieces from Matas's screens, docs/design/screens/).
// Supabase replaces this later; the shapes stay the same (lib/types.ts).
// Dates are relative to "now" so time-based stickers (just dropped, new maker) stay true.
import type {
  ChatMessage, CustomRequest, Maker, MakerApplication, MakerStats, Order, Post, Product, Review,
} from '@/lib/types';

const DAY = 864e5;
export const ago = (days: number, now = Date.now()) => new Date(now - days * DAY).toISOString();
export const ahead = (days: number, now = Date.now()) => new Date(now + days * DAY).toISOString();
const img = (n: string) => `/img/${n}.jpg`;

export function seedMakers(): Maker[] {
  return [
    {
      id: 'inez', slug: 'inez', name: 'Inez', studio: 'Studio Serein', city: 'Vilnius', country: 'LT',
      categories: ['jewelry'],
      tagline: 'Rings and necklaces carved in wax and cast in silver at my bench in Užupis.',
      bio: 'Rings and necklaces carved in wax and cast in silver at my bench in Užupis. Small batches, most pieces are one of a kind.',
      portraitUrl: img('inez'), coverUrl: img('rings-set'),
      video: { posterUrl: img('inez'), caption: 'I carve every ring in wax first, then cast it in silver here in Užupis.', seconds: 24, hasCaptions: true },
      status: 'live', liveAt: ago(210), followers: 214, shipsInDays: [1, 2], replyHours: 9,
      lastActiveAt: new Date(Date.now() - 4 * 60e3).toISOString(),
      customRequestsOpen: true,
      giftWrap: { enabled: true, priceCents: 500, description: 'Linen pouch, wax seal and a handwritten card with their name.' },
      freeShippingFromCents: 15000,
      collage: ['necklace', 'flow', 'fold'], slideOrder: ['work', 'meet', 'process', 'piece'],
      thankYouNote: 'Thank you for choosing a piece from my bench. I hope it feels like yours from day one. Inez',
    },
    {
      id: 'mara', slug: 'mara', name: 'Mara', studio: 'Studio Lehm', city: 'Berlin', country: 'DE',
      categories: ['ceramics', 'home'],
      tagline: 'Speckled stoneware for slow mornings. Thrown and glazed by hand in Berlin.',
      bio: 'Wheel-thrown stoneware, glazed with my own speckled glazes. I fire small batches in a shared kiln in Neukölln.',
      portraitUrl: img('mara'), coverUrl: img('ceramics-set'),
      video: { posterUrl: img('mara-wheel'), caption: 'Every plate gets two coats of glaze, and no two speckle the same.', seconds: 32, hasCaptions: true },
      status: 'live', liveAt: ago(400), followers: 214, shipsInDays: [2, 3], replyHours: 20,
      lastActiveAt: ago(0.2),
      customRequestsOpen: true,
      giftWrap: { enabled: true, priceCents: 600, description: 'Linen bag and a handwritten card.' },
      freeShippingFromCents: 15000,
      collage: ['plates', 'dish', 'candle'], slideOrder: ['work', 'meet', 'process', 'piece'],
      thankYouNote: 'Thank you! Every piece is wrapped twice, so it gets to you in one piece. Mara',
    },
    {
      id: 'ula', slug: 'ula', name: 'Ula', studio: 'Mokume', city: 'Hamburg', country: 'DE',
      categories: ['crochet', 'clothing', 'accessories'],
      tagline: 'Crochet bags and hoods, square by square, at my kitchen table.',
      bio: 'I crochet bags, hoods and cardigans from wool bought at small farms in northern Germany. Every square is made by hand.',
      portraitUrl: img('ula'), coverUrl: img('crochet-details'),
      status: 'live', liveAt: ago(18), followers: 152, shipsInDays: [2, 4], replyHours: 30,
      lastActiveAt: ago(1),
      customRequestsOpen: false,
      freeShippingFromCents: undefined,
      collage: ['bag', 'hood', 'cardigan'], slideOrder: ['work', 'meet', 'piece', 'process'],
    },
    {
      id: 'ona', slug: 'ona', name: 'Ona', studio: 'Ona Prints', city: 'Kaunas', country: 'LT',
      categories: ['prints'],
      tagline: 'Riso prints of Lithuanian lakes, printed in small runs.',
      bio: 'I draw lakes and forests and print them on an old risograph in Kaunas. Each run is small and numbered.',
      portraitUrl: img('ona'), coverUrl: img('studio-table'),
      status: 'live', liveAt: ago(90), followers: 88, shipsInDays: [2, 3], replyHours: 100,
      lastActiveAt: ago(3),
      customRequestsOpen: true,
      collage: ['lake', 'table', 'lake'], slideOrder: ['work', 'meet', 'process', 'piece'],
    },
  ];
}

type P = Partial<Product> & Pick<Product, 'id' | 'makerId' | 'title' | 'priceCents' | 'images' | 'category' | 'materials' | 'description'>;
function piece(p: P): Product {
  const madeToOrder = p.madeToOrder ?? false;
  const madeCount = p.madeCount ?? 1;
  const stock = p.stock ?? 1;
  return {
    currency: 'EUR', shippingCents: 490, status: 'live', createdAt: ago(45),
    shipsWithinDays: 1, madeToOrder, madeCount, stock,
    oneOfAKind: !madeToOrder && madeCount === 1,
    sold: !madeToOrder && stock <= 0,
    ...p,
  } as Product;
}

export function seedProducts(): Product[] {
  return [
    // Inez · Vilnius · jewellery
    piece({ id: 'necklace', makerId: 'inez', title: 'Pink stone necklace', priceCents: 9500, images: [img('pink-necklace'), img('pink-necklace-worn'), img('inez-bench')], category: 'jewelry', kind: 'Necklaces', materials: ['Gold-plated silver'], description: 'Pink stones strung by hand on gold-plated silver. 42 cm with a 5 cm extender, so it sits right on any neckline.', makerSticker: 'one_of_one', createdAt: ago(3) }),
    piece({ id: 'flow', makerId: 'inez', title: 'Flow ring', priceCents: 14500, images: [img('flow-ring'), img('flow-ring-wax'), img('rings-set'), img('inez-bench')], category: 'jewelry', kind: 'Rings', materials: ['Silver'], description: 'Carved in wax, cast in silver. Each ring is made to your size, so no two are quite the same.', madeToOrder: true, madeCount: 0, stock: 0, shipsWithinDays: 14, makerSticker: 'made_to_order', sizes: { label: 'Size (EU)', options: ['50', '52', '54', '56', '58', '60'], unavailable: ['50', '60'] }, createdAt: ago(60) }),
    piece({ id: 'fold', makerId: 'inez', title: 'Fold ring', priceCents: 12000, images: [img('fold-ring'), img('fold-ring-hand')], category: 'jewelry', kind: 'Rings', materials: ['Silver'], description: 'Brushed recycled silver, folded once around the finger. Fits EU 55–56.', createdAt: ago(40) }),
    piece({ id: 'soft', makerId: 'inez', title: 'Soft loop', priceCents: 19000, images: [img('soft-loop'), img('soft-loop-hand')], category: 'jewelry', kind: 'Rings', materials: ['Silver'], description: 'A soft, heavy loop of polished silver. Fits EU 54–55.', createdAt: ago(30) }),
    piece({ id: 'earrings', makerId: 'inez', title: 'Pearl drop earrings', priceCents: 6800, images: [img('earrings'), img('earrings-worn')], category: 'jewelry', kind: 'Earrings', materials: ['Silver', 'Pearl'], description: 'Freshwater pearls on silver hooks. Light enough to forget you are wearing them.', madeCount: 4, stock: 1, makerSticker: 'handmade', createdAt: ago(25) }),
    piece({ id: 'bracelet', makerId: 'inez', title: 'Chain bracelet', priceCents: 11000, images: [img('bracelet'), img('bracelet-worn')], category: 'jewelry', kind: 'Bracelets', materials: ['Silver'], description: 'Hand-linked silver chain, one of a kind.', stock: 0, createdAt: ago(50) }),
    piece({ id: 'stack', makerId: 'inez', title: 'Stacking set', priceCents: 16000, images: [img('rings-set')], subtitle: 'Three rings', category: 'jewelry', kind: 'Rings', materials: ['Silver', 'Gold'], description: 'Three thin rings to wear together or apart. Silver and gold vermeil.', madeCount: 5, stock: 3, makerSticker: 'small_batch', batchSize: 5, createdAt: ago(35) }),
    // Mara · Berlin · ceramics
    piece({ id: 'plates', makerId: 'mara', title: 'Speckled plates', subtitle: 'Set of 3', priceCents: 9600, images: [img('plates'), img('plates-detail'), img('mara-wheel')], category: 'ceramics', kind: 'Plates', materials: ['Ceramic'], description: 'Set of 3 side plates, 19 cm. Wheel-thrown stoneware with my speckled oat glaze. Dishwasher safe.', madeCount: 3, stock: 2, shipsWithinDays: 3, makerSticker: 'small_batch', batchSize: 3, createdAt: ago(12) }),
    piece({ id: 'dish', makerId: 'mara', title: 'Incense dish', subtitle: 'Stoneware', priceCents: 3800, images: [img('dish')], category: 'ceramics', kind: 'Bowls & dishes', materials: ['Ceramic'], description: 'A small dish for incense or rings. Stoneware, unglazed underneath.', shipsWithinDays: 3, makerSticker: 'made_in_city', createdAt: ago(20) }),
    piece({ id: 'candle', makerId: 'mara', title: 'Candle cup', subtitle: 'Stoneware', priceCents: 4200, images: [img('candle')], category: 'home', kind: 'Candles', materials: ['Ceramic', 'Wax'], description: 'Soy wax poured into a stoneware cup. Reuse the cup when the candle is done.', madeCount: 6, stock: 0, shipsWithinDays: 3, createdAt: ago(70) }),
    piece({ id: 'cup', makerId: 'mara', title: 'Morning cup', subtitle: 'Oat glaze', priceCents: 3200, images: [img('morning-cup'), img('morning-cup-hands')], category: 'ceramics', kind: 'Cups', materials: ['Ceramic'], description: 'Holds 250 ml. Oat glaze inside and out. Made to order in about a week.', madeToOrder: true, madeCount: 0, stock: 0, shipsWithinDays: 7, createdAt: ago(55) }),
    piece({ id: 'ripple', makerId: 'mara', title: 'Ripple bowl', priceCents: 7800, images: [img('ripple-bowl'), img('ripple-bowl-wide')], category: 'ceramics', kind: 'Bowls & dishes', materials: ['Ceramic'], description: 'Speckled stoneware. Ø 24 cm. The ripples are pressed in by hand, one of a kind.', shipsWithinDays: 3, createdAt: ago(28) }),
    piece({ id: 'vase', makerId: 'mara', title: 'Tall twist vase', priceCents: 12000, images: [img('twist-vase')], category: 'ceramics', kind: 'Vases', materials: ['Ceramic'], description: 'Terracotta, glazed inside. 38 cm tall.', shipsWithinDays: 3, status: 'draft', createdAt: ago(1) }),
    // Ula · Hamburg · crochet
    piece({ id: 'bag', makerId: 'ula', title: 'Granny square bag', priceCents: 6400, images: [img('crochet-bag'), img('crochet-details')], category: 'accessories', kind: 'Bags', materials: ['Wool', 'Cotton'], description: 'Twelve granny squares, cotton lining, long strap. Fits a book and a water bottle.', madeCount: 4, stock: 2, restockedAt: ago(2), shipsWithinDays: 2, createdAt: ago(16) }),
    piece({ id: 'hood', makerId: 'ula', title: 'Flower hood', priceCents: 4999, images: [img('flower-hood'), img('crochet-duo')], category: 'clothing', kind: 'Hats & hoods', materials: ['Wool'], description: 'Wool from small farms. Fits head 54–60 cm. Hand wash cold.', madeToOrder: true, madeCount: 0, stock: 0, shipsWithinDays: 10, sizes: { label: 'Size', options: ['S/M', 'M/L'] }, createdAt: ago(16) }),
    piece({ id: 'cardigan', makerId: 'ula', title: 'Square cardigan', priceCents: 14000, images: [img('cardigan'), img('cardigan-detail')], category: 'clothing', kind: 'Cardigans', materials: ['Wool'], description: 'Crocheted square by square. One size, relaxed fit.', shipsWithinDays: 2, makerSticker: 'handmade', createdAt: ago(16) }),
    piece({ id: 'wallet', makerId: 'ula', title: 'Leather card wallet', priceCents: 5400, images: [img('wallet'), img('wallet-stitching')], category: 'accessories', kind: 'Wallets', materials: ['Leather'], description: 'Vegetable-tanned leather, hand stitched. Holds six cards.', madeCount: 3, stock: 3, shipsWithinDays: 2, makerSticker: 'small_batch', batchSize: 3, createdAt: ago(16) }),
    // Ona · Kaunas · prints
    piece({ id: 'lake', makerId: 'ona', title: 'Lake riso print', priceCents: 3500, images: [img('print'), img('print-detail')], category: 'prints', kind: 'Prints', materials: ['Paper'], description: 'Two-colour riso print, A4, numbered. This run is sold out.', madeCount: 30, stock: 0, shipsWithinDays: 3, createdAt: ago(80) }),
    piece({ id: 'table', makerId: 'ona', title: 'Studio table print', priceCents: 4500, images: [img('studio-table')], category: 'prints', kind: 'Prints', materials: ['Paper'], description: 'Three-colour riso print, A3, numbered run of 20.', madeCount: 20, stock: 12, shipsWithinDays: 3, makerSticker: 'small_batch', batchSize: 20, createdAt: ago(9) }),
  ];
}

export function seedPosts(): Post[] {
  return [
    { id: 'post1', makerId: 'inez', kind: 'video', caption: 'My story', imageUrl: img('inez'), seconds: 24, productIds: ['necklace', 'flow'], showAsStory: true, createdAt: ago(30) },
    { id: 'post2', makerId: 'inez', kind: 'journal', caption: 'New wax batch for the winter rings. Five of them, all a little different. Dropping next week.', imageUrl: img('inez-bench'), productIds: [], createdAt: ago(12) },
    { id: 'post3', makerId: 'inez', kind: 'journal', caption: 'I started with my grandmother’s old rings. Now every piece starts as wax on my bench, and none of them come out the same twice.', productIds: [], createdAt: ago(21) },
    { id: 'post4', makerId: 'mara', kind: 'video', caption: 'Glazing day. Two coats, then into the kiln on Thursday.', imageUrl: img('mara-wheel'), seconds: 32, productIds: ['plates', 'candle'], showAsStory: true, createdAt: ago(6) },
    { id: 'post5', makerId: 'mara', kind: 'in_progress', caption: 'Pouring six new candle cups this week.', imageUrl: img('candle'), productIds: ['candle'], createdAt: ago(1) },
    { id: 'post6', makerId: 'ula', kind: 'journal', caption: 'Twelve squares for one bag. I count them in my sleep.', imageUrl: img('crochet-details'), productIds: ['bag'], createdAt: ago(4) },
  ];
}

export function seedReviews(): Review[] {
  return [
    { id: 'r1', orderItemId: 'o-1001:flow', makerId: 'inez', productId: 'flow', rating: 5, text: 'Even nicer in real life. It came in a little linen pouch with a handwritten note.', who: 'Lina, Vilnius', createdAt: ago(40) },
    { id: 'r2', orderItemId: 'o-1002:fold', makerId: 'inez', productId: 'fold', rating: 5, text: 'Inez helped me pick the size over chat. Fits perfectly.', who: 'Karolina, Riga', createdAt: ago(60) },
    { id: 'r3', orderItemId: 'o-1003:stack', makerId: 'inez', productId: 'stack', rating: 4, text: 'Beautiful rings. Took a few days longer than I hoped, but worth it.', who: 'Agnė, Kaunas', createdAt: ago(90) },
    { id: 'r4', orderItemId: 'o-1004:ripple', makerId: 'mara', productId: 'ripple', rating: 5, text: 'The speckles are even prettier in daylight. Packed really well.', who: 'Jonas, Riga', createdAt: ago(35) },
    { id: 'r5', orderItemId: 'o-1005:plates', makerId: 'mara', productId: 'plates', rating: 5, text: 'We use them every morning. Mara wrote a lovely note.', who: 'Marta, Tallinn', createdAt: ago(70) },
  ];
}

export function seedMessages(): ChatMessage[] {
  const t = (minsAgo: number) => new Date(Date.now() - minsAgo * 60e3).toISOString();
  return [
    { id: 'm1', makerId: 'inez', fromMe: true, text: 'Hi Inez! Is the chain length adjustable?', at: t(70), productId: 'necklace' },
    { id: 'm2', makerId: 'inez', fromMe: false, text: 'Hi! Yes, it’s 42 cm with a 5 cm extender, so up to 47 cm.', at: t(68) },
    { id: 'm3', makerId: 'inez', fromMe: true, text: 'Perfect. Could it arrive before Friday?', at: t(67) },
    { id: 'm4', makerId: 'inez', fromMe: false, text: 'If you order today I’ll send it tomorrow morning. Parcel lockers take 2–3 days.', at: t(65) },
    { id: 'm5', makerId: 'mara', fromMe: false, text: 'Glazes are ready, sending a photo soon', at: t(60 * 24 * 2) },
    { id: 'm6', makerId: 'ula', fromMe: false, text: 'Thanks for the review!', at: t(60 * 24 * 22) },
    { id: 'm7', makerId: 'mara', buyer: 'jonas', buyerName: 'Jonas', fromMe: true, text: 'Hi Mara, could the candle cups come in a set of two with a box?', at: t(60 * 20) },
  ];
}

export function seedRequests(): CustomRequest[] {
  return [
    { id: 'cr1', makerId: 'mara', kind: 'Plates', text: 'Could you make the plates in blue?', photos: [], budget: '100_200', when: 'no_rush', status: 'sent', createdAt: ago(1), buyerName: 'Lina' },
  ];
}

export function seedApplications(): MakerApplication[] {
  return [
    { id: 'app1', name: 'Rūta Petrauskė', email: 'ruta@example.com', city: 'Klaipėda', country: 'Lithuania', link: '@ruta.clay', categories: ['ceramics'], photos: [img('ripple-bowl-wide'), img('dish'), img('morning-cup')], about: 'Hand-built bowls from local clay, fired in my garage kiln.', makesItself: true, status: 'pending', createdAt: ago(1) },
  ];
}

export function seedStats(): Record<string, MakerStats> {
  return {
    mara: { views: 1284, viewsChangePct: 18, saves: 96, savesChange: 12, followers: 214, followersChange: 9, avgReplyHours: 3, weeklySalesCents: [4200, 9600, 3200, 13400, 7800, 5800, 11400, 6120] },
  };
}

/** Orders: Lina's own (buyer side) and Mara's (studio side). Line products are filled in by mock.ts. */
export type OrderSeed = Omit<Order, 'lines'> & { lines: { productId: string; qty: number; variant?: Record<string, string> }[] };
export function seedOrders(): OrderSeed[] {
  const lina = { name: 'Lina K.', email: 'lina@example.com', city: 'Vilnius' };
  return [
    { id: 'o-1042', number: 1042, makerId: 'mara', paymentGroupId: 'g-1042', createdAt: ago(1), status: 'paid', lines: [{ productId: 'plates', qty: 1 }], itemsCents: 9600, shippingCents: 490, giftWrapCents: 600, totalCents: 10690, delivery: 'locker', lockerAddress: 'Omniva parcel locker · Vilnius, Užupio g. 9', buyer: lina, gift: { toName: 'Ruta', note: 'For Ruta. Happy new home!', wrap: true }, shipBy: ahead(2) },
    { id: 'o-1041', number: 1041, makerId: 'mara', paymentGroupId: 'g-1041', createdAt: ago(1.5), status: 'paid', lines: [{ productId: 'candle', qty: 2 }], itemsCents: 8400, shippingCents: 490, giftWrapCents: 0, totalCents: 8890, delivery: 'locker', lockerAddress: 'DPD Pickup · Riga, Brīvības iela 40', buyer: { name: 'Jonas', email: 'jonas@example.com', city: 'Riga' }, shipBy: ahead(3) },
    { id: 'o-1038', number: 1038, makerId: 'inez', paymentGroupId: 'g-1038', createdAt: ago(4), status: 'shipped', lines: [{ productId: 'bracelet', qty: 1 }], itemsCents: 11000, shippingCents: 490, giftWrapCents: 0, totalCents: 11490, delivery: 'locker', buyer: lina, shipBy: ago(2), shippedAt: ago(2), trackingNumber: 'CE473920115LT' },
    { id: 'o-1021', number: 1021, makerId: 'ula', paymentGroupId: 'g-1021', createdAt: ago(30), status: 'delivered', lines: [{ productId: 'hood', qty: 1, variant: { Size: 'S/M' } }], itemsCents: 4999, shippingCents: 490, giftWrapCents: 0, totalCents: 5489, delivery: 'locker', buyer: lina, shipBy: ago(27), shippedAt: ago(27), deliveredAt: ago(24) },
  ];
}

export const DEMO_ME = {
  id: 'me', name: 'Lina', email: 'lina@example.com', city: 'Vilnius', since: '2026-11-01',
  address: { fullName: 'Lina K.', phone: '', locker: 'Omniva · Vilnius, Užupio g. 9', street: '' },
  notify: { replies: true, shipping: true, newFromFollowed: false },
};
