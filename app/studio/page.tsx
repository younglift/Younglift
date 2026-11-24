'use client';
import Link from 'next/link';
import { getMostLoved, getMyMaker, getStats, getStudioOrders, getStudioProducts, getStudioRequests } from '@/lib/data';
import { dayName, formatEUR, monthName, plural } from '@/lib/format';
import { useData } from '@/lib/useData';
import Loading from '@/components/u/Loading';
import Wash from '@/components/u/Wash';
import Welcome from './welcome/Checklist';
import s from './studio.module.css';
import Img from '@/components/u/Img';

/** B8 Studio · Today. */
export default function Today() {
  const [me] = useData(getMyMaker);
  const [orders] = useData(getStudioOrders);
  const [stats] = useData(getStats);
  const [reqs] = useData(getStudioRequests);
  const [pieces] = useData(getStudioProducts);
  const [loved] = useData(getMostLoved);
  if (!me || !orders || !stats || !pieces) return <Loading />;
  if (me.status !== 'live') return <Welcome />;
  const now = new Date();
  const toShip = orders.filter((o) => o.status === 'paid' || o.status === 'packing');
  const month = orders.filter((o) => { const d = new Date(o.createdAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && o.status !== 'refunded'; });
  const monthCents = month.reduce((a, o) => a + o.itemsCents + o.giftWrapCents, 0);
  const max = Math.max(...stats.weeklySalesCents, 1);
  const open = (reqs ?? []).filter((r) => r.status === 'sent');
  const soldOut = pieces.filter((p) => p.sold && p.status === 'live' && !p.oneOfAKind);
  return (
    <>
      <Wash src={me.portraitUrl} />
      <main className="u-page" style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom))' }}>
        <div className="u-head">
          <Img small src={me.portraitUrl} alt="" className="u-avatar ph ph-48" />
          <span className="grow"><span className="m t-meta">Studio · {dayName(now.toISOString())}, {now.getDate()} {monthName(now.toISOString())}</span><h1 className="hand">Hi, {me.name}</h1></span>
          <Link href={`/m/${me.slug}`} className="sec gs" aria-label="See my profile as buyers do">View profile</Link>
        </div>
        <div className="g u-card u-stack gap-4">
          <div className="row between"><span className="lbl">To ship · {toShip.length}</span><Link href="/studio/orders" className="m tap t-small">All orders</Link></div>
          <div className={s.list} style={{ margin: '0 -14px -14px' }}>
            {toShip.map((o) => (
              <Link key={o.id} href={`/studio/orders/${o.id}`}>
                <Img small src={o.lines[0].product.images[0]} alt="" />
                <span className={s.grow}><span>{o.lines[0].product.title}{o.lines[0].qty > 1 ? ` × ${o.lines[0].qty}` : ''}</span><span className="m">#{o.number} · {o.buyer.name}, {o.buyer.city}{o.gift?.wrap ? ' · gift wrap' : ''}</span></span>
                <span className={`${s.status} gs`}>Ship by {dayName(o.shipBy)}</span>
              </Link>
            ))}
            {!toShip.length ? <div className="m">Nothing to ship. Nice.</div> : null}
          </div>
        </div>
        <div className="g u-card u-stack gap-8">
          <span className="m t-small">Sold in {monthName(now.toISOString())}</span>
          <div className="row ai-base"><b style={{ font: '600 28px var(--u-ui)' }}>{formatEUR(monthCents)}</b><span className="m">{plural(month.length, 'order')}</span></div>
          <div className={s.bars} aria-hidden="true">{stats.weeklySalesCents.map((c, i) => <span key={i} style={{ height: `${Math.max(6, (c / max) * 100)}%` }} />)}</div>
          <span className="m t-meta">Last 8 weeks · paid out by Stripe after you ship</span>
        </div>
        <div className={s.stats}>
          <div className={`gs ${s.stat}`}><span className="m t-meta">Views</span><b>{stats.views.toLocaleString('lt-LT')}</b><span className={s.up}>+{stats.viewsChangePct}% this week</span></div>
          <div className={`gs ${s.stat}`}><span className="m t-meta">Saves</span><b>{stats.saves}</b><span className={s.up}>+{stats.savesChange}</span></div>
          <div className={`gs ${s.stat}`}><span className="m t-meta">Followers</span><b>{me.followers}</b><span className={s.up}>+{stats.followersChange}</span></div>
          <div className={`gs ${s.stat} deskOnlyStat`}><span className="m t-meta">Avg. reply</span><b>{stats.avgReplyHours} h</b><span className="m t-meta">buyers see “within a day”</span></div>
        </div>
        <div className="row gap-8"><Link href="/studio/pieces/new" className="cta grow">+ Add piece</Link><Link href="/studio/post" className="sec gs grow">Share a video</Link></div>
        {open.map((r) => (
          <Link key={r.id} href="/studio/messages" className="gs u-card row">
            <span className="chk on" style={{ borderRadius: '50%' }}>!</span>
            <span className={s.grow}><span>Custom request from {r.buyerName}</span><span className="m">“{r.text}”</span></span><span>›</span>
          </Link>
        ))}
        {soldOut.map((p) => (
          <Link key={p.id} href={`/studio/pieces/${p.id}`} className="gs u-card row">
            <Img className="ph ph-44" small src={p.images[0]} alt="" />
            <span className={s.grow}><span>{p.title} is sold out</span><span className="m">Making more? Buyers will see “Back in stock”.</span></span><span>›</span>
          </Link>
        ))}
        {loved?.length ? (
          <div className="g u-card u-stack">
            <span className="lbl">Your live pieces</span>
            {loved.map((p) => <Link key={p.id} href={`/studio/pieces/${p.id}`} className="row"><Img className="ph ph-44" small src={p.images[0]} alt="" /><span className={s.grow}><span>{p.title}</span><span className="m">{formatEUR(p.priceCents)}</span></span></Link>)}
          </div>
        ) : null}
      </main>
      <style>{`@media (max-width:819px){.deskOnlyStat{display:none !important}}`}</style>
    </>
  );
}
