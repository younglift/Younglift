'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { getCategories } from '@/lib/data';
import { plural } from '@/lib/format';
import { useData } from '@/lib/useData';
import { Search } from '@/components/u/Icons';
import Wash from '@/components/u/Wash';
import Results from './Results';
import s from './explore.module.css';

const POPULAR = ['silver ring', 'speckled bowl', 'wool', 'gold', 'print'];

function Explore() {
  const q = useSearchParams().get('q');
  const router = useRouter();
  const [cats] = useData(getCategories);
  const [text, setText] = useState(q ?? '');
  if (q) return <Results key={q} title={`“${q}”`} q={q} />;
  return (
    <>
      <Wash src="/img/earrings.jpg" />
      <main className="u-page">
        <div className="u-head"><h1 className="hand">Explore</h1></div>
        <form role="search" className={`gs ${s.search}`} onSubmit={(e) => { e.preventDefault(); if (text.trim()) router.push(`/explore?q=${encodeURIComponent(text.trim())}`); }}>
          <span><Search /></span>
          <input type="search" aria-label="Search pieces" placeholder="Silver ring, bowl, wool bag…" value={text} onChange={(e) => setText(e.target.value)} />
        </form>
        <nav aria-label="Categories" className={`g ${s.cats} ${s.catsDesk}`} style={{ display: 'flex' }}>
          {(cats ?? []).map((c) => (
            <Link key={c.id} href={`/explore/${c.id}`}>
              <img src={c.image ?? '/img/candle.jpg'} alt="" />
              <span className={s.t}><span>{c.label}</span><span className="m">{c.count ? plural(c.count, 'piece') : 'Coming soon'}</span></span>
              <span className="m">›</span>
            </Link>
          ))}
        </nav>
        <div className="u-stack" style={{ gap: 10 }}>
          <span className="lbl m">Popular searches</span>
          <div className={s.pop}>{POPULAR.map((p) => <Link key={p} href={`/explore?q=${encodeURIComponent(p)}`} className="gs">{p}</Link>)}</div>
        </div>
      </main>
    </>
  );
}
export default function ExplorePage() { return <Suspense fallback={<Wash />}><Explore /></Suspense>; }
