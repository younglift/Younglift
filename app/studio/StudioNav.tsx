'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getMyMaker, getStudioOrders, getStudioProducts, getStudioRequests } from '@/lib/data';
import { useData } from '@/lib/useData';
import { useIsDesktop } from '@/lib/useIsDesktop';
import Logo from '@/components/u/Logo';
import s from './studio.module.css';
import Img from '@/components/u/Img';

const on = (path: string, href: string) => (href === '/studio' ? path === '/studio' : path.startsWith(href));
/** Pages with the phone bottom nav (forms have their own action bar). */
const TABS = ['/studio', '/studio/pieces', '/studio/orders', '/studio/messages'];

export default function StudioNav() {
  const path = usePathname() || '/studio';
  const [me] = useData(getMyMaker);
  const [orders] = useData(getStudioOrders);
  const [pieces] = useData(getStudioProducts);
  const [reqs] = useData(getStudioRequests);
  const desktop = useIsDesktop();
  if (!me || desktop === undefined) return null;
  const toShip = (orders ?? []).filter((o) => o.status === 'paid' || o.status === 'packing').length;
  const newReq = (reqs ?? []).filter((r) => r.status === 'sent').length;
  const items = [
    { href: '/studio', label: 'Today' },
    { href: '/studio/pieces', label: 'Pieces', n: pieces?.length },
    { href: '/studio/orders', label: toShip ? `Orders · ${toShip}` : 'Orders', n: toShip },
    { href: '/studio/messages', label: 'Messages', n: newReq },
    { href: '/studio/profile', label: 'Profile' },
  ];
  const showBottom = TABS.includes(path);
  return (
    <>
      {!desktop && showBottom ? (
        <nav aria-label="Studio" className={`gs ${s.bottom}`}>
          {items.map((t) => <Link key={t.href} href={t.href} aria-current={on(path, t.href) ? 'page' : undefined}>{t.label}<span className={s.dot} /></Link>)}
        </nav>
      ) : null}
      {desktop ? <aside className={`g ${s.side}`} aria-label="Studio">
        <div className={s.brand}><Link href="/" aria-label="Uplift home"><Logo height={26} wordmark /></Link><span className="m lbl">STUDIO</span></div>
        {[...items, { href: '/studio/payouts', label: 'Payouts' }].map((t) => (
          <Link key={t.href} href={t.href} aria-current={on(path, t.href) ? 'page' : undefined}><span className={s.bul} /><span>{t.label.split(' · ')[0]}</span>{'n' in t && t.n ? <span className={`m ${s.n}`}>{t.n}</span> : null}</Link>
        ))}
        <div className={s.sideFoot}>
          <Link href="/studio/pieces/new" className="cta">+ Add piece</Link>
          <Link href={`/m/${me.slug}`} className={`gs ${s.me}`}><Img small src={me.portraitUrl} alt="" className="u-avatar" /><span className="flex col"><span className="hand">{me.name}</span><span className="m t-meta">View my profile ↗</span></span></Link>
        </div>
      </aside> : null}
    </>
  );
}
