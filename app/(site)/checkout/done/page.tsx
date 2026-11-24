'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { getOrderGroup } from '@/lib/data';
import { longDate, plural, shipsLine } from '@/lib/format';
import { useData } from '@/lib/useData';
import Wash from '@/components/u/Wash';

/** 07 Thank you. */
function Done() {
  const g = useSearchParams().get('g') ?? '';
  const [orders] = useData(() => getOrderGroup(g), [g]);
  if (!orders) return <Wash />;
  if (!orders.length) return <main className="u-page narrow"><Wash /><span className="hand">Order not found</span><Link href="/account" className="cta">Your orders</Link></main>;
  const first = orders[0];
  const names = orders.map((o) => o.maker.name);
  const who = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0];
  return (
    <>
      <Wash src={first.lines[0].product.images[0]} />
      <main className="u-page narrow has-bar">
        <div style={{ textAlign: 'center', padding: '24px 0 8px' }}>
          <h1 className="hand" style={{ margin: 0, fontSize: 28 }}>Thank you, {first.buyer.name.split(' ')[0]}!</h1>
          <p className="m" style={{ margin: '10px 0 0' }}>Order {orders.map((o) => `#UL-${o.number}`).join(', ')} · receipt sent to {first.buyer.email}</p>
        </div>
        <section className="g u-card u-stack">
          {orders.map((o) => (
            <div key={o.id} className="u-stack" style={{ gap: 10 }}>
              <div className="row"><img src={o.lines[0].product.images[0]} alt="" style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'cover' }} />
                <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}><span className="hand">{o.maker.name}</span><span className="m" style={{ fontSize: 13 }}>{o.lines.every((l) => l.product.madeToOrder) ? shipsLine(o.lines[0].product) : `Ships by ${longDate(o.shipBy)}`} · {plural(o.lines.reduce((a, l) => a + l.qty, 0), 'piece')}</span></span></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4, fontSize: 11 }}>
                {['Paid', 'Packing', 'On the way', 'Delivered'].map((st, i) => <span key={st} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span style={{ height: 3, borderRadius: 2, background: i === 0 ? 'var(--u-accent)' : 'var(--u-track)' }} /><span className={i ? 'm' : ''}>{st}</span></span>)}
              </div>
              {o.maker.thankYouNote ? <p className="hand m" style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>“{o.maker.thankYouNote}”</p> : null}
            </div>
          ))}
        </section>
        <section className="gs u-card" style={{ fontSize: 14, lineHeight: 1.5 }}>{who} got a note that you ordered. They’ll message you here if anything changes.</section>
        <div className="g u-bar" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <Link href="/account" className="cta">Track my order</Link>
          <Link href="/" className="sec gs">Keep exploring</Link>
        </div>
      </main>
    </>
  );
}
export default function DonePage() { return <Suspense fallback={<Wash />}><Done /></Suspense>; }
