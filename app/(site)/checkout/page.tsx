'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import type { Delivery } from '@/lib/types';
import { getMe, placeOrder, quote } from '@/lib/data';
import { formatEURExact, plural } from '@/lib/format';
import { useData, useNow } from '@/lib/useData';
import { BackButton } from '@/components/u/Bits';
import { Lock } from '@/components/u/Icons';
import Loading from '@/components/u/Loading';
import Wash from '@/components/u/Wash';

/** Next cut-off for "ships today if you order in …": 15:00 local time on weekdays. */
function cutoff(now: number) {
  const d = new Date(now); const c = new Date(d); c.setHours(15, 0, 0, 0);
  if (d.getDay() === 0 || d.getDay() === 6 || d > c) return null;
  const ms = c.getTime() - now; return `${Math.floor(ms / 3600e3)}h ${Math.floor((ms % 3600e3) / 60e3)}m`;
}

/** 07 Checkout (test mode: no money moves yet). One page, no account. */
function Checkout() {
  const router = useRouter();
  const makerParam = useSearchParams().get('maker');
  const makerIds = makerParam ? [makerParam] : undefined;
  const [me] = useData(getMe);
  const [delivery, setDelivery] = useState<Delivery>('locker');
  const [gift, setGift] = useState(false);
  const [toName, setToName] = useState('');
  const [note, setNote] = useState('');
  const [wrap, setWrap] = useState<string[]>([]);
  const [q] = useData(() => quote(makerIds, delivery, gift ? wrap : []), [makerParam, delivery, gift, wrap.join()]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [locker, setLocker] = useState('Omniva · Vilnius, Užupio g. 9');
  const [pay, setPay] = useState<'card' | 'bank' | 'blik'>('card');
  const [tried, setTried] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const now = useNow(30000);
  useEffect(() => { if (me) { setEmail((e) => e || me.email); setName((n) => n || me.address?.fullName || me.name); setPhone((x) => x || me.address?.phone || ''); if (me.address?.locker) setLocker(me.address.locker); } }, [me]);
  if (!q) return <Loading />;
  if (!q.rows.length) return (<main className="u-page narrow"><Wash /><div className="u-head"><BackButton href="/bag" /><h1 className="hand">Checkout</h1></div><div className="g u-card u-stack"><span>Your bag is empty.</span><Link href="/" className="cta">Discover makers</Link></div></main>);
  const emailOk = /.+@.+\..+/.test(email);
  const ok = emailOk && name.trim() && phone.trim().length >= 6 && (!gift || toName.trim());
  const submit = async () => {
    setTried(true); setError(''); if (!ok) return;
    setBusy(true);
    const r = await placeOrder({ makerIds, email, name, phone, delivery, gift: gift ? { toName, note, wrapMakers: wrap } : undefined });
    setBusy(false);
    if (r.ok) router.push(`/checkout/done?g=${r.groupId}`); else setError(r.reason);
  };
  const fast = q.rows.find((r) => r.lines.every((l) => !l.product.madeToOrder && l.product.shipsWithinDays <= 1));
  const left = cutoff(now);
  const names = q.rows.map((r) => r.maker.name).join(', ');

  return (
    <>
      <Wash src={q.rows[0].lines[0].product.images[0]} />
      <main className="u-page narrow has-bar">
        <div className="u-head"><BackButton href="/bag" /><span><h1 className="hand">Checkout</h1><span className="m sub">No account needed</span></span></div>
        <details className="gs u-card">
          <summary style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, listStyle: 'none' }}>
            <span style={{ display: 'flex' }}>{q.rows.flatMap((r) => r.lines).slice(0, 4).map((l, i) => <img key={l.productId + i} src={l.product.images[0]} alt="" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover', marginLeft: i ? -8 : 0, border: '2px solid var(--u-bg)' }} />)}</span>
            <span style={{ flex: 1, fontSize: 14 }}>{plural(q.pieces, 'piece')} · {names}</span><b className="num">{formatEURExact(q.totalCents)}</b>
          </summary>
          <div className="u-stack" style={{ marginTop: 12, gap: 8, fontSize: 14 }}>
            {q.rows.flatMap((r) => r.lines.map((l) => <div key={l.productId} className="row" style={{ justifyContent: 'space-between' }}><span>{l.product.title}{l.qty > 1 ? ` × ${l.qty}` : ''} <span className="m">· {r.maker.name}</span></span><span className="num">{formatEURExact(l.product.priceCents * l.qty)}</span></div>))}
          </div>
        </details>
        <div className="row" style={{ gap: 8 }}>
          <button type="button" className="cta" style={{ flex: 1 }} onClick={submit} disabled={busy}>Apple Pay</button>
          <button type="button" className="sec gs" style={{ flex: 1 }} onClick={submit} disabled={busy}>G Pay</button>
        </div>
        <span className="m" style={{ textAlign: 'center', fontSize: 13, marginTop: -6 }}>or pay with card or bank</span>

        <section className="g u-card u-stack">
          <label className="fld"><span className="lbl">Email for your receipt</span><input className="inp" type="email" autoComplete="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={tried && !emailOk} />{tried && !emailOk ? <span style={{ fontSize: 12, color: 'var(--u-accent)' }}>Please check your email</span> : null}</label>
          <label className="row" style={{ fontSize: 14, cursor: 'pointer' }}><input type="checkbox" /> <span className="m">Send me news from my makers (optional)</span></label>
        </section>

        <section className="g u-card u-stack">
          <span className="lbl">Delivery</span>
          {(['locker', 'door'] as const).map((d) => (
            <label key={d} className="row" style={{ minHeight: 44, cursor: 'pointer' }}>
              <input type="radio" name="delivery" checked={delivery === d} onChange={() => setDelivery(d)} className="sr" />
              <span className={`chk ${delivery === d ? 'on' : ''}`} style={{ borderRadius: '50%' }} aria-hidden="true">{delivery === d ? '●' : ''}</span>
              <span style={{ flex: 1 }}>{d === 'locker' ? 'Parcel locker' : 'To your door'}</span><span className="m">{d === 'locker' ? '4,90€' : '6,90€'} / maker</span>
            </label>
          ))}
          {delivery === 'locker' ? <label className="fld"><span className="lbl">Parcel locker</span><input className="inp" value={locker} onChange={(e) => setLocker(e.target.value)} /></label> : null}
          <div className="row" style={{ gap: 10 }}>
            <label className="fld" style={{ flex: 1 }}><span className="lbl">Full name</span><input className="inp" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={tried && !name.trim()} /></label>
            <label className="fld" style={{ flex: 1 }}><span className="lbl">Phone</span><input className="inp" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} aria-invalid={tried && phone.trim().length < 6} placeholder="+370…" /></label>
          </div>
          <span className="m" style={{ fontSize: 12 }}>Your phone is only for the locker code.</span>
          {fast && left ? <div className="gs" style={{ borderRadius: 14, padding: '10px 12px', fontSize: 14 }}>{fast.maker.name} ships today if you order in <b>{left}</b></div> : null}
        </section>

        <section className="g u-card u-stack">
          <div className="row"><span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}><span style={{ fontWeight: 600 }}>It’s a gift</span><span className="m" style={{ fontSize: 13 }}>Add a note, and gift wrap from each maker</span></span>
            <button type="button" role="switch" aria-checked={gift} aria-label="It’s a gift" className="tg" onClick={() => setGift(!gift)}><i /></button></div>
          {gift ? (
            <>
              <label className="fld"><span className="lbl">Who is it for?</span><input className="inp" value={toName} onChange={(e) => setToName(e.target.value)} placeholder="Their name, for the card" aria-invalid={tried && !toName.trim()} /></label>
              <label className="fld"><span className="lbl">Your note</span><textarea className="inp" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="The maker writes it by hand. No prices in the parcel." /></label>
              {q.rows.filter((r) => r.maker.giftWrap?.enabled).map((r) => {
                const on = wrap.includes(r.maker.id);
                return (
                  <label key={r.maker.id} className="gs row" style={{ borderRadius: 16, padding: 12, cursor: 'pointer', alignItems: 'flex-start' }}>
                    <input type="checkbox" className="sr" checked={on} onChange={() => setWrap(on ? wrap.filter((x) => x !== r.maker.id) : [...wrap, r.maker.id])} />
                    <span className={`chk ${on ? 'on' : ''}`} aria-hidden="true">{on ? '✓' : ''}</span>
                    <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, fontSize: 14 }}><span>Gift wrap by {r.maker.name} · <b>{formatEURExact(r.maker.giftWrap!.priceCents)}</b></span><span className="m" style={{ fontSize: 13 }}>{r.maker.giftWrap!.description}</span></span>
                  </label>
                );
              })}
            </>
          ) : null}
        </section>

        <section className="g u-card u-stack">
          <span className="lbl">Payment</span>
          <div className="chips">{([['card', 'Card'], ['bank', 'Bank link'], ['blik', 'BLIK']] as const).map(([k, l]) => <button key={k} type="button" className="chip" aria-pressed={pay === k} onClick={() => setPay(k)}>{l}</button>)}</div>
          <div className="gs" style={{ borderRadius: 14, padding: 12, fontSize: 13 }}>Test mode: payments are not live yet, so no card or bank details are asked and no money moves. Your order is recorded so you and the maker can follow it.</div>
          <div className="u-stack" style={{ gap: 6, fontSize: 14 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}><span className="m">{plural(q.pieces, 'piece')}</span><span className="num">{formatEURExact(q.itemsCents)}</span></div>
            <div className="row" style={{ justifyContent: 'space-between' }}><span className="m">Shipping · {plural(q.rows.length, 'parcel')}</span><span className="num">{q.shippingCents ? formatEURExact(q.shippingCents) : 'Free'}</span></div>
            {q.giftWrapCents ? <div className="row" style={{ justifyContent: 'space-between' }}><span className="m">Gift wrap</span><span className="num">{formatEURExact(q.giftWrapCents)}</span></div> : null}
            <div className="row" style={{ justifyContent: 'space-between', fontWeight: 600, fontSize: 16 }}><span>Total</span><span className="num">{formatEURExact(q.totalCents)}</span></div>
          </div>
          <span className="m row" style={{ fontSize: 12, gap: 6 }}><Lock size={14} /> Paid safely. Makers get paid after they ship. 14-day returns.</span>
        </section>
        {error ? <div className="gs u-card" role="alert">{error} <Link href="/bag" style={{ textDecoration: 'underline' }}>Back to bag</Link></div> : null}
        {tried && !ok ? <span role="alert" style={{ fontSize: 13, color: 'var(--u-accent)' }}>Please fill in the fields marked above.</span> : null}
        <div className="g u-bar"><button type="button" className="cta" onClick={submit} disabled={busy}>{busy ? 'Placing order…' : `Pay ${formatEURExact(q.totalCents)}`}</button></div>
      </main>
    </>
  );
}
export default function CheckoutPage() { return <Suspense fallback={<Loading />}><Checkout /></Suspense>; }
