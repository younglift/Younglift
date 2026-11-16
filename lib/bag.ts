// Bag maths shared by Bag and Checkout. Each maker ships a separate parcel; shipping is the
// highest shipping price among that maker's pieces, free above the maker's threshold.
import type { BagLine, Product } from '@/lib/types';
import { MAKER_EXTRAS } from '@/lib/data';

export type BagGroup = { makerId: string; lines: { line: BagLine; index: number }[]; itemsCents: number; shippingCents: number; free: boolean };

export function bagTotals(bag: BagLine[], products: Record<string, Product>) {
  const order: string[] = [];
  const groups: Record<string, BagGroup> = {};
  bag.forEach((line, index) => {
    const p = products[line.productId];
    if (!p) return;
    if (!groups[p.makerId]) { order.push(p.makerId); groups[p.makerId] = { makerId: p.makerId, lines: [], itemsCents: 0, shippingCents: 0, free: false }; }
    const g = groups[p.makerId];
    g.lines.push({ line, index });
    g.itemsCents += p.priceCents * line.qty;
    g.shippingCents = Math.max(g.shippingCents, p.shippingCents);
  });
  const list = order.map((id) => {
    const g = groups[id];
    const limit = MAKER_EXTRAS[id]?.freeShippingOverCents;
    const free = limit != null && g.itemsCents >= limit;
    return { ...g, free, shippingCents: free ? 0 : g.shippingCents };
  });
  const itemsCents = list.reduce((a, g) => a + g.itemsCents, 0);
  const shippingCents = list.reduce((a, g) => a + g.shippingCents, 0);
  const pieces = bag.reduce((a, l) => a + (products[l.productId] ? l.qty : 0), 0);
  return { groups: list, itemsCents, shippingCents, totalCents: itemsCents + shippingCents, pieces };
}
