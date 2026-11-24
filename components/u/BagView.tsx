'use client';
import Link from 'next/link';
import { addToBag, getBag, getSaved, holdAgain, removeFromBag, setBagQty } from '@/lib/data';
import { formatEUR, formatEURExact, mmss, plural, shipsLine } from '@/lib/format';
import { useData, useNow } from '@/lib/useData';
import { Clock, Trash } from './Icons';
import { toast } from './Toast';
import s from './BagView.module.css';
import Img from '@/components/u/Img';

/** The bag: one box per maker (her own parcel and button), free-shipping helper, real 15-minute holds. */
export default function BagView({ compact = false, onNavigate }: { compact?: boolean; onNavigate?: () => void }) {
  const [bag] = useData(getBag);
  const [saved] = useData(getSaved);
  const now = useNow();
  if (!bag) return null;

  if (!bag.groups.length) {
    const fromSaved = (saved ?? []).filter((p) => !p.sold).slice(0, 3);
    return (
      <div className="u-stack">
        <div className={`g ${s.empty}`}>
          <span className="hand">Your bag is empty</span>
          <p className="m m0">When you add a piece, we hold it for you for 15 minutes.</p>
          <Link href="/" className="cta" onClick={onNavigate}>Discover makers</Link>
        </div>
        {fromSaved.length ? (
          <div className="u-stack">
            <span className="lbl">From your saved</span>
            <div className={s.saved}>{fromSaved.map((p) => <Link key={p.id} href={`/p/${p.id}`} onClick={onNavigate}><Img small src={p.images[0]} alt="" /><span>{p.title}</span></Link>)}</div>
          </div>
        ) : null}
      </div>
    );
  }

  const left = bag.holdEndsAt ? new Date(bag.holdEndsAt).getTime() - now : 0;
  const total = bag.groups.reduce((a, g) => a + g.itemsCents + g.shippingCents, 0);
  const remove = async (id: string, title: string, variant?: Record<string, string>, qty = 1) => {
    await removeFromBag(id, variant);
    toast(`Removed ${title}`, { label: 'Undo', run: () => { addToBag({ productId: id, qty, variant }); } });
  };

  return (
    <div className="u-stack">
      {left > 0 ? (
        <div className={`gs ${s.hold}`} role="status">
          <span className={s.ico}><Clock size={18} /></span>
          <span className="flex col gap-4 t-small">
            <span>{bag.heldCount === 1 ? 'Your piece is held for ' : `Your ${bag.heldCount} pieces are held for `}<b className="num">{mmss(left)}</b></span>
            <span className="m t-meta">{bag.heldCount === 1 ? 'After that it goes back on sale for others.' : 'After that they go back on sale for others.'}</span>
          </span>
        </div>
      ) : null}

      {bag.groups.map((g) => {
        const ship = g.shippingCents;
        const pct = g.maker.freeShippingFromCents ? Math.min(100, (g.itemsCents / g.maker.freeShippingFromCents) * 100) : 0;
        const soonest = Math.min(...g.lines.map((l) => l.product.shipsWithinDays));
        const allMto = g.lines.every((l) => l.product.madeToOrder);
        return (
          <section key={g.maker.id} className={`${compact ? 'gs' : 'g'} ${s.group}`} aria-label={`From ${g.maker.name}`}>
            <div className={s.ghead}>
              <Img small src={g.maker.portraitUrl} alt="" className="u-avatar" />
              <Link href={`/m/${g.maker.slug}`} className="hand tap" onClick={onNavigate}>{g.maker.name}</Link>
              <span className="m t-meta">{allMto ? shipsLine({ madeToOrder: true, shipsWithinDays: soonest }) : shipsLine({ madeToOrder: false, shipsWithinDays: soonest })}</span>
            </div>
            {g.lines.map((l) => {
              const p = l.product;
              const h = l.hold;
              const holdLeft = h ? new Date(h.expiresAt).getTime() - now : 0;
              const sub = [p.subtitle ?? p.materials[0], l.variant ? Object.entries(l.variant).map(([k, v]) => `${k} ${v}`).join(' · ') : '', p.oneOfAKind ? '1 of 1' : '', p.madeToOrder ? 'Made to order' : ''].filter(Boolean).join(' · ');
              return (
                <div key={p.id + JSON.stringify(l.variant ?? {})} className={s.line}>
                  <Link href={`/p/${p.id}`} onClick={onNavigate}><Img small src={p.images[0]} alt="" /></Link>
                  <span className={s.info}>
                    <span>{p.title}</span>
                    <span className={`m ${s.sub}`}>{sub}</span>
                    {!p.madeToOrder && h && holdLeft > 0 ? <span className={`${s.sub} ${s.held} num`}>Held for you · {mmss(holdLeft)}</span> : null}
                    {!p.madeToOrder && (!h || holdLeft <= 0) ? (
                      p.heldByOther ? <span className={`${s.sub} ${s.held}`}>In someone’s bag right now</span>
                        : <span className={s.sub}><span className="m">Hold ended, still available · </span><button type="button" className="link" onClick={() => holdAgain(p.id)}>Hold again</button></span>
                    ) : null}
                    {!p.oneOfAKind ? (
                      <span className={s.qty}>
                        <button type="button" aria-label={`One less ${p.title}`} onClick={() => (l.qty > 1 ? setBagQty(p.id, l.variant, l.qty - 1) : remove(p.id, p.title, l.variant))}>−</button>
                        <span aria-label="Quantity">{l.qty}</span>
                        <button type="button" aria-label={`One more ${p.title}`} disabled={!p.madeToOrder && l.qty >= (p.freeStock ?? p.stock)} onClick={() => setBagQty(p.id, l.variant, l.qty + 1)}>+</button>
                      </span>
                    ) : null}
                  </span>
                  <span className={s.price}>{formatEUR(p.priceCents * l.qty)}</span>
                  <button type="button" className="ic" aria-label={`Remove ${p.title}`} onClick={() => remove(p.id, p.title, l.variant, l.qty)}><Trash /></button>
                </div>
              );
            })}
            {g.freeShippingLeftCents ? (
              <div className={s.free}>
                <div className={s.top}><span>Free shipping from {formatEUR(g.maker.freeShippingFromCents!)}</span><span className="m">{formatEUR(g.freeShippingLeftCents)} to go</span></div>
                <span className={s.bar}><span style={{ width: `${pct}%` }} /></span>
                {g.upsell.length ? (
                  <>
                    <span className="m t-meta">More from {g.maker.name} that would get you there</span>
                    <div className={s.ups}>
                      {g.upsell.map((u) => (
                        <button key={u.id} type="button" aria-label={`Add ${u.title}`} onClick={async () => { const r = await addToBag({ productId: u.id, qty: 1 }); toast(r.ok ? `Added ${u.title}` : 'Could not add it right now'); }}>
                          <span className={s.ph}><Img small src={u.images[0]} alt="" className="u-cover" /><span className={`gs ${s.plus}`}>+</span></span>
                          <span className={s.nm}>{u.title}</span><span className="m">{formatEUR(u.priceCents)}</span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            ) : g.maker.freeShippingFromCents ? <span className="t-small">You get free shipping from {g.maker.name}</span> : null}
            <div className={`m ${s.ship}`}><span>Delivery to parcel locker</span><span>{ship ? formatEURExact(ship) : 'Free'}</span></div>
            <Link href={`/checkout?maker=${g.maker.id}`} className={compact ? 'sec gs' : 'cta'} onClick={onNavigate}>Buy from {g.maker.name} · {formatEURExact(g.itemsCents + ship)}</Link>
          </section>
        );
      })}

      {bag.groups.length > 1 || compact ? (
        compact ? (
          <div className={s.foot}>
            <div className={`${s.ship} t-body fw600`}><span>Total · {plural(bag.groups.length, 'parcel')}</span><span className="num">{formatEURExact(total)}</span></div>
            <Link href="/checkout" className="cta" onClick={onNavigate}>{bag.groups.length > 1 ? 'Pay for all' : 'Checkout'}</Link>
            <span className="m t-meta tc">One payment. Each maker ships their own parcel.</span>
          </div>
        ) : (
          <div className={`g u-bar ${s.total} ${s.totalBar}`}>
            <span className={s.sum}><span className="m">{bag.groups.length === 2 ? 'Both makers' : `${bag.groups.length} makers`} · {plural(bag.groups.length, 'parcel')}</span><b>{formatEURExact(total)}</b></span>
            <Link href="/checkout" className="sec gs no-flex">Pay for all</Link>
          </div>
        )
      ) : null}
    </div>
  );
}
