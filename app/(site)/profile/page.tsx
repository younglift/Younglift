'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Maker, Order } from '@/lib/types';
import { getMe, getOrders, getThreads, search, type Me } from '@/lib/data';
import { formatEUR } from '@/lib/format';
import BottomNav from '@/components/BottomNav';
import s from './profile.module.css';

// A12 · Profile + orders (docs/design/screens/Profile.dc.html). Orders split by maker
// (each maker ships a parcel). Reviews appear only after delivery.

const STEPS = ['Paid', 'Packing', 'On the way', 'Delivered'];
const STEP_OF: Record<Order['status'], number> = { paid: 1, shipped: 3, delivered: 4, refunded: 0 };
const CAT_LABEL: Record<string, string> = { jewelry: 'Jewellery', ceramics: 'Ceramics', clothing: 'Clothing', textiles: 'Textiles', accessories: 'Accessories', prints: 'Art & prints', wood: 'Home', other: 'Home' };

export default function Profile() {
  const [me, setMe] = useState<Me | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [makers, setMakers] = useState<Record<string, Maker>>({});
  const [threads, setThreads] = useState(0);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    getMe().then(setMe);
    getOrders().then(setOrders);
    search('').then((r) => setMakers(Object.fromEntries(r.makers.map((m) => [m.id, m]))));
    getThreads().then((t) => setThreads(t.length));
  }, []);

  const parcels = orders.flatMap((o) => {
    const byMaker: Record<string, typeof o.lines> = {};
    o.lines.forEach((l) => { (byMaker[l.product.makerId] ??= []).push(l); });
    return Object.entries(byMaker).map(([makerId, lines]) => ({ key: `${o.id}-${makerId}`, order: o, makerId, lines }));
  });
  const taste = me ? Array.from(new Set(me.taste.categories.map((c) => CAT_LABEL[c] ?? c))).join(' · ') : '';

  return (
    <main className={s.screen}>
      <div className={s.head}>
        <span className={s.avatar}>{me?.name.charAt(0).toUpperCase()}</span>
        <span className={s.who}><span className={s.name}>{me?.name.split(' ')[0].toUpperCase()}</span><span className={s.meta}>Demo account · sign-in comes soon</span></span>
      </div>

      <div className={s.sectionHead}><h2>YOUR ORDERS</h2></div>
      {parcels.length === 0 && (
        <div className={s.empty}><span>No orders yet</span><Link href="/" className={s.link}>Discover makers</Link></div>
      )}
      <div className={s.orders}>
        {parcels.map(({ key, order, makerId, lines }) => {
          const m = makers[makerId];
          const step = STEP_OF[order.status];
          const isOpen = open === key;
          const title = lines.length === 1 ? lines[0].product.title : `${lines[0].product.title} + ${lines.length - 1} more`;
          const sum = lines.reduce((a, l) => a + l.product.priceCents * l.qty, 0);
          return (
            <article key={key} className={s.order}>
              <button type="button" className={s.orderHead} aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : key)}>
                <img src={lines[0].product.images[0]} alt="" />
                <span className={s.orderText}>
                  <span className={s.orderTitle}>{title}</span>
                  <span className={s.meta}>from {m?.name ?? '…'} · #{order.id} · test order</span>
                  <span className={s.status}><span aria-hidden="true" />{order.status === 'paid' ? `${m?.name ?? 'The maker'} will pack it` : order.status === 'shipped' ? 'On the way' : order.status === 'delivered' ? 'Delivered' : 'Refunded'}</span>
                </span>
                <span aria-hidden="true" className={s.arrow}>{isOpen ? '▲' : '▼'}</span>
              </button>
              {step < 4 && (
                <div className={s.steps}>
                  {STEPS.map((st, i) => <span key={st} className={i < step ? s.stepOn : s.step}><span /><span>{st}</span></span>)}
                </div>
              )}
              {isOpen && (
                <div className={s.detail}>
                  <div><span>{lines.reduce((a, l) => a + l.qty, 0)} {lines.length === 1 && lines[0].qty === 1 ? 'piece' : 'pieces'} · ordered {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span><span className="mono">{formatEUR(sum)}</span></div>
                  {m && <div className={s.detailLinks}><Link href={`/messages/${m.slug}?from=profile`}>Message {m.name}</Link></div>}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className={s.rows}>
        <Link href="/messages" className={s.row}><span>Messages</span><span className={s.rowRight}>{threads > 0 ? `${threads} ›` : '›'}</span></Link>
        <Link href="/welcome" className={s.row}><span className={s.rowText}><span>Your taste</span>{taste && <span className={s.meta}>{taste}</span>}</span><span className={s.rowRight}>Change ›</span></Link>
        <Link href="/following" className={s.row}><span>Makers you follow</span><span className={s.rowRight}>›</span></Link>
        <Link href="/saved" className={s.row}><span>Saved pieces and boards</span><span className={s.rowRight}>›</span></Link>
      </div>

      <Link href="/prototype/index.html#studio" className={s.studio}>
        <span><span className={s.studioTitle}>YOU MAKE THINGS?</span><span>Open your studio on Young Lift</span></span>
        <span aria-hidden="true">→</span>
      </Link>
      <div className={s.navSpace} />
      <BottomNav active="none" />
    </main>
  );
}
