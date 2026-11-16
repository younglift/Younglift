'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { Maker, Product } from '@/lib/types';
import { MAKER_EXTRAS, search, toggleFollow } from '@/lib/data';
import { formatEUR } from '@/lib/format';
import BottomNav from '@/components/BottomNav';
import ProfileLink from '@/components/ProfileLink';
import s from './following.module.css';

// A8 · Following (docs/design/screens/Following.dc.html): makers as story circles, updates from
// them (new pieces + journal notes), and the list of makers with Follow / Following.
// Times are only shown where we have a real date (journal posts).

type Update = { key: string; maker: Maker; kind: string; when?: string; piece?: Product; text?: string };

export default function Following() {
  const [makers, setMakers] = useState<Maker[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sel, setSel] = useState('all');

  const load = useCallback(async () => {
    const res = await search('');
    setMakers(res.makers);
    setProducts(res.products);
  }, []);
  useEffect(() => { load(); }, [load]);

  const followed = makers.filter((m) => m.isFollowing);
  const shown = followed.filter((m) => sel === 'all' || m.id === sel);
  const updates: Update[] = shown.flatMap((m) => {
    const x = MAKER_EXTRAS[m.id];
    const notes: Update[] = (x?.journal ?? []).slice(0, 2).map((j, i) => ({
      key: `${m.id}-j${i}`, maker: m, kind: j.image ? 'Journal' : 'Journal · Note', when: j.date.toUpperCase(), text: j.title ? `${j.title}. ${j.isVideo ? 'Video coming soon.' : j.text}` : j.text,
    }));
    const pieces: Update[] = products.filter((p) => p.makerId === m.id && p.stock > 0).slice(0, 2)
      .map((p) => ({ key: `${m.id}-${p.id}`, maker: m, kind: 'Piece', piece: p }));
    return [...pieces.slice(0, 1), ...notes.slice(0, 1), ...pieces.slice(1), ...notes.slice(1)];
  });

  return (
    <main className={s.screen}>
      <div className={s.head}><div className={s.titleRow}><h1 className={s.h1}>FOLLOWING</h1><ProfileLink /></div></div>

      {followed.length === 0 ? (
        <div className={s.empty}>
          <span>You don’t follow anyone yet</span>
          <span>Tap “+ Follow” on a maker you like. Their new pieces and notes show up here.</span>
          <Link href="/" className={s.emptyBtn}>DISCOVER MAKERS</Link>
        </div>
      ) : (
        <>
          <div className={`noscroll ${s.circles}`}>
            {[{ id: 'all', name: 'All', portraitUrl: '' } as Maker, ...followed].map((m) => {
              const on = sel === m.id;
              return (
                <button key={m.id} type="button" aria-pressed={on} className={s.circle} onClick={() => setSel(m.id)}>
                  <span className={s.ring} style={{ background: m.id !== 'all' ? 'var(--accent)' : on ? 'var(--fg)' : 'var(--surface-2)' }}>
                    {m.id === 'all' ? <span className={s.all}>ALL</span> : <img src={m.portraitUrl} alt="" />}
                  </span>
                  <span className={on ? s.circleNameOn : s.circleName}>{m.name}</span>
                </button>
              );
            })}
          </div>

          <div className={s.sectionHead}><h2>NEW FROM YOUR MAKERS</h2></div>
          <div className={s.updates}>
            {updates.map((u) => (
              <article key={u.key} className={s.update}>
                <div className={s.updHead}>
                  <img src={u.maker.portraitUrl} alt="" />
                  <span className={s.updWho}><Link href={`/maker/${u.maker.slug}?from=following`}>{u.maker.name}</Link><span>{u.kind}</span></span>
                  {u.when && <span className={`mono ${s.when}`}>{u.when}</span>}
                </div>
                {u.piece ? (
                  <Link href={`/product/${u.piece.id}?from=following`} className={s.piece}>
                    <img src={u.piece.images[0]} alt={u.piece.title} />
                    <span><span>{u.piece.title}</span><span className="mono">{formatEUR(u.piece.priceCents)}</span></span>
                  </Link>
                ) : (
                  <p className={s.note}>{u.text}</p>
                )}
              </article>
            ))}
          </div>
        </>
      )}

      <div className={s.sectionHead}><h2>YOUR MAKERS</h2><span className="mono">{followed.length} MAKERS</span></div>
      <div className={s.list}>
        {makers.map((m) => (
          <div key={m.id} className={s.row}>
            <img src={m.portraitUrl} alt="" />
            <Link href={`/maker/${m.slug}?from=following`} className={s.rowText}>
              <span>{m.name}</span><span>{MAKER_EXTRAS[m.id]?.craft ?? ''} · {m.city}</span>
            </Link>
            <button type="button" aria-pressed={!!m.isFollowing} className={m.isFollowing ? s.btnOn : s.btn}
              onClick={async () => { await toggleFollow(m.id); if (sel === m.id) setSel('all'); load(); }}>
              {m.isFollowing ? 'Following' : '+ Follow'}
            </button>
          </div>
        ))}
      </div>
      <div className={s.navSpace} />
      <BottomNav />
    </main>
  );
}
