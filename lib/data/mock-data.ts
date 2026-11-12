// Demo content copied from prototype/index.html (makers Inez, Mara, Ula and their pieces).
// Justinas replaces this with Supabase data later; the shapes stay the same.
// Note: Mara (Berlin) and Ula (Hamburg) are demo makers outside the launch countries;
// `country` uses 'LT' as a placeholder until real makers replace them.
import type { Category, Maker, Product } from '@/lib/types';

const img = (name: string) => `/img/${name}.jpg`;

/** Extra prototype fields Matas's screens may need (journal, about, process, Q&A). */
export type MakerExtras = {
  craft: string;
  material: string;
  replyTime: string;
  acceptsCustom: boolean;
  work: string[]; // the three collage images on Discover
  meet: { image: string; qa: [string, string][] };
  process: { image: string; title: string; steps: string[] };
  closerProductId: string;
  journal: { date: string; title: string; text: string; image?: string; isVideo?: boolean }[];
  about: { heading: string; text: string }[];
};

export const MAKERS: Maker[] = [
  {
    id: 'inez', slug: 'inez', name: 'Inez', studio: 'Studio Serein', city: 'Vilnius', country: 'LT',
    categories: ['jewelry'],
    quote: 'I want a ring to feel like a tiny sculpture you can keep close.',
    bio: 'I make silver rings one at a time in a small studio in Vilnius. I carve each shape in wax first, so every ring keeps a little of my hand in it. I like pieces that look a bit imperfect up close.',
    portraitUrl: img('inez'), coverUrl: img('rings-set'),
    style: 'light', sections: ['featured', 'pieces', 'journal', 'about'], followers: 214,
  },
  {
    id: 'mara', slug: 'mara', name: 'Mara', studio: 'Studio Lehm', city: 'Berlin', country: 'LT',
    categories: ['ceramics'],
    quote: 'I leave the edges a little uneven. That is where the character lives.',
    bio: 'I build cups, bowls and vases by hand in a small studio in Neukölln. Nothing is thrown on the wheel. Every rim is pinched, so no two pieces match.',
    portraitUrl: img('mara'), coverUrl: img('ceramics-set'),
    style: 'light', sections: ['featured', 'pieces', 'journal', 'about'], followers: 368,
  },
  {
    id: 'ula', slug: 'ula', name: 'Ula', studio: 'Mokume', city: 'Hamburg', country: 'LT',
    categories: ['clothing', 'textiles'],
    quote: 'A piece of home, made to come with you.',
    bio: 'I crochet hoods and scarves from wool bought at small farms in northern Germany. Every square is made by hand, one flower at a time.',
    portraitUrl: img('crochet-duo'), coverUrl: img('crochet-duo'),
    style: 'light', sections: ['featured', 'pieces', 'journal', 'about'], followers: 152,
  },
];

export const MAKER_EXTRAS: Record<string, MakerExtras> = {
  inez: {
    craft: 'Silver rings', material: 'Recycled silver', replyTime: 'about a day', acceptsCustom: true,
    work: [img('rings-set'), img('flow-ring'), img('soft-loop')],
    meet: { image: img('inez'), qa: [
      ['What do you make?', 'Silver rings, mostly one at a time, in a small studio in Vilnius.'],
      ['Why by hand?', 'I like pieces that feel a little imperfect. You can still see where my hands shaped them.'],
      ['Do you take commissions?', 'Yes, in your size or as a gift. Ask me anything.'],
    ] },
    process: { image: img('workbench'), title: 'HOW A RING IS MADE', steps: [
      'I carve the shape in wax with small files.',
      'The wax is cast in recycled sterling silver.',
      'I file, sand and polish it by hand. About two days.',
    ] },
    closerProductId: 'flow',
    journal: [
      { date: '12 Oct', title: 'New wax models', text: 'Five new shapes on the bench this week. Two will become rings, three go back in the drawer.', image: img('workbench') },
      { date: '28 Sep', title: 'Gold for the first time', text: 'The Soft loop now comes in gold vermeil. Same shape, warmer light.', image: img('soft-loop') },
      { date: '14 Sep', title: 'How a ring is cast', text: 'Video not filmed yet. In the demo this post shows a photo.', image: img('fold-ring'), isVideo: true },
      { date: '2 Sep', title: 'From the sketchbook', text: '“Start with the hand, not the drawing. The drawing always lies a little.”' },
      { date: '20 Aug', title: 'The Fold ring, finished', text: 'Six weeks from first wax to final polish. Brushed, not mirrored.', image: img('fold-ring') },
    ],
    about: [
      { heading: 'APPROACH', text: 'I think of every ring as a small sculpture that happens to fit a finger. I studied sculpture first, and I still start with the hand, not the drawing.' },
      { heading: 'MATERIALS', text: 'Recycled sterling silver and gold vermeil. Cast down the street, finished by hand at my bench.' },
      { heading: 'INFLUENCES', text: 'River stones, Brancusi, and the way old silver goes soft at the edges.' },
      { heading: 'WHERE I WORK', text: 'A shared studio in Užupis, Vilnius. Custom pieces take two to four weeks. I ship across the EU.' },
    ],
  },
  mara: {
    craft: 'Hand-built ceramics', material: 'Speckled stoneware', replyTime: 'a few hours', acceptsCustom: true,
    work: [img('ceramics-set'), img('ripple-bowl'), img('morning-cup')],
    meet: { image: img('mara'), qa: [
      ['What do you make?', 'Cups, bowls and vases for everyday use. Built by hand, glazed in small batches.'],
      ['Why by hand?', 'Pinching the clay leaves soft, uneven edges. That is where the character lives.'],
      ['Do you take commissions?', 'Yes. Sets for a table, or a cup in a colour you love.'],
    ] },
    process: { image: img('ripple-bowl-wide'), title: 'HOW A BOWL IS MADE', steps: [
      'I pinch and coil the clay, no wheel.',
      'It dries slowly for a week, then the first firing.',
      'I glaze by dipping and fire it a second time.',
    ] },
    closerProductId: 'twist',
    journal: [
      { date: '10 Oct', title: 'A new oat glaze', text: 'Warmer than the old one. The cups look like toast now.', image: img('morning-cup') },
      { date: '24 Sep', title: 'The tall twist', text: 'A vase that took three tries to stand straight.', image: img('twist-vase') },
      { date: '8 Sep', title: 'Kiln day', text: 'Video not filmed yet. In the demo this post shows a photo.', image: img('ripple-bowl-wide'), isVideo: true },
      { date: '30 Aug', title: 'On the studio wall', text: '“If it wobbles, it’s mine.”' },
      { date: '15 Aug', title: 'A table set', text: 'Six bowls for one family, each a little different.', image: img('ceramics-set') },
    ],
    about: [
      { heading: 'APPROACH', text: 'I build by hand because I like slow shapes. Every bowl starts as a ball of clay pinched between my thumbs.' },
      { heading: 'MATERIALS', text: 'Speckled stoneware and terracotta, food-safe glazes, fired twice.' },
      { heading: 'INFLUENCES', text: 'Japanese tea bowls, Berlin breakfasts, and the colour of oat milk.' },
      { heading: 'WHERE I WORK', text: 'A ground-floor studio in Neukölln, Berlin. I ship across the EU in recycled packaging.' },
    ],
  },
  ula: {
    craft: 'Crochet hoods', material: 'Wool from small farms', replyTime: 'about a day', acceptsCustom: true,
    work: [img('crochet-duo'), img('flower-hood'), img('crochet-details')],
    meet: { image: img('crochet-duo'), qa: [
      ['What do you make?', 'Hoods and scarves made of crochet squares, mostly in moss, cream and rust.'],
      ['Why by hand?', 'Each square takes about forty minutes. You can feel every one of them.'],
      ['Do you take commissions?', 'Yes, in your colours or your size.'],
    ] },
    process: { image: img('crochet-detail'), title: 'SQUARE BY SQUARE', steps: [
      'I crochet each flower square by hand, about forty minutes each.',
      'Eight squares are joined into a hood.',
      'I wash and block it so it keeps its shape.',
    ] },
    closerProductId: 'hood',
    journal: [
      { date: '5 Oct', title: 'Moss and cream again', text: 'The colours everyone asks for. Twelve hoods this month.', image: img('flower-hood') },
      { date: '20 Sep', title: 'Close up', text: 'Every flower has six petals. I count them in my sleep.', image: img('crochet-details') },
      { date: '2 Sep', title: 'Joining squares', text: 'Video not filmed yet. In the demo this post shows a photo.', image: img('crochet-detail'), isVideo: true },
      { date: '18 Aug', title: 'A note to myself', text: '“Warm first, pretty second. Then both.”' },
    ],
    about: [
      { heading: 'APPROACH', text: 'Warm first, pretty second. I want pieces you actually wear every cold morning.' },
      { heading: 'MATERIALS', text: 'Wool from small farms in northern Germany, cotton for the lighter scarves.' },
      { heading: 'INFLUENCES', text: 'My grandmother’s blankets and Hamburg rain.' },
      { heading: 'WHERE I WORK', text: 'At my kitchen table in Hamburg-Altona. Made-to-order pieces take one to two weeks.' },
    ],
  },
};

const RING = [{ name: 'Ring size (EU)', options: ['50', '52', '54', '56', '58'] }];
const HOOD = [{ name: 'Size', options: ['S/M', 'M/L'] }];
const SHIPPING = 490;

type Raw = [id: string, makerId: string, title: string, material: string, eur: number, image: string,
  status: 'ready' | 'order' | 'sold', category: Category, variants: Product['variants'], description: string];

// status: ready = in stock, order = made to order, sold = one of a kind and gone
const RAW: Raw[] = [
  ['flow', 'inez', 'Flow ring', 'Polished recycled silver', 145, 'flow-ring', 'order', 'jewelry', RING, 'Recycled sterling silver. Band 4–9 mm, organic. About 7 g.'],
  ['fold', 'inez', 'Fold ring', 'Brushed silver', 160, 'fold-ring', 'order', 'jewelry', RING, 'Recycled sterling silver, brushed finish. About 8 g.'],
  ['soft', 'inez', 'Soft loop', 'Gold vermeil', 190, 'soft-loop', 'ready', 'jewelry', RING, 'Gold vermeil on silver. Band 6–10 mm. About 9 g.'],
  ['wave', 'inez', 'Wave band', 'Polished silver', 120, 'rings-set', 'order', 'jewelry', RING, 'Recycled sterling silver. Band 5 mm. About 6 g.'],
  ['trio', 'inez', 'Trio, first edition', 'Silver and gold', 420, 'rings-set', 'sold', 'jewelry', undefined, 'Three rings in silver and gold vermeil.'],
  ['ripple', 'mara', 'Ripple bowl', 'Speckled stoneware', 78, 'ripple-bowl', 'ready', 'ceramics', undefined, 'Speckled stoneware. Ø 24 cm. Dishwasher safe.'],
  ['twist', 'mara', 'Twist vase', 'Terracotta', 120, 'twist-vase', 'ready', 'ceramics', undefined, 'Terracotta, glazed inside. 38 cm tall. One of a kind.'],
  ['cup', 'mara', 'Morning cup', 'Stoneware', 32, 'morning-cup', 'ready', 'ceramics', undefined, 'Stoneware, oat glaze. Holds 250 ml. Dishwasher safe.'],
  ['salad', 'mara', 'Wide salad bowl', 'Stoneware', 64, 'ripple-bowl-wide', 'order', 'ceramics', undefined, 'Stoneware. Ø 30 cm. Hand wash.'],
  ['still', 'mara', 'Still life set', 'Stoneware and terracotta', 210, 'ceramics-set', 'sold', 'ceramics', undefined, 'Bowl, vase and cup.'],
  ['hood', 'ula', 'Flower hood', 'Wool', 49.99, 'flower-hood', 'order', 'clothing', HOOD, 'Wool from small farms. Fits head 54–60 cm. Hand wash cold.'],
  ['square', 'ula', 'Granny square hood', 'Wool', 59, 'crochet-detail', 'ready', 'clothing', HOOD, 'Wool, eight squares. Hand wash cold.'],
  ['scarf', 'ula', 'Square scarf', 'Wool and cotton', 45, 'crochet-details', 'order', 'textiles', undefined, 'Wool and cotton. 160 cm long. Hand wash cold.'],
  ['pair', 'ula', 'Matching pair', 'Wool', 98, 'crochet-duo', 'sold', 'clothing', undefined, 'Two hoods.'],
];

export const PRODUCTS: Product[] = RAW.map(([id, makerId, title, material, eur, image, status, category, variants, description]) => ({
  id, makerId, title, description,
  priceCents: Math.round(eur * 100), currency: 'EUR',
  images: [img(image)],
  category, materials: [material], variants,
  stock: status === 'sold' ? 0 : status === 'ready' ? 1 : 10,
  oneOfAKind: status === 'sold' || id === 'twist',
  shippingCents: SHIPPING,
}));
