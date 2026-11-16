'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Category } from '@/lib/types';
import { getMe, saveTaste } from '@/lib/data';
import { setFlag } from '@/lib/ui';
import { Check, Plus } from '@/components/Icons';
import s from './welcome.module.css';

// A1–A2 · First open + taste (docs/design/screens/Welcome.dc.html).
// Tiles without makers yet show "Coming soon" instead of a photo.
const TILES: { name: string; cats: Category[]; img?: string; pos?: string }[] = [
  { name: 'Jewellery', cats: ['jewelry'], img: '/img/rings-set.jpg', pos: 'center' },
  { name: 'Ceramics', cats: ['ceramics'], img: '/img/ceramics-set.jpg', pos: '25% center' },
  { name: 'Clothing', cats: ['clothing', 'textiles'], img: '/img/crochet-duo.jpg', pos: '70% 25%' },
  { name: 'Bags & accessories', cats: ['accessories'] },
  { name: 'Objects for the home', cats: ['wood', 'other'] },
  { name: 'Art & prints', cats: ['prints'] },
];
const SUBS = ['Rings', 'Necklaces', 'Earrings', 'Other pieces'];

export default function Welcome() {
  const router = useRouter();
  const [sel, setSel] = useState<string[]>(['Jewellery', 'Ceramics']);
  const [subs, setSubs] = useState<string[]>(['Rings']);

  useEffect(() => {
    // Coming back from Profile → "Your taste": start from what they picked before.
    getMe().then((me) => {
      if (!me?.taste.categories.length) return;
      setSel(TILES.filter((t) => t.cats.some((c) => me.taste.categories.includes(c))).map((t) => t.name));
      if (me.taste.styles.length) setSubs(me.taste.styles);
    });
  }, []);

  const toggle = (list: string[], x: string) => (list.includes(x) ? list.filter((y) => y !== x) : [...list, x]);
  const n = sel.length;

  async function go(surprise: boolean) {
    const cats = surprise ? [] : TILES.filter((t) => sel.includes(t.name)).flatMap((t) => t.cats);
    await saveTaste({ categories: cats, styles: surprise || !sel.includes('Jewellery') ? [] : subs, materials: [] });
    setFlag('welcome');
    router.push('/');
  }

  return (
    <main className={s.screen}>
      <div className={s.scroll}>
        <div className={s.top}>
          <span className={s.logo}>YOUNG <span className={s.lift}>LIFT</span></span>
          <button type="button" className={s.skip} onClick={() => go(true)}>Skip</button>
        </div>
        <span className={`mono ${s.kicker}`}>WELCOME TO YOUNG LIFT</span>
        <h1 className={s.h1}>WHAT CATCHES YOUR EYE?</h1>
        <p className={s.lead}>Pick a few things you love. We’ll introduce you to the people making them.</p>

        <div className={s.tiles}>
          {TILES.map((t) => {
            const on = sel.includes(t.name);
            return (
              <button key={t.name} type="button" className={s.tile} aria-pressed={on} onClick={() => setSel(toggle(sel, t.name))}>
                <span className={on ? s.photoOn : s.photo}>
                  {t.img
                    ? <img src={t.img} alt="" style={{ objectPosition: t.pos }} />
                    : <span className={`mono ${s.soon}`}>COMING SOON</span>}
                  <span className={on ? s.markOn : `glass ${s.mark}`}>{on ? <Check /> : <Plus />}</span>
                </span>
                <span className={s.tileText}>
                  <span className={s.tileName}>{t.name}</span>
                  {!t.img && <span className={s.tileNote}>No makers here yet</span>}
                </span>
              </button>
            );
          })}
        </div>

        {sel.includes('Jewellery') && (
          <div className={s.subs}>
            <span className={s.subsQ}>In jewellery, what do you wear?</span>
            <div className={s.chips}>
              {SUBS.map((x) => {
                const on = subs.includes(x);
                return (
                  <button key={x} type="button" aria-pressed={on} className={on ? s.chipOn : s.chip} onClick={() => setSubs(toggle(subs, x))}>{x}</button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className={s.bottom}>
        <span className={`mono ${s.count}`}>{n ? `${n} PICKED · YOU CAN CHANGE THIS LATER` : 'PICK AT LEAST ONE, OR LET US SURPRISE YOU'}</span>
        <button type="button" className={s.go} disabled={!n} onClick={() => go(false)}>MEET THE MAKERS →</button>
        <button type="button" className={s.surprise} onClick={() => go(true)}>Surprise me</button>
      </div>
    </main>
  );
}
