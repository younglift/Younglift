'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { BagLine, Maker, Product } from '@/lib/types';
import { getBag, MAKER_EXTRAS, search, updateBag } from '@/lib/data';
import { formatEUR } from '@/lib/format';
import { bagChanged } from '@/components/BottomNav';
import BottomNav from '@/components/BottomNav';
import ProfileLink from '@/components/ProfileLink';
import { Trash } from '@/components/Icons';
import { bagTotals } from '@/lib/bag';
import s from './bag.module.css';

// A10 · Bag (docs/design/screens/Bag*.dc.html): grouped by maker (each maker ships a parcel),
// −/+ only when more than one exists, trash with Undo, maker's free-shipping goal, sticky CHECKOUT.

export default function Bag() {
  const [bag, setBag] = useState<BagLine[]>([]);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [makers, setMakers] = useState<Record<string, Maker>>({});
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<{ text: string; line: BagLine; idx: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const load = useCallback(async () => {
    const [b, res] = await Promise.all([getBag(), search('')]);
    setBag(b);
    setProducts(Object.fromEntries(res.products.map((p) => [p.id, p])));
    setMakers(Object.fromEntries(res.makers.map((m) => [m.id, m])));
    setReady(true);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save(next: BagLine[]) {
    setBag(next);
    await updateBag(next);
    bagChanged();
  }
  function setQty(i: number, d: number) {
    const l = bag[i]; const p = products[l.productId];
    const qty = Math.min(p?.stock ?? 1, Math.max(1, l.qty + d));
    save(bag.map((x, j) => (j === i ? { ...x, qty } : x)));
  }
  function remove(i: number) {
    const line = bag[i];
    save(bag.filter((_, j) => j !== i));
    clearTimeout(timer.current);
    setToast({ text: `${products[line.productId]?.title ?? 'Piece'} removed`, line, idx: i });
    timer.current = setTimeout(() => setToast(null), 4000);
  }
  function undo() {
    if (!toast) return;
    const next = [...bag];
    next.splice(toast.idx, 0, toast.line);
    save(next);
    setToast(null);
  }

  const t = bagTotals(bag, products);
  const empty = ready && bag.length === 0;

  return (
    <main className={s.screen}>
      <div className={s.head}>
        <h1 className={s.h1}>BAG</h1>
        <span className={s.headRight}>{!empty && ready && <span className="mono">{t.pieces} {t.pieces === 1 ? 'PIECE' : 'PIECES'}</span>}<ProfileLink /></span>
      </div>

      {empty && (
        <div className={s.empty}>
          <span className={s.emptyTitle}>YOUR BAG IS EMPTY</span>
          <Link href="/" className={s.primary}>DISCOVER MAKERS</Link>
          <Link href="/saved" className={s.link}>Your saved pieces</Link>
        </div>
      )}

      {t.groups.map((g) => {
        const m = makers[g.makerId];
        const x = MAKER_EXTRAS[g.makerId];
        return (
          <section key={g.makerId} className={s.group}>
            {m && (
              <Link href={`/maker/${m.slug}?from=bag`} className={s.groupHead}>
                <img src={m.portraitUrl} alt="" />
                <span className={s.groupName}>{m.name}</span>
                <span className={s.ships}>Ships from {m.city}</span>
              </Link>
            )}
            {g.lines.map(({ line, index }) => {
              const p = products[line.productId];
              if (!p) return null;
              const multi = p.stock > 1;
              const meta = [
                ...Object.entries(line.variant ?? {}).map(([k, v]) => `${k.startsWith('Ring') ? 'Size' : k} ${v}`),
                p.oneOfAKind || p.stock === 1 ? '1 of 1' : null,
                line.qty > 1 ? `${formatEUR(p.priceCents)} each` : null,
              ].filter(Boolean).join(' · ');
              return (
                <div key={index} className={s.line}>
                  <Link href={`/product/${p.id}?from=bag`}><img src={p.images[0]} alt={p.title} /></Link>
                  <div className={s.lineBody}>
                    <div className={s.lineTop}><span className={s.lineName}>{p.title}</span><span className="mono">{formatEUR(p.priceCents * line.qty)}</span></div>
                    {meta && <span className={s.meta}>{meta}</span>}
                    <div className={s.lineActions}>
                      {multi && (
                        <span className={s.qty}>
                          <button type="button" aria-label="One less" onClick={() => (line.qty > 1 ? setQty(index, -1) : remove(index))}>−</button>
                          <span className="mono">{line.qty}</span>
                          <button type="button" aria-label="One more" disabled={line.qty >= p.stock} onClick={() => setQty(index, 1)}>+</button>
                        </span>
                      )}
                      <span className={s.spacer} />
                      <button type="button" className={s.trash} aria-label={`Remove ${p.title}`} onClick={() => remove(index)}><Trash /></button>
                    </div>
                  </div>
                </div>
              );
            })}
            {x?.freeShippingOverCents != null && m && (
              <div className={s.goal}>
                <span style={{ color: g.free ? 'var(--accent)' : 'var(--fg)' }}>
                  {g.free ? `You get free shipping from ${m.name}` : `Add ${formatEUR(x.freeShippingOverCents - g.itemsCents)} more from ${m.name} for free shipping`}
                </span>
                <span className={s.bar}><span style={{ width: `${Math.min(100, Math.round((g.itemsCents / x.freeShippingOverCents) * 100))}%` }} /></span>
              </div>
            )}
            <div className={s.shipRow}><span>Shipping to Lithuania</span><span className="mono" style={{ color: g.free ? 'var(--accent)' : undefined }}>{g.free ? 'Free' : formatEUR(g.shippingCents)}</span></div>
          </section>
        );
      })}

      {!empty && ready && (
        <div className={s.totals}>
          <div><span>Pieces</span><span className="mono">{formatEUR(t.itemsCents)}</span></div>
          <div><span>Shipping · {t.groups.length} {t.groups.length === 1 ? 'parcel' : 'parcels'}</span><span className="mono">{formatEUR(t.shippingCents)}</span></div>
          <div className={s.total}><span>Total</span><span className="mono">{formatEUR(t.totalCents)}</span></div>
        </div>
      )}

      {toast && (
        <div className={`glass ${s.toast} ${bag.length ? s.toastHigh : ''}`} role="status">
          <span>{toast.text}</span>
          <button type="button" onClick={undo}>Undo</button>
        </div>
      )}

      {!empty && ready && (
        <div className={s.checkoutBar}>
          <Link href="/checkout" className={s.checkout}>CHECKOUT <span className="mono">{formatEUR(t.totalCents)}</span></Link>
        </div>
      )}
      <div className={bag.length ? s.spaceBig : s.space} />
      <BottomNav />
    </main>
  );
}
