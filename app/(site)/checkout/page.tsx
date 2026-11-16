'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { BagLine, Maker, Order, Product } from '@/lib/types';
import { getBag, getMe, placeTestOrder, PRODUCT_EXTRAS, search } from '@/lib/data';
import { formatEUR } from '@/lib/format';
import { bagTotals } from '@/lib/bag';
import { dayIn } from '@/lib/time';
import { bagChanged } from '@/components/BottomNav';
import s from './checkout.module.css';

// A11 · Checkout + Thank you (docs/design/screens/Checkout*.dc.html), one page, no account.
// Payments are NOT live yet (Stripe comes later), so there are no card fields: PAY records a
// clearly marked test order and nothing is charged.

const STEPS = ['Paid', 'Packing', 'On the way', 'Delivered'];

export default function Checkout() {
  const [bag, setBag] = useState<BagLine[] | null>(null);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [makers, setMakers] = useState<Record<string, Maker>>({});
  const [sumOpen, setSumOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [news, setNews] = useState(false);
  const [mode, setMode] = useState<'locker' | 'home'>('locker');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [locker, setLocker] = useState('');
  const [street, setStreet] = useState('');
  const [postcode, setPostcode] = useState('');
  const [city, setCity] = useState('');
  const [gift, setGift] = useState(false);
  const [giftTo, setGiftTo] = useState('');
  const [giftNote, setGiftNote] = useState('');
  const [tried, setTried] = useState(false);
  const [done, setDone] = useState<Order | null>(null);
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    Promise.all([getBag(), search('')]).then(([b, res]) => {
      setBag(b);
      setProducts(Object.fromEntries(res.products.map((p) => [p.id, p])));
      setMakers(Object.fromEntries(res.makers.map((m) => [m.id, m])));
    });
    getMe().then((me) => setFirstName(me?.name.split(' ')[0] ?? ''));
  }, []);

  if (done) return <ThankYou order={done} makers={makers} email={email} name={name.trim().split(' ')[0] || firstName} />;
  if (!bag) return <main className={s.screen} />;
  if (bag.length === 0) {
    return (
      <main className={s.emptyScreen}>
        <span className={s.emptyTitle}>YOUR BAG IS EMPTY</span>
        <Link href="/" className={s.payBtn}>DISCOVER MAKERS</Link>
      </main>
    );
  }

  // Delivery costs per parcel depend on the method (locker 4,90 €, door 6,90 €), free above a maker's threshold.
  const base = bagTotals(bag, products);
  const per = mode === 'locker' ? 490 : 690;
  const shipping = base.groups.reduce((a, g) => a + (g.free ? 0 : per), 0);
  const total = base.itemsCents + shipping;
  const emailOk = /.+@.+\..+/.test(email);
  const addressOk = name.trim() && (mode === 'locker' ? locker.trim() : street.trim() && postcode.trim() && city.trim());
  const thumbs = bag.map((l) => products[l.productId]?.images[0]).filter(Boolean).slice(0, 3);
  const makerNames = base.groups.map((g) => makers[g.makerId]?.name).filter(Boolean).join(', ');

  async function pay() {
    if (!emailOk || !addressOk) { setTried(true); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const order = await placeTestOrder();
    bagChanged();
    if (order) { setDone(order); window.scrollTo({ top: 0 }); }
  }

  return (
    <main className={s.screen}>
      <header className={s.top}>
        <Link href="/bag" className={s.back}>‹ Bag</Link>
        <span className={s.title}>CHECKOUT</span>
        <span className={s.secure}>Secure</span>
      </header>

      <div className={s.notice}>Payments aren’t live yet. PAY places a <b>test order</b> and nothing is charged.</div>

      <button type="button" className={s.summary} aria-expanded={sumOpen} onClick={() => setSumOpen(!sumOpen)}>
        <span className={s.thumbs}>{thumbs.map((t) => <img key={t} src={t} alt="" />)}</span>
        <span className={s.sumText}>{base.pieces} {base.pieces === 1 ? 'piece' : 'pieces'} · {makerNames}</span>
        <span className="mono">{formatEUR(total)}</span>
        <span aria-hidden="true" className={s.arrow}>{sumOpen ? '▲' : '▼'}</span>
      </button>
      {sumOpen && (
        <div className={s.sumLines}>
          {bag.map((l, i) => {
            const p = products[l.productId];
            if (!p) return null;
            const v = Object.values(l.variant ?? {})[0];
            return <div key={i}><span>{p.title}{v ? ` · size ${v}` : ''}{l.qty > 1 ? ` × ${l.qty}` : ''}</span><span className="mono">{formatEUR(p.priceCents * l.qty)}</span></div>;
          })}
          <div><span>Shipping · {base.groups.length} {base.groups.length === 1 ? 'parcel' : 'parcels'}</span><span className="mono">{formatEUR(shipping)}</span></div>
        </div>
      )}

      <section className={s.section}>
        <h2 className={s.h2}>CONTACT</h2>
        <input className={`${s.input} ${tried && !emailOk ? s.bad : ''}`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email for your receipt" aria-label="Email" aria-invalid={tried && !emailOk} autoComplete="email" />
        {tried && !emailOk && <span className={s.error}>Add your email so we can send the receipt.</span>}
        <label className={s.check}><input type="checkbox" checked={news} onChange={() => setNews(!news)} />Tell me when my makers post new pieces</label>
      </section>

      <section className={s.section}>
        <h2 className={s.h2}>DELIVERY</h2>
        <div className={s.modes}>
          <button type="button" aria-pressed={mode === 'locker'} className={mode === 'locker' ? s.modeOn : s.mode} onClick={() => setMode('locker')}><span>Parcel locker</span><span className="mono">4,90€ / parcel</span></button>
          <button type="button" aria-pressed={mode === 'home'} className={mode === 'home' ? s.modeOn : s.mode} onClick={() => setMode('home')}><span>To my door</span><span className="mono">6,90€ / parcel</span></button>
        </div>
        <input className={`${s.input} ${tried && !name.trim() ? s.bad : ''}`} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" aria-label="Full name" autoComplete="name" />
        {mode === 'locker' ? (
          <input className={`${s.input} ${tried && !locker.trim() ? s.bad : ''}`} value={locker} onChange={(e) => setLocker(e.target.value)} placeholder="Parcel locker (e.g. Omniva, your street or mall)" aria-label="Parcel locker" />
        ) : (
          <>
            <input className={`${s.input} ${tried && !street.trim() ? s.bad : ''}`} value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Street and number" aria-label="Street and number" autoComplete="street-address" />
            <div className={s.row2}>
              <input className={`${s.input} ${tried && !postcode.trim() ? s.bad : ''}`} value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="Postcode" aria-label="Postcode" autoComplete="postal-code" />
              <input className={`${s.input} ${tried && !city.trim() ? s.bad : ''}`} value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" aria-label="City" autoComplete="address-level2" />
            </div>
          </>
        )}
        <input className={s.input} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" aria-label="Phone" autoComplete="tel" />
        <span className={s.help}>{mode === 'locker' ? 'The locker texts you the pickup code.' : 'The courier calls only if they can’t find you.'}</span>
        {tried && !addressOk && <span className={s.error}>Add your name and where to deliver.</span>}
        <div className={s.arrivals}>
          {base.groups.map((g) => {
            const m = makers[g.makerId];
            const order = g.lines.some(({ line }) => PRODUCT_EXTRAS[line.productId]?.status === 'order');
            return (
              <div key={g.makerId} className={s.arrival}>
                {m && <img src={m.portraitUrl} alt="" />}
                <span><span>Arrives around {order ? `${dayIn(14)}–${dayIn(18).split(', ')[1]}` : `${dayIn(4)}–${dayIn(6).split(', ')[1]}`}</span>
                  <span className={s.help}>{m?.name} {order ? 'makes it for you first, then ships' : 'ships within 2 days'} from {m?.city}</span></span>
              </div>
            );
          })}
        </div>
      </section>

      <section className={s.section}>
        <label className={s.check}><input type="checkbox" checked={gift} onChange={() => setGift(!gift)} />This is a gift</label>
        {gift && (
          <>
            <input className={s.input} value={giftTo} onChange={(e) => setGiftTo(e.target.value)} placeholder="Who is it for? (name on the card)" aria-label="Gift recipient name" />
            <textarea className={s.input} rows={3} value={giftNote} onChange={(e) => setGiftNote(e.target.value)} placeholder="Your note. The maker writes it by hand on a card." aria-label="Gift note" />
            <span className={s.help}>No prices inside the parcel.</span>
          </>
        )}
      </section>

      <section className={s.section}>
        <h2 className={s.h2}>PAYMENT</h2>
        <p className={s.help}>Card, Apple Pay, Google Pay, bank link and BLIK will open on Stripe’s secure page when payments go live.</p>
      </section>

      <div className={s.trust}>
        <span>✓ 14 days to change your mind and return</span>
        <span>✓ Makers never see your card</span>
        <span>✓ Money reaches the maker only after the parcel ships</span>
      </div>

      <div className={s.payBar}>
        <button type="button" className={s.payBtn} onClick={pay}>PAY <span className="mono">{formatEUR(total)}</span></button>
      </div>
    </main>
  );
}

function ThankYou({ order, makers, email, name }: { order: Order; makers: Record<string, Maker>; email: string; name: string }) {
  const byMaker: Record<string, typeof order.lines> = {};
  order.lines.forEach((l) => { (byMaker[l.product.makerId] ??= []).push(l); });
  return (
    <main className={s.screen}>
      <div className={s.thanks}>
        <span className={`mono ${s.kick}`}>TEST ORDER #{order.id} · NOTHING CHARGED</span>
        <h1 className={s.thanksTitle}>THANK YOU{name ? <>,<br />{name.toUpperCase()}</> : ''}.</h1>
        <span className={s.help}>When payments are live, your makers get the news right away and the receipt goes to {email || 'your email'}.</span>
      </div>
      {Object.entries(byMaker).map(([id, lines]) => {
        const m = makers[id];
        const what = lines.length === 1 ? lines[0].product.title : `${lines.length} pieces`;
        return (
          <article key={id} className={s.makerCard}>
            <div className={s.makerHead}>
              {m && <img src={m.portraitUrl} alt="" />}
              <span><span>{m?.name ?? 'Your maker'} will pack your {what}</span><span className={s.help}>We’ll tell you when it ships</span></span>
            </div>
            <div className={s.steps}>
              {STEPS.map((st, i) => (
                <span key={st} className={i < 1 ? s.stepOn : s.step}><span /><span>{st}</span></span>
              ))}
            </div>
          </article>
        );
      })}
      <div className={s.thanksLinks}>
        <Link href="/profile" className={s.outlineBtn}>SEE IT IN PROFILE</Link>
        <Link href="/" className={s.payBtn}>KEEP DISCOVERING</Link>
      </div>
    </main>
  );
}
