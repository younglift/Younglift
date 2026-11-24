'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Category, Maker, Product } from '@/lib/types';
import { getMakers, search } from '@/lib/data';
import { plural } from '@/lib/format';
import { useData } from '@/lib/useData';
import { BackButton, ProductCard } from '@/components/u/Bits';
import { Close } from '@/components/u/Icons';
import Sheet from '@/components/u/Sheet';
import Wash from '@/components/u/Wash';
import Filters, { EMPTY, activeCount, applyFilters, type F } from './Filters';
import s from './explore.module.css';
import Img from '@/components/u/Img';

const SORTS = [['new', 'Newest'], ['low', 'Price: low to high'], ['high', 'Price: high to low']] as const;

/** 05 Category or search results: sub-type chips, Filter (sheet on phone, side panel on desktop), Sort. */
export default function Results({ title, category, q }: { title: string; category?: Category; q?: string }) {
  const [res] = useData(() => search(q ?? '', { category }), [q, category]);
  const [makers] = useData(getMakers);
  const [kind, setKind] = useState('All');
  const [f, setF] = useState<F>(EMPTY);
  const [sheet, setSheet] = useState(false);
  const [sort, setSort] = useState<(typeof SORTS)[number][0]>('new');
  const [sortOpen, setSortOpen] = useState(false);
  const byId = useMemo(() => new Map((makers ?? []).map((m) => [m.id, m])), [makers]);
  const countryOf = (p: Product) => byId.get(p.makerId)?.country ?? 'LT';
  const base = (res?.products ?? []).filter((p) => kind === 'All' || p.kind === kind);
  const kinds = ['All', ...Array.from(new Set((res?.products ?? []).map((p) => p.kind).filter(Boolean) as string[]))];
  const list = applyFilters(base, f, countryOf).sort((a, b) => (sort === 'low' ? a.priceCents - b.priceCents : sort === 'high' ? b.priceCents - a.priceCents : Number(a.sold) - Number(b.sold) || b.createdAt.localeCompare(a.createdAt)));
  const n = activeCount(f);
  const foundMakers: Maker[] = res?.makers ?? [];
  const summary = [plural(list.length, 'piece'), ...f.materials].join(' · ');

  return (
    <>
      <Wash src={list[0]?.images[0] ?? '/img/flow-ring.jpg'} />
      <main className="u-page">
        <div className="u-head" style={{ flexWrap: 'wrap' }}>
          <BackButton href="/explore" text="Explore" className="sec" />
        </div>
        <div className="u-head" style={{ marginTop: -10 }}><span><h1 className="hand">{title}</h1><span className="m sub">{summary}</span></span></div>
        {foundMakers.length ? (
          <div className={s.makers}>{foundMakers.map((m) => <Link key={m.id} href={`/m/${m.slug}`} className="gs"><Img small src={m.portraitUrl} alt="" className="u-avatar" /><span className="hand" style={{ fontSize: 14 }}>{m.name}</span><span className="m" style={{ fontSize: 12 }}>{m.city}</span></Link>)}</div>
        ) : null}
        <div className={s.layout}>
          <aside className={`g ${s.aside}`} aria-label="Filter">
            <div className="row" style={{ justifyContent: 'space-between' }}><span className="hand" style={{ fontSize: 18 }}>Filter</span>{n ? <button type="button" className="link" onClick={() => setF(EMPTY)}>Clear all</button> : null}</div>
            <Filters list={base} f={f} set={setF} countryOf={countryOf} />
          </aside>
          <div className="u-stack" style={{ minWidth: 0, gap: 14 }}>
            {kinds.length > 2 ? <div className="chips scroll">{kinds.map((k) => <button key={k} type="button" className="chip" aria-pressed={kind === k} onClick={() => setKind(k)}>{k}</button>)}</div> : null}
            <div className={s.tools}>
              <button type="button" className={`sec gs ${s.filterBtn}`} onClick={() => setSheet(true)}>Filter{n ? ` (${n})` : ''}</button>
              <span style={{ position: 'relative', display: 'flex' }}>
                <button type="button" className="sec gs" style={{ flex: 1 }} aria-expanded={sortOpen} onClick={() => setSortOpen(!sortOpen)}>{SORTS.find((x) => x[0] === sort)![1].replace('Price: ', '')} ▾</button>
                {sortOpen ? <div className={`g ${s.sortMenu}`} role="menu">{SORTS.map(([k, l]) => <button key={k} type="button" role="menuitemradio" aria-checked={sort === k} aria-pressed={sort === k} onClick={() => { setSort(k); setSortOpen(false); }}>{l}</button>)}</div> : null}
              </span>
            </div>
            {res ? (list.length ? (
              <div className="u-grid">{list.map((p) => <ProductCard key={p.id} p={p} maker={byId.get(p.makerId)} />)}</div>
            ) : (
              <div className="g u-card u-stack" style={{ alignItems: 'flex-start' }}>
                <span className="hand" style={{ fontSize: 18 }}>Nothing found</span>
                <span className="m">Try fewer filters or another word.</span>
                {n ? <button type="button" className="sec gs" onClick={() => setF(EMPTY)}>Clear filters</button> : <Link href="/explore" className="sec gs">All categories</Link>}
              </div>
            )) : null}
          </div>
        </div>
      </main>
      {sheet ? (
        <Sheet title="Filter" onClose={() => setSheet(false)}
          right={<button type="button" className="link" onClick={() => setF(EMPTY)} disabled={!n} style={{ opacity: n ? 1 : 0.45 }}>Clear all</button>}
          left={<button type="button" aria-label="Close filter" className="ic" onClick={() => setSheet(false)}><Close /></button>}
          footer={<button type="button" className="cta" onClick={() => setSheet(false)}>Show {plural(list.length, 'piece')}</button>}>
          <Filters list={base} f={f} set={setF} countryOf={countryOf} />
        </Sheet>
      ) : null}
    </>
  );
}
