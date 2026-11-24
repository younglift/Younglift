'use client';
import Link from 'next/link';
import { useState } from 'react';
import { CATEGORY_LABEL, addReview, getMe, getMyMaker, getOrders, getUnreadCount, markDelivered, resetDemo } from '@/lib/data';
import { longDate, monthName, shortDate } from '@/lib/format';
import { useData } from '@/lib/useData';
import { Stars } from '@/components/u/Bits';
import { toast } from '@/components/u/Toast';
import Wash from '@/components/u/Wash';

const STEPS = ['Paid', 'Packing', 'On the way', 'Delivered'];
const stepOf = (s: string) => (s === 'paid' ? 0 : s === 'packing' ? 1 : s === 'shipped' ? 2 : 3);

/** 08 Your profile + orders. */
export default function Account() {
  const [me] = useData(getMe);
  const [orders] = useData(getOrders);
  const [unread] = useData(getUnreadCount);
  const [maker] = useData(getMyMaker);
  const [open, setOpen] = useState<string | null>(null);
  const [rating, setRating] = useState<Record<string, number>>({});
  const [text, setText] = useState('');
  if (!me || !orders) return <Wash />;
  const since = `${monthName(me.since)} ${new Date(me.since).getFullYear()}`;
  const panel = (k: string, body: React.ReactNode) => (open === k ? <div className="m" style={{ padding: '0 0 12px', fontSize: 14, lineHeight: 1.55 }}>{body}</div> : null);
  const row = (k: string, label: string, right: string) => (
    <button type="button" onClick={() => setOpen(open === k ? null : k)} aria-expanded={open === k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 52, width: '100%', background: 'none', border: 0, color: 'var(--u-ink)', font: '500 15px var(--u-ui)', cursor: 'pointer', padding: 0 }}>
      <span>{label}</span><span className="m" style={{ fontSize: 13 }}>{right} {open === k ? '⌃' : '›'}</span>
    </button>
  );
  return (
    <>
      <Wash src={orders[0]?.lines[0].product.images[0] ?? '/img/bracelet.jpg'} />
      <main className="u-page narrow">
        <div className="u-head"><span className="gs" style={{ width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}><span className="hand">{me.name.slice(0, 1)}</span></span><span><h1 className="hand">{me.name}</h1><span className="m sub">{me.city} · with us since {since}</span></span></div>
        <span className="hand" style={{ fontSize: 18 }}>Your orders</span>
        {orders.map((o) => {
          const st = stepOf(o.status);
          const l = o.lines[0];
          const title = o.lines.length > 1 ? `${l.product.title} + ${o.lines.length - 1} more` : `${l.qty > 1 ? `${l.qty} × ` : ''}${l.product.title}`;
          const line = o.status === 'delivered' ? `Delivered ${o.deliveredAt ? shortDate(o.deliveredAt) : ''}` : o.status === 'shipped' ? `On the way${o.trackingNumber ? ` · ${o.trackingNumber}` : ''}` : `${o.maker.name} is packing · ships by ${longDate(o.shipBy)}`;
          const key = o.id;
          return (
            <article key={o.id} className="g u-card u-stack">
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <Link href={`/p/${l.product.id}`}><img src={l.product.images[0]} alt="" style={{ width: 64, height: 64, borderRadius: 14, objectFit: 'cover', display: 'block' }} /></Link>
                <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}><span style={{ fontWeight: 600 }}>{title}</span><Link href={`/m/${o.maker.slug}`} className="m" style={{ fontSize: 13 }}>from {o.maker.name} · #UL-{o.number}</Link><span style={{ fontSize: 13 }}>{line}</span></span>
              </div>
              {o.status === 'delivered' && !o.reviewed ? (
                <div className="u-stack" style={{ gap: 8 }}>
                  <span style={{ fontSize: 14 }}>How is your {l.product.title}?</span>
                  <Stars value={rating[key] ?? 0} onPick={(n) => setRating({ ...rating, [key]: n })} />
                  {rating[key] ? (
                    <form className="u-stack" style={{ gap: 8 }} onSubmit={async (e) => { e.preventDefault(); await addReview(o.id, l.product.id, rating[key], text); setText(''); toast(`Thanks! ${o.maker.name} will see your review.`); }}>
                      <textarea className="inp" rows={2} placeholder={`A few words for ${o.maker.name} (optional)`} value={text} onChange={(e) => setText(e.target.value)} />
                      <button type="submit" className="cta">Post review</button>
                    </form>
                  ) : null}
                </div>
              ) : o.status === 'delivered' ? <span className="m" style={{ fontSize: 13 }}>Thanks for your review ★</span> : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4, fontSize: 11 }}>
                    {STEPS.map((x, i) => <span key={x} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span style={{ height: 3, borderRadius: 2, background: i <= st ? 'var(--u-accent)' : 'var(--u-track)' }} /><span className={i <= st ? '' : 'm'}>{x}</span></span>)}
                  </div>
                  <div className="row" style={{ gap: 8 }}>
                    <Link href={`/messages/${o.maker.slug}`} className="sec gs" style={{ flex: 1 }}>Message {o.maker.name}</Link>
                    {o.status === 'shipped' ? <button type="button" className="sec gs" style={{ flex: 1 }} onClick={() => markDelivered(o.id)}>It arrived</button> : null}
                  </div>
                </>
              )}
            </article>
          );
        })}
        {!orders.length ? <div className="g u-card m">No orders yet.</div> : null}
        <nav className="g u-card" style={{ paddingTop: 4, paddingBottom: 4 }}>
          <Link href="/messages" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 52 }}><span>Messages</span><span className="m" style={{ fontSize: 13 }}>{unread ? `${unread} new ` : ''}›</span></Link>
          <hr className="hr" />
          <Link href="/welcome/taste" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 52 }}><span>Your taste</span><span className="m" style={{ fontSize: 13 }}>{me.taste.categories.map((c) => CATEGORY_LABEL[c]).join(' · ') || 'Not set'} ›</span></Link>
          <hr className="hr" />
          {row('addr', 'Addresses & payment', '')}
          {panel('addr', <>Your email: {me.email}. We don’t store cards: payments go through Stripe when they’re live. Your delivery details are filled in at checkout.</>)}
          <hr className="hr" />
          {row('notif', 'Notifications', '')}
          {panel('notif', <>You’ll get an email when a maker replies, ships your order or answers a custom request. More settings come with sign-in.</>)}
          <hr className="hr" />
          {row('privacy', 'Privacy & your data', '')}
          {panel('privacy', <>This demo keeps your data only in this browser. <button type="button" className="link" onClick={async () => { await resetDemo(); toast('Demo data reset'); }}>Reset demo data</button></>)}
          <hr className="hr" />
          {row('help', 'Help & returns', '')}
          {panel('help', <>14-day returns on ready pieces, free. Made-to-order and custom pieces can’t be returned unless they arrive damaged. Write to the maker first; if you can’t agree, we step in.</>)}
        </nav>
        <Link href={maker ? '/studio' : '/sell'} className="gs u-card row" style={{ justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span className="hand">{maker ? `Your studio · ${maker.name}` : 'You make things?'}</span><span className="m" style={{ fontSize: 13 }}>{maker ? 'Orders, pieces and payouts' : 'Open your studio on Uplift'}</span></span><span>→</span>
        </Link>
      </main>
    </>
  );
}
