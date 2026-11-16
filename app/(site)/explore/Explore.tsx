'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Category, Maker, Product } from '@/lib/types';
import { PRODUCT_EXTRAS, search } from '@/lib/data';
import BottomNav from '@/components/BottomNav';
import ProfileLink from '@/components/ProfileLink';
import PieceCard from '@/components/PieceCard';
import { Search } from '@/components/Icons';
import pc from '@/components/PieceCard.module.css';
import s from './explore.module.css';

// A6 · Explore (docs/design/screens/Explore*.dc.html): pieces only. Start: search + category rows.
// Category or search: subcategories, Filter + Sort, grid. Filter options come from the real pieces.

type Cat = { slug: string; label: string; cats: Category[]; img?: string; pos?: string; subs: [string, RegExp][] };
const CATS: Cat[] = [
  { slug: 'jewellery', label: 'Jewellery', cats: ['jewelry'], img: '/img/rings-set.jpg', subs: [['Rings', /ring|loop|band|trio/i], ['Necklaces', /necklace|pendant/i], ['Earrings', /earring/i]] },
  { slug: 'ceramics', label: 'Ceramics', cats: ['ceramics'], img: '/img/ceramics-set.jpg', pos: '25% center', subs: [['Bowls', /bowl/i], ['Cups', /cup/i], ['Vases', /vase/i]] },
  { slug: 'clothing', label: 'Clothing', cats: ['clothing'], img: '/img/crochet-duo.jpg', pos: '70% 25%', subs: [['Hoods', /hood|pair/i]] },
  { slug: 'accessories', label: 'Bags & accessories', cats: ['accessories', 'textiles'], img: '/img/crochet-details.jpg', subs: [['Scarves', /scarf/i]] },
  { slug: 'home', label: 'Home', cats: ['wood', 'other'], subs: [] },
  { slug: 'prints', label: 'Art & prints', cats: ['prints'], subs: [] },
];
const MATERIALS: [string, RegExp][] = [['Silver', /silver/i], ['Gold', /gold/i], ['Stoneware', /stoneware/i], ['Terracotta', /terracotta/i], ['Wool', /wool/i], ['Cotton', /cotton/i]];
const PRICES: [string, (c: number) => boolean][] = [['Under 50€', (c) => c < 5000], ['50–150€', (c) => c >= 5000 && c <= 15000], ['Over 150€', (c) => c > 15000]];
const AVAIL: [string, (p: Product) => boolean][] = [
  ['Ready to ship', (p) => PRODUCT_EXTRAS[p.id]?.status === 'ready'],
  ['Made to order', (p) => PRODUCT_EXTRAS[p.id]?.status === 'order'],
  ['1 of 1 only', (p) => p.oneOfAKind],
];
const POPULAR = ['silver ring', 'speckled bowl', 'wool hood', 'gold'];
const SORTS = { new: 'Newest', low: 'Price ↑', high: 'Price ↓' } as const;

export default function Explore({ cat: catSlug, q: startQ }: { cat: string | null; q: string }) {
  const router = useRouter();
  const [all, setAll] = useState<{ makers: Maker[]; products: Product[] }>({ makers: [], products: [] });
  const [q, setQ] = useState(startQ);
  const [sub, setSub] = useState('All');
  const [flt, setFlt] = useState<string[]>([]);
  const [sort, setSort] = useState<keyof typeof SORTS>('new');
  const [sheet, setSheet] = useState(false);
  const cat = CATS.find((c) => c.slug === catSlug) ?? null;
  const isHome = !cat && !q.trim();

  useEffect(() => { search('').then(setAll); }, []);
  useEffect(() => { setQ(startQ); setSub('All'); setFlt([]); }, [catSlug, startQ]);

  // Keep the view in the URL so "back" from a piece returns to the same results.
  const syncUrl = (nextQ: string, nextCat: string | null) => {
    const sp = new URLSearchParams();
    if (nextCat) sp.set('cat', nextCat);
    if (nextQ.trim()) sp.set('q', nextQ.trim());
    const qs = sp.toString();
    router.replace(qs ? `/explore?${qs}` : '/explore', { scroll: false });
  };

  const makerName = useMemo(() => Object.fromEntries(all.makers.map((m) => [m.id, m.name])), [all.makers]);
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const base = all.products.filter((p) => {
    if (cat && !cat.cats.includes(p.category)) return false;
    if (cat && sub !== 'All') { const re = cat.subs.find(([n]) => n === sub)?.[1]; if (re && !re.test(p.title)) return false; }
    const hay = `${p.title} ${makerName[p.makerId] ?? ''} ${p.category} ${p.materials.join(' ')} ${p.description}`.toLowerCase();
    return words.every((w) => hay.includes(w.replace(/s$/, '')));
  });
  const passes = (p: Product, f: string[]) => {
    const mats = MATERIALS.filter(([n]) => f.includes(n));
    const prices = PRICES.filter(([n]) => f.includes(n));
    const avail = AVAIL.filter(([n]) => f.includes(n));
    return (!mats.length || mats.some(([, re]) => re.test(p.materials.join(' ')))) &&
      (!prices.length || prices.some(([, fn]) => fn(p.priceCents))) &&
      avail.every(([, fn]) => fn(p));
  };
  const pieces = base.filter((p) => passes(p, flt)).sort((a, b) =>
    sort === 'low' ? a.priceCents - b.priceCents : sort === 'high' ? b.priceCents - a.priceCents : 0);
  const count = (n: string) => base.filter((p) => passes(p, flt.includes(n) ? flt : [...flt, n])).length;
  const groups = [
    { title: 'Material', opts: MATERIALS.map(([n]) => n) },
    { title: 'Price', opts: PRICES.map(([n]) => n) },
    { title: 'Availability', opts: AVAIL.map(([n]) => n) },
  ].map((g) => ({ ...g, opts: g.opts.map((n) => ({ n, c: count(n), on: flt.includes(n) })).filter((o) => o.on || o.c > 0) }))
    .filter((g) => g.opts.length);
  const subs = cat ? cat.subs.filter(([, re]) => all.products.some((p) => cat.cats.includes(p.category) && re.test(p.title))) : [];
  const plural = (n: number) => `${n} ${n === 1 ? 'PIECE' : 'PIECES'}`;
  const from = `explore`;

  return (
    <main className={s.screen}>
      <div className={s.head}>
        {isHome ? (
          <div className={s.titleRow}><h1 className={s.h1}>EXPLORE</h1><ProfileLink /></div>
        ) : (
          <>
            <button type="button" className={s.back} onClick={() => { setQ(''); syncUrl('', null); }}>‹ Explore</button>
            <h1 className={s.h1Sub}>{cat ? cat.label.toUpperCase() : 'RESULTS'}</h1>
          </>
        )}
        <label className={s.search}>
          <Search color="var(--muted)" />
          <input
            type="search"
            value={q}
            placeholder="Silver ring, bowl, wool hood…"
            aria-label="Search pieces"
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') syncUrl(q, cat?.slug ?? null); }}
            onBlur={() => syncUrl(q, cat?.slug ?? null)}
          />
          {q && <button type="button" aria-label="Clear search" className={s.clear} onClick={() => { setQ(''); syncUrl('', cat?.slug ?? null); }}>✕</button>}
        </label>
      </div>

      {isHome ? (
        <>
          <nav aria-label="Categories" className={s.cats}>
            {CATS.map((c) => {
              const n = all.products.filter((p) => c.cats.includes(p.category)).length;
              return (
                <button key={c.slug} type="button" className={s.catRow} onClick={() => syncUrl('', c.slug)}>
                  <span className={s.catImg}>{c.img && <img src={c.img} alt="" style={{ objectPosition: c.pos }} />}</span>
                  <span className={s.catText}><span className={s.catName}>{c.label}</span><span className={s.catCount}>{n ? `${n} ${n === 1 ? 'piece' : 'pieces'}` : 'Coming soon'}</span></span>
                  <span aria-hidden="true" className={s.chev}>›</span>
                </button>
              );
            })}
          </nav>
          <div className={s.popular}>
            <span className={`mono ${s.kick}`}>POPULAR SEARCHES</span>
            <div className={s.popRow}>
              {POPULAR.map((t) => <button key={t} type="button" className={s.pop} onClick={() => { setQ(t); syncUrl(t, null); }}>{t}</button>)}
            </div>
          </div>
        </>
      ) : (
        <>
          {subs.length > 0 && (
            <div className={`noscroll ${s.subs}`}>
              {['All', ...subs.map(([n]) => n)].map((n) => (
                <button key={n} type="button" aria-pressed={sub === n} className={sub === n ? s.chipOn : s.chip} onClick={() => setSub(n)}>{n}</button>
              ))}
            </div>
          )}
          <div className={s.tools}>
            <button type="button" className={flt.length ? s.toolOn : s.tool} onClick={() => setSheet(true)}>{flt.length ? `Filter (${flt.length})` : 'Filter'}</button>
            <button type="button" className={s.tool} onClick={() => setSort(sort === 'new' ? 'low' : sort === 'low' ? 'high' : 'new')}>{SORTS[sort]} ▾</button>
          </div>
          <span className={`mono ${s.count}`}>{plural(pieces.length)}</span>
          {pieces.length === 0 && (
            <div className={s.empty}><span>Nothing matches yet</span><span>Try another word, or clear the filters.</span></div>
          )}
          <div className={`${pc.grid} ${s.grid}`}>
            {pieces.map((p) => <PieceCard key={p.id} p={p} from={from} makerName={makerName[p.makerId]} />)}
          </div>
        </>
      )}

      {sheet && (
        <div role="dialog" aria-modal="true" aria-label="Filters" className={s.sheet}>
          <div className={s.sheetHead}>
            <button type="button" aria-label="Close filters" className={s.x} onClick={() => setSheet(false)}>✕</button>
            <span className={s.sheetTitle}>Filter</span>
            <button type="button" className={s.clearAll} onClick={() => setFlt([])}>Clear all</button>
          </div>
          <div className={`noscroll ${s.sheetBody}`}>
            {groups.map((g) => (
              <fieldset key={g.title} className={s.group}>
                <legend>{g.title}</legend>
                {g.opts.map((o) => (
                  <button key={o.n} type="button" role="checkbox" aria-checked={o.on} className={s.opt}
                    onClick={() => setFlt(o.on ? flt.filter((x) => x !== o.n) : [...flt, o.n])}>
                    <span aria-hidden="true" className={o.on ? s.boxOn : s.box}>{o.on ? '✓' : ''}</span>
                    <span className={s.optName}>{o.n}</span>
                    <span className={`mono ${s.optN}`}>{o.c}</span>
                  </button>
                ))}
              </fieldset>
            ))}
          </div>
          <div className={s.sheetFoot}>
            <button type="button" className={s.show} onClick={() => setSheet(false)}>SHOW {plural(pieces.length)}</button>
          </div>
        </div>
      )}
      <div className={s.navSpace} />
      <BottomNav />
    </main>
  );
}
