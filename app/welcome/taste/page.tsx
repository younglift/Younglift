'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Category } from '@/lib/types';
import { getMe, markOnboarded, saveTaste } from '@/lib/data';
import Wash from '@/components/u/Wash';
import s from '../welcome.module.css';
import Img from '@/components/u/Img';

const OPTIONS: { id: Category; label: string; img: string }[] = [
  { id: 'jewelry', label: 'Jewellery', img: '/img/earrings.jpg' },
  { id: 'ceramics', label: 'Ceramics', img: '/img/plates.jpg' },
  { id: 'crochet', label: 'Crochet & knit', img: '/img/crochet-bag.jpg' },
  { id: 'clothing', label: 'Clothing', img: '/img/cardigan.jpg' },
  { id: 'home', label: 'Home', img: '/img/candle.jpg' },
  { id: 'prints', label: 'Art & prints', img: '/img/print.jpg' },
];

/** 02 What do you love? (also "Your taste" from the profile). */
export default function Taste() {
  const router = useRouter();
  const [picked, setPicked] = useState<Category[]>([]);
  useEffect(() => { getMe().then((m) => setPicked(m.taste.categories)); }, []);
  const toggle = (c: Category) => setPicked((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));
  const done = async () => { await saveTaste({ categories: picked, styles: [], materials: [] }); router.push('/'); };
  return (
    <>
      <Wash src={OPTIONS.find((o) => picked.includes(o.id))?.img ?? '/img/earrings.jpg'} />
      <main className={`u-page ${s.taste}`}>
        <div className="u-head"><span><h1 className="hand t-28">What do you love?</h1><span className="m sub">Pick a few. We’ll show you makers you’ll like.</span></span></div>
        <div className={s.grid}>
          {OPTIONS.map((o) => {
            const on = picked.includes(o.id);
            return (
              <button key={o.id} type="button" className={s.tile} aria-pressed={on} onClick={() => toggle(o.id)}>
                <Img src={o.img} alt="" className="u-cover" />
                <span className={s.nm}>{o.label}</span>
                {on ? <span className={`chk on ${s.chk}`}>✓</span> : null}
              </button>
            );
          })}
        </div>
        <div className={s.foot}>
          <Link href="/" className={s.skip} onClick={() => { markOnboarded(); }}>Skip</Link>
          <button type="button" className="cta" onClick={done} disabled={!picked.length}>{picked.length ? `Show me makers · ${picked.length}` : 'Pick at least one'}</button>
        </div>
      </main>
    </>
  );
}
