'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getBagCount, getMe, getUnreadCount } from '@/lib/data';
import { useData } from '@/lib/useData';
import { useIsDesktop } from '@/lib/useIsDesktop';
import { useLockBody } from '@/lib/useLockBody';
import { Bag, Chat, Close, Search } from './Icons';
import Logo from './Logo';
import BagView from './BagView';
import s from './Nav.module.css';

const TABS = [
  { href: '/', label: 'Discover' },
  { href: '/explore', label: 'Explore' },
  { href: '/following', label: 'Following' },
  { href: '/saved', label: 'Saved' },
];
/** Pages that show the phone bottom nav (others have their own action bar). */
const WITH_BOTTOM = ['/', '/explore', '/following', '/saved', '/bag', '/account', '/messages'];
const isOn = (path: string, href: string) => (href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`));

export function MeButton({ className = '' }: { className?: string }) {
  const [me] = useData(getMe);
  return <Link href="/account" aria-label="Your profile" className={`gs ${s.me} ${className}`}>{(me?.name ?? 'L').slice(0, 1)}</Link>;
}

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
  const hideCorner = path === '/' || path === '/account';
  // Logo / Discover tapped while already on Discover: go back to the first maker (a Link to the same page does nothing).
  const goHome = () => { if (path === '/' && desktop) window.dispatchEvent(new Event('u:home')); };

  return (
    <>
      {desktop === false && showBottom ? (
        <nav aria-label="Main" className={`gs ${s.bottom}`}>
          {TABS.map((t) => (
            <Link key={t.href} href={t.href} onClick={t.href === '/' ? goHome : undefined} aria-current={isOn(path, t.href) ? 'page' : undefined}>{t.label}<span className={s.dot} /></Link>
          ))}
          <Link href="/bag" aria-current={isOn(path, '/bag') ? 'page' : undefined} aria-label={bag ? `Bag, ${bag} items` : 'Bag'}><span>Bag{bag ? <> · <span key={bag} className="u-pop" style={{ display: 'inline-block' }}>{bag}</span></> : null}</span><span className={s.dot} /></Link>
        </nav>
      ) : null}
      {desktop === false && showBottom && !hideCorner ? <MeButton className={s.meCorner} /> : null}

      {desktop && path !== '/sell' && path !== '/sell/apply' ? <header className={`gs ${s.top}`}>
        <Link href="/" aria-label="Uplift home" className="tap" onClick={goHome}><Logo height={30} wordmark /></Link>
        <nav aria-label="Main">
          {TABS.map((t) => <Link key={t.href} href={t.href} onClick={t.href === '/' ? goHome : undefined} aria-current={isOn(path, t.href) ? 'page' : undefined}>{t.label}<span className={s.dot} /></Link>)}
        </nav>
        <form role="search" className={s.search} onSubmit={(e) => { e.preventDefault(); router.push(`/explore?q=${encodeURIComponent(q)}`); }}>
          <span><Search size={16} /></span>
          <input type="search" aria-label="Search makers or pieces" placeholder="Search makers or pieces" value={q} onChange={(e) => setQ(e.target.value)} />
        </form>
        <Link href="/sell" className={`sec ${s.sell}`}>Sell on Uplift</Link>
        <Link href="/messages" aria-label={unread ? `Messages, ${unread} new` : 'Messages'} className="ic rel"><Chat size={20} />{unread ? <span className={s.pip} /> : null}</Link>
        <button type="button" aria-label={bag ? `Bag, ${bag} items` : 'Bag'} className="ic rel" onClick={() => setDrawer(true)}><Bag size={20} />{bag ? <span key={bag} className={`${s.badge} u-pop`}>{bag}</span> : null}</button>
        <MeButton />
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
