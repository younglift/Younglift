'use client';
import Link from 'next/link';
import { useState } from 'react';
import { CATEGORY_LABEL, addReview, canReturn, getMe, getMyMaker, getOrders, getUnreadCount, markDelivered, requestReturn, resetDemo, saveAddress, saveNotify } from '@/lib/data';
import { longDate, monthName, shortDate } from '@/lib/format';
import { useData } from '@/lib/useData';
import { Stars } from '@/components/u/Bits';
import { toast } from '@/components/u/Toast';
import Loading from '@/components/u/Loading';
import Wash from '@/components/u/Wash';
import Img from '@/components/u/Img';

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
  const [addr, setAddr] = useState<NonNullable<typeof me>['address']>();
  const [returning, setReturning] = useState<string | null>(null);
  const [why, setWhy] = useState('');
  if (!me || !orders) return <Loading />;
  const a = addr ?? me.address;
  const since = `${monthName(me.since)} ${new Date(me.since).getFullYear()}`;
  const panel = (k: string, body: React.ReactNode) => (open === k ? <div className="m" style={{ padding: '0 0 12px', fontSize: 14, lineHeight: 1.55 }}>{body}</div> : null);
  const row = (k: string, label: string, right: string) => (
    <button type="button" onClick={() => setOpen(open === k ? null : k)} aria-expanded={open === k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 52, width: '100%', background: 'none', border: 0, color: 'var(--u-ink)', font: '500 15px var(--u-ui)', cursor: 'pointer', padding: 0 }}>
      <span>{label}</span><span className="m t-small">{right} {open === k ? '⌃' : '›'}</span>
    </button>
  );
  return (
    <>
      <Wash src={orders[0]?.lines[0].product.images[0] ?? '/img/bracelet.jpg'} />
      <main className="u-page narrow">
        <div className="u-head"><span className="gs" style={{ width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}><span className="hand">{me.name.slice(0, 1)}</span></span><span><h1 className="hand">{me.name}</h1><span className="m sub">{me.city} · with us since {since}</span></span></div>
        <span className="hand t-18">Your orders</span>
        {orders.map((o) => {
          const st = stepOf(o.status);
          const l = o.lines[0];
          const title = o.lines.length > 1 ? `${l.product.title} + ${o.lines.length - 1} more` : `${l.qty > 1 ? `${l.qty} × ` : ''}${l.product.title}`;
          const line = o.status === 'delivered' ? `Delivered ${o.deliveredAt ? shortDate(o.deliveredAt) : ''}` : o.status === 'shipped' ? `On the way${o.trackingNumber ? ` · ${o.trackingNumber}` : ''}` : `${o.maker.name} is packing · ships by ${longDate(o.shipBy)}`;
          const key = o.id;
          return (
            <article key={o.id} className="g u-card u-stack">
              <div className="row ai-start">
                <Link href={`/p/${l.product.id}`}><Img className="ph ph-64" small src={l.product.images[0]} alt="" /></Link>
                <span className="grow flex col gap-4"><span className="fw600">{title}</span><Link href={`/m/${o.maker.slug}`} className="m t-small">from {o.maker.name} · #UL-{o.number}</Link><span className="t-small">{line}</span></span>
              </div>
              {o.status === 'delivered' && !o.reviewed ? (
                <div className="u-stack gap-8">
                  <span className="t-small">How is your {l.product.title}?</span>
                  <Stars value={rating[key] ?? 0} onPick={(n) => setRating({ ...rating, [key]: n })} />
                  {rating[key] ? (
                    <form className="u-stack" style={{ gap: 8 }} onSubmit={async (e) => { e.preventDefault(); await addReview(o.id, l.product.id, rating[key], text); setText(''); toast(`Thanks! ${o.maker.name} will see your review.`); }}>
                      <textarea className="inp" rows={2} placeholder={`A few words for ${o.maker.name} (optional)`} value={text} onChange={(e) => setText(e.target.value)} />
                      <button type="submit" className="cta">Post review</button>
                    </form>
                  ) : null}
                </div>
              ) : o.status === 'delivered' ? <span className="m t-small">Thanks for your review ★</span> : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4, fontSize: 11 }}>
                    {STEPS.map((x, i) => <span className="flex col gap-4" key={x}><span style={{ height: 3, borderRadius: 2, background: i <= st ? 'var(--u-accent)' : 'var(--u-track)' }} /><span className={i <= st ? '' : 'm'}>{x}</span></span>)}
                  </div>
                  <div className="row gap-8">
                    <Link href={`/messages/${o.maker.slug}`} className="sec gs grow">Message {o.maker.name}</Link>
                    {o.status === 'shipped' ? <button type="button" className="sec gs grow" onClick={() => markDelivered(o.id)}>It arrived</button> : null}
                  </div>
                </>
              )}
              {o.returnRequestedAt ? <span className="m t-small">Return requested · {o.maker.name} will reply in Messages</span> : canReturn(o) ? (
                returning === o.id ? (
                  <form className="u-stack" style={{ gap: 8 }} onSubmit={async (e) => { e.preventDefault(); await requestReturn(o.id, why); setReturning(null); setWhy(''); toast(`${o.maker.name} got your return request`); }}>
                    <input className="inp" placeholder="What’s wrong? (optional)" value={why} onChange={(e) => setWhy(e.target.value)} aria-label="Reason for return" />
                    <div className="row gap-8"><button type="button" className="sec" onClick={() => setReturning(null)}>Cancel</button><button type="submit" className="cta grow">Ask for a return</button></div>
                  </form>
                ) : <button type="button" className="link m t-small self-start" onClick={() => setReturning(o.id)}>Return this order (14 days)</button>
              ) : null}
            </article>
          );
        })}
        {!orders.length ? <div className="g u-card m">No orders yet.</div> : null}
        <nav className="g u-card" style={{ paddingTop: 4, paddingBottom: 4 }}>
          <Link href="/messages" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 52 }}><span>Messages</span><span className="m t-small">{unread ? `${unread} new ` : ''}›</span></Link>
          <hr className="hr" />
          <Link href="/welcome/taste" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 52 }}><span>Your taste</span><span className="m t-small">{me.taste.categories.map((c) => CATEGORY_LABEL[c]).join(' · ') || 'Not set'} ›</span></Link>
          <hr className="hr" />
          {row('addr', 'Addresses & payment', '')}
          {panel('addr', (
            <form className="u-stack gap-8 ink" onSubmit={async (e) => { e.preventDefault(); await saveAddress(a); setAddr(undefined); toast('Saved. We’ll fill it in at checkout.'); }}>
              <label className="fld"><span className="lbl">Full name</span><input className="inp" value={a.fullName} onChange={(e) => setAddr({ ...a, fullName: e.target.value })} autoComplete="name" /></label>
              <label className="fld"><span className="lbl">Phone (for the locker code)</span><input className="inp" type="tel" value={a.phone} onChange={(e) => setAddr({ ...a, phone: e.target.value })} autoComplete="tel" /></label>
              <label className="fld"><span className="lbl">Parcel locker</span><input className="inp" value={a.locker} onChange={(e) => setAddr({ ...a, locker: e.target.value })} /></label>
              <label className="fld"><span className="lbl">Home address (optional)</span><input className="inp" value={a.street} onChange={(e) => setAddr({ ...a, street: e.target.value })} autoComplete="street-address" /></label>
              <span className="m t-meta">We don’t store cards. Payment happens at checkout.</span>
              <button type="submit" className="cta">Save</button>
            </form>
          ))}
          <hr className="hr" />
          {row('notif', 'Notifications', '')}
          {panel('notif', (
            <div className="u-stack gap-4 ink">
              {([['replies', 'A maker replies to you'], ['shipping', 'Your order ships or arrives'], ['newFromFollowed', 'New pieces from makers you follow']] as const).map(([k, l]) => (
                <div key={k} className="row" style={{ minHeight: 48 }}><span className="grow">{l}</span><button type="button" role="switch" aria-checked={me.notify[k]} aria-label={l} className="tg" onClick={() => saveNotify({ ...me.notify, [k]: !me.notify[k] })}><i /></button></div>
              ))}
              <span className="m t-meta">By email to {me.email}.</span>
            </div>
          ))}
          <hr className="hr" />
          {row('privacy', 'Privacy & your data', '')}
          {panel('privacy', <>This demo keeps your data only in this browser. <button type="button" className="link" onClick={async () => { await resetDemo(); toast('Demo data reset'); }}>Reset demo data</button></>)}
          <hr className="hr" />
          {row('help', 'Help & returns', '')}
          {panel('help', <>14-day returns on ready pieces, free. Made-to-order and custom pieces can’t be returned unless they arrive damaged. Write to the maker first; if you can’t agree, we step in.</>)}
        </nav>
        <Link href={maker ? '/studio' : '/sell'} className="gs u-card row between">
          <span className="flex col gap-4"><span className="hand">{maker ? `Your studio · ${maker.name}` : 'You make things?'}</span><span className="m t-small">{maker ? 'Orders, pieces and payouts' : 'Open your studio on Uplift'}</span></span><span>→</span>
        </Link>
      </main>
    </>
  );
}
