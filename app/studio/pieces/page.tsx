'use client';
import Link from 'next/link';
import { useState } from 'react';
import { getStudioProducts } from '@/lib/data';
import { formatEUR, plural } from '@/lib/format';
import { useData } from '@/lib/useData';
import Wash from '@/components/u/Wash';
import s from '../studio.module.css';

/** Studio: your pieces (Live / Sold out / Drafts). */
export default function Pieces() {
  const [list] = useData(getStudioProducts);
  const [f, setF] = useState<'all' | 'live' | 'sold' | 'draft'>('all');
  if (!list) return <Wash />;
  const state = (p: (typeof list)[number]) => (p.status === 'draft' ? 'draft' : p.sold ? 'sold' : 'live');
  const shown = list.filter((p) => f === 'all' || state(p) === f);
  const live = list.filter((p) => state(p) === 'live').length;
  return (
    <>
      <Wash src={list[0]?.images[0]} />
      <main className="u-page">
        <div className="u-head"><span style={{ flex: 1 }}><h1 className="hand">Your pieces</h1><span className="m sub">{plural(list.length, 'piece')} · {live} live</span></span><Link href="/studio/pieces/new" className="cta">+ Add</Link></div>
        <div className="chips scroll">{([['all', 'All'], ['live', 'Live'], ['sold', 'Sold out'], ['draft', 'Drafts']] as const).map(([k, l]) => <button key={k} type="button" className="chip" aria-pressed={f === k} onClick={() => setF(k)}>{l}</button>)}</div>
        <div className={`g ${s.list}`}>
          {shown.map((p) => {
            const st = state(p);
            const sub = p.madeToOrder ? 'Made to order' : p.oneOfAKind ? (p.sold ? 'Sold · 1 of 1' : '1 of 1') : p.sold ? '0 left · back in stock?' : `${p.stock} of ${p.madeCount} left`;
            return (
              <Link key={p.id} href={`/studio/pieces/${p.id}`}>
                {p.images[0] ? <img src={p.images[0]} alt="" /> : <span className="gs" style={{ width: 52, height: 52, borderRadius: 14 }} />}
                <span className={s.grow}><span>{p.title}</span><span className="m">{formatEUR(p.priceCents)} · {sub}</span></span>
                <span className={`${s.status} ${st === 'live' ? s.live : 'gs'}`}>{st === 'live' ? 'Live' : st === 'sold' ? 'Sold out' : 'Draft'}</span>
              </Link>
            );
          })}
          {!shown.length ? <div className="m">Nothing here yet.</div> : null}
        </div>
      </main>
    </>
  );
}
