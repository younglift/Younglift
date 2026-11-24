'use client';
import Link from 'next/link';
import { useState } from 'react';
import { getStudioOrders } from '@/lib/data';
import { dayName, formatEURExact, shortDate } from '@/lib/format';
import { useData } from '@/lib/useData';
import Loading from '@/components/u/Loading';
import Wash from '@/components/u/Wash';
import s from '../studio.module.css';

const LABEL: Record<string, string> = { paid: 'To pack', packing: 'Packing', shipped: 'Shipped', delivered: 'Delivered', refunded: 'Refunded' };

/** Studio: orders (to ship first). */
export default function Orders() {
  const [orders] = useData(getStudioOrders);
  const [f, setF] = useState<'open' | 'done'>('open');
  if (!orders) return <Loading />;
  const open = orders.filter((o) => o.status === 'paid' || o.status === 'packing');
  const shown = f === 'open' ? open : orders.filter((o) => !open.includes(o));
  return (
    <>
      <Wash src={orders[0]?.lines[0].product.images[0]} />
      <main className="u-page">
        <div className="u-head"><span><h1 className="hand">Orders</h1><span className="m sub">{open.length} to ship</span></span></div>
        <div className="chips"><button type="button" className="chip" aria-pressed={f === 'open'} onClick={() => setF('open')}>To ship · {open.length}</button><button type="button" className="chip" aria-pressed={f === 'done'} onClick={() => setF('done')}>Shipped</button></div>
        <div className={`g ${s.list}`}>
          {shown.map((o) => (
            <Link key={o.id} href={`/studio/orders/${o.id}`}>
              <img src={o.lines[0].product.images[0]} alt="" />
              <span className={s.grow}><span>{o.lines[0].product.title}{o.lines.length > 1 ? ` + ${o.lines.length - 1}` : o.lines[0].qty > 1 ? ` × ${o.lines[0].qty}` : ''}</span><span className="m">#{o.number} · {o.buyer.name}, {o.buyer.city} · {formatEURExact(o.itemsCents + o.giftWrapCents)}</span></span>
              <span className={`${s.status} ${open.includes(o) ? s.live : 'gs'}`}>{open.includes(o) ? `Ship by ${dayName(o.shipBy)}` : `${LABEL[o.status]} ${o.shippedAt ? shortDate(o.shippedAt) : ''}`}</span>
            </Link>
          ))}
          {!shown.length ? <div className="m">{f === 'open' ? 'Nothing to ship right now.' : 'No shipped orders yet.'}</div> : null}
        </div>
      </main>
    </>
  );
}
