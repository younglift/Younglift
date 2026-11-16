'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getBag } from '@/lib/data';
import s from './BottomNav.module.css';

// Five items as proposed by Matas (docs/design/JOURNEY.md, A6). Messages and Profile are reached
// from maker / product pages and the avatar in page headers.
const ITEMS = [
  { href: '/', label: 'Discover', match: (p: string) => p === '/' },
  { href: '/explore', label: 'Explore', match: (p: string) => p.startsWith('/explore') },
  { href: '/following', label: 'Following', match: (p: string) => p.startsWith('/following') },
  { href: '/saved', label: 'Saved', match: (p: string) => p.startsWith('/saved') },
  { href: '/bag', label: 'Bag', match: (p: string) => p.startsWith('/bag') },
];

export default function BottomNav({ active }: { active?: string }) {
  const path = usePathname() ?? '/';
  const [count, setCount] = useState(0);
  useEffect(() => {
    let alive = true;
    const load = () => getBag().then((b) => { if (alive) setCount(b.reduce((n, l) => n + l.qty, 0)); });
    load();
    window.addEventListener('yl-bag', load);
    return () => { alive = false; window.removeEventListener('yl-bag', load); };
  }, []);
  return (
    <nav aria-label="Main" className={s.nav}>
      {ITEMS.map((it) => {
        const on = active ? active === it.label : it.match(path);
        return (
          <Link key={it.href} href={it.href} className={on ? s.on : s.item} aria-current={on ? 'page' : undefined}>
            {it.label}{it.label === 'Bag' && count > 0 ? ` · ${count}` : ''}
          </Link>
        );
      })}
    </nav>
  );
}

/** Call after changing the bag so the nav count updates. */
export function bagChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('yl-bag'));
}
