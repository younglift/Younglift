'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getBagCount, getUnreadCount } from '@/lib/data';
import { useData } from '@/lib/useData';
import { plural } from '@/lib/format';
import { useIsDesktop } from '@/lib/useIsDesktop';
import { useLockBody } from '@/lib/useLockBody';
import { Bag, Chat, Close, Search } from './Icons';
import Icon, { type IconName } from './Icon';
import Logo from './Logo';
import BagView from './BagView';
import s from './Nav.module.css';

/** FIXES 13.1 (Matas, option A): For you · Search · Profile. Following, Saved and orders live in Profile; the bag sits top right. */
const TABS: { href: string; label: string; icon: IconName; also?: string[] }[] = [
  { href: '/', label: 'For you', icon: 'home' },
  { href: '/explore', label: 'Search', icon: 'search' },
  { href: '/account', label: 'Profile', icon: 'user', also: ['/following', '/saved', '/messages'] },
];
/** Pages that show the phone bottom nav (others have their own action bar). */
const WITH_BOTTOM = ['/', '/explore', '/following', '/saved', '/bag', '/account', '/messages'];
const isOn = (path: string, href: string) => (href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`));
const tabOn = (path: string, t: (typeof TABS)[number]) => isOn(path, t.href) || !!t.also?.some((h) => isOn(path, h));

export default function AppNav() {
  const path = usePathname() || '/';
  const router = useRouter();
  const [bag] = useData(getBagCount);
  const [unread] = useData(getUnreadCount);
  const [drawer, setDrawer] = useState(false);
  const desktop = useIsDesktop();
  useLockBody(drawer, () => setDrawer(false));
  const [q, setQ] = useState('');
  useEffect(() => { setDrawer(false); }, [path]);
  useEffect(() => {
    const open = () => setDrawer(true);
    window.addEventListener('u:open-bag', open);
    return () => window.removeEventListener('u:open-bag', open);
  }, []);
  const showBottom = WITH_BOTTOM.some((p) => (p === '/' ? path === '/' : path === p || (p === '/explore' && path.startsWith('/explore'))));
  const hideCorner = path === '/bag';
  // Logo / Discover tapped while already on Discover: go back to the first maker (a Link to the same page does nothing).
  // Phone (FIXES 12.2): first maker, back on Pieces. From another page it just opens Discover where you left it.
  const goHome = () => { if (path === '/') window.dispatchEvent(new Event(desktop ? 'u:home' : 'u:discover-top')); };

  return (
    <>
      {desktop === false && showBottom ? (
        <nav aria-label="Main" className={`gs ${s.bottom}`}>
          {TABS.map((t) => {
            const on = tabOn(path, t);
            return <Link key={t.href} href={t.href} onClick={t.href === '/' ? goHome : undefined} aria-current={on ? 'page' : undefined}><Icon name={t.icon} size={24} filled={on} /><span>{t.label}</span></Link>;
          })}
        </nav>
      ) : null}
      {desktop === false && showBottom && !hideCorner ? (
        <Link href="/bag" aria-label={bag ? `Bag, ${plural(bag, 'item')}` : 'Bag'} className={`gs ${s.bagCorner}${path === '/' ? ' ' + s.bagFeed : ''}`}><Bag size={22} />{bag ? <span key={bag} className={`${s.bagBadge} u-pop`}>{bag}</span> : null}</Link>
      ) : null}

      {desktop && path !== '/sell' && path !== '/sell/apply' ? <header className={`gs ${s.top}`}>
        <Link href="/" aria-label="Uplift home" className="tap" onClick={goHome}><Logo height={30} wordmark /></Link>
        <nav aria-label="Main">
          {TABS.map((t) => <Link key={t.href} href={t.href} onClick={t.href === '/' ? goHome : undefined} aria-current={tabOn(path, t) ? 'page' : undefined}>{t.label}<span className={s.dot} /></Link>)}
        </nav>
        <form role="search" className={s.search} onSubmit={(e) => { e.preventDefault(); router.push(`/explore?q=${encodeURIComponent(q)}`); }}>
          <span><Search size={16} /></span>
          <input type="search" aria-label="Search makers or pieces" placeholder="Search makers or pieces" value={q} onChange={(e) => setQ(e.target.value)} />
        </form>
        <Link href="/sell" className={`sec ${s.sell}`}>Sell on Uplift</Link>
        <Link href="/messages" aria-label={unread ? `Messages, ${unread} new` : 'Messages'} className="ic rel"><Chat size={20} />{unread ? <span className={s.pip} /> : null}</Link>
        <button type="button" aria-label={bag ? `Bag, ${plural(bag, 'item')}` : 'Bag'} className="ic rel" onClick={() => setDrawer(true)}><Bag size={22} />{bag ? <span key={bag} className={`${s.badge} u-pop`}>{bag}</span> : null}</button>
      </header> : null}

      {drawer ? (
        <>
          <button type="button" className={`${s.scrim} u-scrim`} aria-label="Close bag" onClick={() => setDrawer(false)} />
          <aside role="dialog" aria-modal="true" aria-label="Your bag" className={`g ${s.drawer} u-drawer`}>
            <div className={s.drawerHead}><h2 className="hand">Your bag{bag ? ` · ${bag}` : ''}</h2><button type="button" aria-label="Close bag" className="ic gs" onClick={() => setDrawer(false)}><Close /></button></div>
            <div className={s.drawerBody}><BagView compact onNavigate={() => setDrawer(false)} /></div>
          </aside>
        </>
      ) : null}
    </>
  );
}
/** Open the desktop bag drawer from anywhere (e.g. after Add to bag). */
export const openBag = () => window.dispatchEvent(new Event('u:open-bag'));
