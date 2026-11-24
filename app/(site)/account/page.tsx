'use client';
import Link from 'next/link';
import { useState } from 'react';
import { CATEGORY_LABEL, addReview, canReturn, getFollowing, getMe, getMyMaker, getOrders, getSaved, getUnreadCount, markDelivered, requestReturn, resetDemo, saveAddress, saveNotify } from '@/lib/data';
import { longDate, monthName, shortDate } from '@/lib/format';
import { useData } from '@/lib/useData';
import { Stars } from '@/components/u/Bits';
import { toast } from '@/components/u/Toast';
import Loading from '@/components/u/Loading';
import Wash from '@/components/u/Wash';
import Img from '@/components/u/Img';
import ac from './account.module.css';

const STEPS = ['Paid', 'Packing', 'On the way', 'Delivered'];
const stepOf = (s: string) => (s === 'paid' ? 0 : s === 'packing' ? 1 : s === 'shipped' ? 2 : 3);

/** 08 Your profile + orders. */
export default function Account() {
  const [me] = useData(getMe);
  const [orders] = useData(getOrders);
  const [unread] = useData(getUnreadCount);
  const [maker] = useData(getMyMaker);
  const [following] = useData(getFollowing);
  const [saved] = useData(getSaved);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [rating, setRating] = useState<Record<string, number>>({});
  const [text, setText] = useState('');
  const [addr, setAddr] = useState<NonNullable<typeof me>['address']>();
  const [returning, setReturning] = useState<string | null>(null);
  const [why, setWhy] = useState('');
  if (!me || !orders) return <Loading />;
  const a = addr ?? me.address;
  const since = `${monthName(me.since)} ${new Date(me.since).getFullYear()}`;
  const panel = (k: string, body: React.ReactNode) => (open === k ? <div className={`m ${ac.panel}`}>{body}</div> : null);
  const row = (k: string, label: string, right: string) => (
    <button className={ac.navRow + ' ' + ac.navBtn} type="button" onClick={() => setOpen(open === k ? null : k)} aria-expanded={open === k}>
      <span>{label}</span><span className="m t-small">{right} {open === k ? '⌃' : '›'}</span>
    </button>
  );
  return (
    <>
      <Wash src={orders[0]?.lines[0].product.images[0] ?? '/img/bracelet.jpg'} />
      <main className={`u-page ${ac.page}`}>
        <div className={ac.left}>
        <div className={`u-head ${ac.head}`}><span className={`gs ${ac.me}`}><span className="hand">{me.name.slice(0, 1)}</span></span><span><h1 className="hand">{me.name}</h1><span className="m sub">{me.city} · with us since {since}</span></span>
          <span className={ac.stats}>
            <Link href="/following" className="gs"><b>{following?.length ?? 0}</b><span>following</span></Link>
            <Link href="/saved" className="gs"><b>{saved?.length ?? 0}</b><span>saved</span></Link>
            <a href="#orders" className="gs"><b>{orders.length}</b><span>orders</span></a>
          </span>
        </div>
        <div className={`g u-card ${ac.love}`}>
          <span className="lbl">What you love</span>
          <div className="chips">{me.taste.categories.map((c) => <Link key={c} href="/welcome/taste" className="chip" aria-pressed="true">{CATEGORY_LABEL[c]}</Link>)}<Link href="/welcome/taste" className="chip">+ Add</Link></div>
        </div>
        <nav className={`g u-card ${ac.nav}`}>
          <Link className={ac.navRow} href="/messages"><span>Messages</span><span className="m t-small">{unread ? `${unread} new ` : ''}›</span></Link>
          <hr className="hr" />
          <Link className={ac.navRow} href="/welcome/taste"><span>Your taste</span><span className="m t-small">{me.taste.categories.map((c) => CATEGORY_LABEL[c]).join(' · ') || 'Not set'} ›</span></Link>
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
                <div key={k} className={`row ${ac.switchRow}`}><span className="grow">{l}</span><button type="button" role="switch" aria-checked={me.notify[k]} aria-label={l} className="tg" onClick={() => saveNotify({ ...me.notify, [k]: !me.notify[k] })}><i /></button></div>
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
        </div>
        <div className={ac.right} id="orders">
        <div className={ac.orders}>
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
                <span className="grow flex col gap-4"><span className="fw600">{title}</span><span className="m t-small">from {o.maker.name}<span className="desk-only"> · #{o.number}</span></span><span className={`t-small ${ac.line}`}>{line}</span></span>
                <span className={ac.status}>
                  <span className={`${ac.pill}${o.status === 'shipped' ? ' ' + ac.pillOn : ''}`}>{o.status === 'delivered' ? 'Delivered' : o.status === 'shipped' ? 'On its way' : 'Being packed'}</span>
                  <span className="m t-small">{o.status === 'delivered' ? (o.deliveredAt ? shortDate(o.deliveredAt) : '') : o.status === 'shipped' ? (o.trackingNumber ?? '') : `Ships by ${shortDate(o.shipBy)}`}</span>
                  {o.status === 'delivered' && !o.reviewed ? <button type="button" className="link" onClick={() => setReviewing(reviewing === o.id ? null : o.id)}>Review</button>
                    : o.status === 'shipped' ? <button type="button" className="link" onClick={() => markDelivered(o.id)}>It arrived?</button>
                    : <Link href={`/messages/${o.maker.slug}`} className="link">Details</Link>}
                </span>
              </div>
              {o.status === 'delivered' && !o.reviewed ? (
                <div className={`u-stack gap-8 ${reviewing === o.id ? ac.reviewOpen : ac.review}`}>
                  <span className="t-small">How is your {l.product.title}?</span>
                  <Stars value={rating[key] ?? 0} onPick={(n) => setRating({ ...rating, [key]: n })} />
                  {rating[key] ? (
                    <form className="u-stack" style={{ gap: 8 }} onSubmit={async (e) => { e.preventDefault(); await addReview(o.id, l.product.id, rating[key], text); setText(''); toast(`Thanks! ${o.maker.name} will see your review.`); }}>
                      <textarea className="inp" rows={2} placeholder={`A few words for ${o.maker.name} (optional)`} value={text} onChange={(e) => setText(e.target.value)} />
                      <button type="submit" className="cta">Post review</button>
                    </form>
                  ) : null}
                </div>
              ) : o.status === 'delivered' ? <span className={`m t-small ${ac.thanks}`}>Thanks for your review ★</span> : (
                <>
                  <div className={ac.track}>
                    {STEPS.map((x, i) => <span className="flex col gap-4" key={x}><span className={ac.bar + (i <= st ? ' ' + ac.barOn : '')} /><span className={i <= st ? '' : 'm'}>{x}</span></span>)}
                  </div>
                  {o.status === 'shipped' ? <span className="phone-only"><button type="button" className="link m t-small self-start" onClick={() => markDelivered(o.id)}>It arrived? Let us know</button></span> : null}
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
        </div>
        <Link href={maker ? '/studio' : '/sell'} className={`gs u-card row between ${ac.studio}`}>
          <span className="flex col gap-4"><span className="hand">{maker ? `Your studio · ${maker.name}` : 'You make things too?'}</span><span className="m t-small">{maker ? 'Orders, pieces and payouts' : 'Open your own studio on Uplift'}</span></span><span className={ac.arrow}>→</span><span className={`cta ${ac.studioCta}`}>{maker ? 'Open Studio' : 'Sell on Uplift'}</span>
        </Link>
        </div>
      </main>
    </>
  );
}
