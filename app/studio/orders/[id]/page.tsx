'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { getStudioOrder, markPacking, markShipped } from '@/lib/data';
import { formatEUR, formatEURExact, longDate, shortDate } from '@/lib/format';
import { useData } from '@/lib/useData';
import { BackButton } from '@/components/u/Bits';
import { toast } from '@/components/u/Toast';
import Wash from '@/components/u/Wash';

/** B9 Order → pack, print the label, mark as shipped (+ tracking). */
export default function Order() {
  const { id } = useParams<{ id: string }>();
  const [o] = useData(() => getStudioOrder(id), [id]);
  const [tracking, setTracking] = useState('');
  const [labelDone, setLabelDone] = useState(false);
  if (o === undefined) return <Wash />;
  if (o === null) return <main className="u-page"><Wash /><span className="hand">Order not found</span><Link href="/studio/orders" className="cta">Orders</Link></main>;
  const l = o.lines[0];
  const packed = o.status !== 'paid';
  const shipped = o.status === 'shipped' || o.status === 'delivered';
  const step = (n: number, done: boolean, t: string, d: string, extra?: React.ReactNode, onTick?: () => void) => (
    <div className="row" style={{ alignItems: 'flex-start', minHeight: 52 }}>
      {onTick ? <button type="button" className="chk" style={{ width: 28, height: 28, cursor: 'pointer', background: 'transparent', color: 'var(--u-ink)' }} aria-label={`Mark “${t}” done`} onClick={onTick}>{n}</button>
        : <span className={`chk ${done ? 'on' : ''}`} style={{ width: 28, height: 28 }} aria-label={done ? `${t}: done` : undefined}>{done ? '✓' : n}</span>}
      <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, fontSize: 14 }}><span style={{ fontWeight: 600 }}>{t}</span><span className="m">{d}</span></span>{extra}
    </div>
  );
  return (
    <>
      <Wash src={l.product.images[0]} />
      <main className="u-page narrow has-bar">
        <div className="u-head"><BackButton href="/studio/orders" /><span><h1 className="hand">Order #{o.number}</h1><span className="m sub">Paid {shortDate(o.createdAt)} · {shipped ? `shipped ${o.shippedAt ? shortDate(o.shippedAt) : ''}` : `ship by ${longDate(o.shipBy)}`}</span></span></div>
        <div className="g u-card u-stack">
          {o.lines.map((x) => (
            <div key={x.productId} className="row"><img src={x.product.images[0]} alt="" style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'cover' }} /><span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}><span className="hand">{x.product.title}</span><span className="m" style={{ fontSize: 13 }}>{[x.product.subtitle, x.variant ? Object.entries(x.variant).map(([k, v]) => `${k} ${v}`).join(' ') : '', `${x.qty} piece${x.qty > 1 ? 's' : ''}`].filter(Boolean).join(' · ')}</span></span><b className="num">{formatEUR(x.product.priceCents * x.qty)}</b></div>
          ))}
          <hr className="hr" />
          <div className="u-stack" style={{ gap: 8, fontSize: 14 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}><span className="m">Buyer</span><span>{o.buyer.name}, {o.buyer.city}</span></div>
            <div className="row" style={{ justifyContent: 'space-between' }}><span className="m">Delivery</span><span>{o.delivery === 'locker' ? 'Parcel locker' : 'To the door'} · {o.shippingCents ? formatEURExact(o.shippingCents) : 'Free'}</span></div>
            <div className="row" style={{ justifyContent: 'space-between' }}><span className="m">Gift wrap</span><span>{o.gift?.wrap ? `Yes · +${formatEUR(o.giftWrapCents)} (yours)` : 'No'}</span></div>
          </div>
          {o.gift?.note ? <div className="gs u-card"><span className="lbl">Card says</span><p className="hand" style={{ margin: '8px 0 0', fontSize: 15, lineHeight: 1.6 }}>“{o.gift.note}”</p></div> : null}
        </div>
        <div className="g u-card u-stack">
          {step(1, packed, 'Pack it', o.gift?.wrap ? 'Wrap it well. Add the gift card, no prices inside.' : 'Wrap it well so it arrives in one piece.', undefined, !packed ? async () => { await markPacking(o.id); toast('Packing · the buyer sees it'); } : undefined)}
          {step(2, labelDone || shipped, 'Print the label', o.lockerAddress ?? `${o.delivery === 'locker' ? 'Parcel locker' : 'Home address'} · ${o.buyer.city}`, <Link href={`/studio/orders/${o.id}/label`} className="sec gs" style={{ minHeight: 40, fontSize: 13 }} onClick={() => setLabelDone(true)}>Label</Link>)}
          {step(3, shipped, 'Mark as shipped', `${o.buyer.name.split(' ')[0]} gets the tracking link right away.`)}
        </div>
        {!shipped ? (
          <div className="g u-card"><label className="fld"><span className="lbl">Tracking number</span><input className="inp" value={tracking} onChange={(e) => setTracking(e.target.value.toUpperCase())} placeholder="e.g. CE473920115LT" /><span className="m" style={{ fontSize: 12 }}>Optional, but buyers love it.</span></label></div>
        ) : o.trackingNumber ? <div className="gs u-card">Tracking: <b>{o.trackingNumber}</b></div> : null}
        <Link href="/studio/messages" className="sec gs">Message {o.buyer.name.split(' ')[0]}</Link>
        <div className="g u-bar">
          {shipped ? <Link href="/studio/orders" className="cta">Back to orders</Link>
            : <button type="button" className="cta" onClick={async () => { await markShipped(o.id, tracking); toast(`Shipped. ${o.buyer.name.split(' ')[0]} got a note.`); }}>Mark as shipped</button>}
        </div>
      </main>
    </>
  );
}
