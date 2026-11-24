'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import type { Delivery } from '@/lib/types';
import { getHoldInfo, getMe, placeOrder, quote } from '@/lib/data';
import { formatEURExact, mmss, plural } from '@/lib/format';
import { useData, useNow } from '@/lib/useData';
import { BackButton } from '@/components/u/Bits';
import { Lock } from '@/components/u/Icons';
import Loading from '@/components/u/Loading';
import Wash from '@/components/u/Wash';
import Img from '@/components/u/Img';
import co from './checkout.module.css';

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
  const [news, setNews] = useState(false);
  // Wallet by platform (FIXES 5.3): Apple Pay on Apple devices, Google Pay on Android, card only elsewhere.
  const [wallet, setWallet] = useState<'apple' | 'google' | null>(null);
  useEffect(() => { const ua = navigator.userAgent; setWallet(/iPhone|iPad|Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome|CriOS|Android/.test(ua) ? 'apple' : /Android/.test(ua) ? 'google' : null); }, []);
  const [tried, setTried] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const now = useNow(1000);
  const [hold] = useData(getHoldInfo);
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
        {hold?.endsAt && new Date(hold.endsAt).getTime() > now ? (
          <div className="gs u-card flex ai-center gap-12" role="status">
            <span className="t-small">{hold.count === 1 ? 'Your piece is held for ' : `Your ${hold.count} pieces are held for `}<b className="num">{mmss(new Date(hold.endsAt).getTime() - now)}</b></span>
          </div>
        ) : null}
        {wallet ? (
          <>
            <button type="button" className="cta w-full" onClick={submit} disabled={busy}>{wallet === 'apple' ? 'Apple Pay' : 'Google Pay'}</button>
            <span className={`m ${co.or}`}>or pay with card or bank</span>
          </>
        ) : null}

        <section className="g u-card u-stack">
          <label className="fld"><span className="lbl">Email for your receipt</span><input className="inp" type="email" autoComplete="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={tried && !emailOk} />{tried && !emailOk ? <span className="t-meta accent">Please check your email</span> : null}</label>
          <label className="row t-small pointer minh44"><input type="checkbox" className="sr" checked={news} onChange={() => setNews(!news)} /><span className={`chk ${news ? 'on' : ''}`} aria-hidden="true">{news ? '✓' : ''}</span><span className="m">Send me news from my makers (optional)</span></label>
        </section>

        <section className="g u-card u-stack">
          <span className="lbl">Delivery</span>
          {(['locker', 'door'] as const).map((d) => (
            <label key={d} className="row minh44 pointer">
              <input type="radio" name="delivery" checked={delivery === d} onChange={() => setDelivery(d)} className="sr" />
              <span className={`chk ${delivery === d ? 'on' : ''} ${'circle'}`} aria-hidden="true">{delivery === d ? '●' : ''}</span>
              <span className="grow">{d === 'locker' ? 'Parcel locker' : 'To your door'}</span><span className="m">{d === 'locker' ? '4,90€' : '6,90€'} / maker</span>
            </label>
          ))}
          {delivery === 'locker' ? <label className="fld"><span className="lbl">Parcel locker</span><input className="inp" value={locker} onChange={(e) => setLocker(e.target.value)} /></label> : null}
          <div className="row gap-8">
            <label className="fld grow"><span className="lbl">Full name</span><input className="inp" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={tried && !name.trim()} /></label>
            <label className="fld grow"><span className="lbl">Phone</span><input className="inp" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} aria-invalid={tried && phone.trim().length < 6} placeholder="+370…" /></label>
          </div>
          <span className="m t-meta">Your phone is only for the locker code.</span>
          {fast && left ? <div className={`gs ${co.ship}`}>{fast.maker.name} ships today if you order in <b>{left}</b></div> : null}
        </section>

        <section className="g u-card u-stack">
          <div className="row"><span className="grow flex col gap-4"><span className="fw600">It’s a gift</span><span className="m t-small">Add a note, and gift wrap from each maker</span></span>
            <button type="button" role="switch" aria-checked={gift} aria-label="It’s a gift" className="tg" onClick={() => setGift(!gift)}><i /></button></div>
          {gift ? (
            <>
              <label className="fld"><span className="lbl">Who is it for?</span><input className="inp" value={toName} onChange={(e) => setToName(e.target.value)} placeholder="Their name, for the card" aria-invalid={tried && !toName.trim()} /></label>
              <label className="fld"><span className="lbl">Your note</span><textarea className="inp" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="The maker writes it by hand. No prices in the parcel." /></label>
              {q.rows.filter((r) => r.maker.giftWrap?.enabled).map((r) => {
                const on = wrap.includes(r.maker.id);
                return (
                  <label key={r.maker.id} className={`gs row ${co.wrap}`}>
                    <input type="checkbox" className="sr" checked={on} onChange={() => setWrap(on ? wrap.filter((x) => x !== r.maker.id) : [...wrap, r.maker.id])} />
                    <span className={`chk ${on ? 'on' : ''}`} aria-hidden="true">{on ? '✓' : ''}</span>
                    <span className="grow flex col gap-4 t-small"><span>Gift wrap by {r.maker.name} · <b>{formatEURExact(r.maker.giftWrap!.priceCents)}</b></span><span className="m t-small">{r.maker.giftWrap!.description}</span></span>
                  </label>
                );
              })}
            </>
          ) : null}
        </section>

        <section className="g u-card u-stack">
          <span className="lbl">Payment</span>
          <div className="chips">{([['card', 'Card'], ['bank', 'Bank link'], ['blik', 'BLIK']] as const).map(([k, l]) => <button key={k} type="button" className="chip" aria-pressed={pay === k} onClick={() => setPay(k)}>{l}</button>)}</div>
          <div className={`gs ${'u-note'}`}>Test mode: payments are not live yet, so no card or bank details are asked and no money moves. Your order is recorded so you and the maker can follow it.</div>
          <div className="u-stack gap-8 t-small">
            <div className="row between"><span className="m">{plural(q.pieces, 'piece')}</span><span className="num">{formatEURExact(q.itemsCents)}</span></div>
            <div className="row between"><span className="m">Shipping · {plural(q.rows.length, 'parcel')}</span><span className="num">{q.shippingCents ? formatEURExact(q.shippingCents) : 'Free'}</span></div>
            {q.giftWrapCents ? <div className="row between"><span className="m">Gift wrap</span><span className="num">{formatEURExact(q.giftWrapCents)}</span></div> : null}
            <div className="row between fw600 t-16"><span>Total</span><span className="num">{formatEURExact(q.totalCents)}</span></div>
          </div>
          <span className="m row t-meta gap-8"><Lock size={14} /> Paid safely. Makers get paid after they ship. 14-day returns.</span>
        </section>
        {error ? <div className="gs u-card" role="alert">{error} <Link className="underline" href="/bag">Back to bag</Link></div> : null}
        {tried && !ok ? <span className="t-small accent" role="alert">Please fill in the fields marked above.</span> : null}
        <div className="g u-bar"><button type="button" className="cta" onClick={submit} disabled={busy}>{busy ? 'Placing order…' : `Pay ${formatEURExact(q.totalCents)}`}</button></div>
      </main>
    </>
  );
}
export default function CheckoutPage() { return <Suspense fallback={<Loading />}><Checkout /></Suspense>; }
