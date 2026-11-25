'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FeedItem, Maker, Product } from '@/lib/types';
import { CATEGORY_LABEL, getBag, getFeed, getMe, hideMaker, markHintsSeen } from '@/lib/data';
import { formatEUR, shipsLine } from '@/lib/format';
import { useData } from '@/lib/useData';
import { useIsDesktop } from '@/lib/useIsDesktop';
import { FollowButton, SaveButton, useAddToBag } from '@/components/u/Bits';
import { openBag } from '@/components/u/Nav';
import { Back, Chevron } from '@/components/u/Icons';
import MakerProfile, { makerMeta } from '@/components/u/MakerProfile';
import Sticker from '@/components/u/Sticker';
import Loading from '@/components/u/Loading';
import Wash from '@/components/u/Wash';
import s from './discover/discover.module.css';
import Img from '@/components/u/Img';
import { washSrc } from '@/lib/img';
import Icon from '@/components/u/Icon';
import PhoneFeed from './discover/PhoneFeed';

function pieceMeta(p: Product) {
  const first = p.oneOfAKind ? '1 of 1' : p.madeToOrder ? 'Made to order' : p.subtitle ?? (p.madeCount > 1 ? `${p.freeStock ?? p.stock} left` : '');
  return [first, p.materials.join(' & '), p.sold ? 'Sold' : shipsLine(p)].filter(Boolean).join(' · ');
}
const firstAvailable = (ps: Product[]) => Math.max(0, ps.findIndex((p) => !p.sold));

/** Name, price, Add to bag, Save, "More from …" (piece step, phone and desktop). */
function stickerPair(item: FeedItem, p: Product) {
  if (item.reason === 'surprise') return { mk: undefined, up: 'picked_for_you' as const };
  return p.stickers?.maker ? { mk: p.stickers.maker, up: undefined } : { mk: undefined, up: p.stickers?.uplift };
}

/** Makers away from the screen render only their photo (no glass, no extra images): FIXES 1.1/1.2. */
/** One maker per screen under the 100px top bar, 16px between makers (Justinas 2026-11-25: smaller gaps). */
const deskStep = () => window.innerHeight - 100;

/** Desktop Discover v2 (FIXES P7, Matas 2026-11-25): one piece per maker. Left: the piece's photos (← →, dots).
    Right: one card with the maker, the piece, Add to bag, her story, more from her, next maker.
    FIXES 11.3 (Matas 2026-11-25 22:34, replaces P7's free scrolling): one maker per scroll. The page snaps
    (html.u-snap-y, every maker scroll-snap-stop: always); one wheel flick / trackpad swipe, ↓ PageDown Space or
    ↑ PageUp moves exactly one maker, then input is locked until the move and the trackpad momentum are over. */
function DeskStage({ items, inBag }: { items: FeedItem[]; inBag: Set<string> }) {
  const [cur, setCur] = useState(0);
  const [sels, setSels] = useState<Record<string, number>>({});
  const [pics, setPics] = useState<Record<string, number>>({});
  const scrollTo = useCallback((i: number, smooth = true) => {
    window.scrollTo({ top: Math.max(0, Math.min(items.length, i)) * deskStep(), behavior: smooth ? 'smooth' : 'auto' });
  }, [items.length]);
  const desk = useRef<HTMLDivElement>(null);
  const target = useRef(0);
  const lockUntil = useRef(0);
  const lastWheel = useRef(0);
  const acc = useRef(0);
  const tail = useRef(false);
  const step = useCallback((dir: 1 | -1) => {
    const from = performance.now() < lockUntil.current ? target.current : Math.round(window.scrollY / deskStep());
    const i = Math.max(0, Math.min(items.length, from + dir));
    target.current = i; lockUntil.current = performance.now() + 600; acc.current = 0; tail.current = true;
    scrollTo(i, !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, [items.length, scrollTo]);
  useEffect(() => {
    document.documentElement.classList.add('u-snap-y');
    const wheel = (e: WheelEvent) => {
      if (e.ctrlKey || !desk.current?.contains(e.target as Node) || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      e.preventDefault();
      const t = performance.now(); const quiet = t - lastWheel.current > 160; lastWheel.current = t;
      if (quiet) { tail.current = false; acc.current = 0; }
      // locked while the move runs (600ms) and for the rest of that gesture's trackpad momentum (no 160ms pause yet)
      if (t < lockUntil.current || tail.current) return;
      acc.current += e.deltaY;
      if (Math.abs(acc.current) >= 24) step(acc.current > 0 ? 1 : -1);
    };
    const key = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el?.closest('input,textarea,select,[contenteditable],[role="dialog"]') || e.altKey || e.metaKey || e.ctrlKey) return;
      const down = e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey);
      const up = e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey);
      if (!down && !up) return;
      if (e.key === ' ' && el?.closest('button,a')) return;  // Space on a button presses the button
      e.preventDefault();
      if (performance.now() < lockUntil.current - 300) return;  // holding the key: one maker at a time
      step(down ? 1 : -1);
    };
    window.addEventListener('wheel', wheel, { passive: false });
    window.addEventListener('keydown', key);
    return () => { document.documentElement.classList.remove('u-snap-y'); window.removeEventListener('wheel', wheel); window.removeEventListener('keydown', key); };
  }, [step]);
  useEffect(() => {
    let raf = 0; let settle = 0;
    const on = () => {
      cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setCur(Math.round(window.scrollY / deskStep())));
      // never rest between two makers (scrollbar drag, browsers that skip snapping): 180ms after the last scroll
      // event, finish the move to the nearest maker
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        if (performance.now() < lockUntil.current) return;
        const y = window.scrollY, st = deskStep(), i = Math.round(y / st);
        if (Math.abs(y - i * st) > 1 && y < document.documentElement.scrollHeight - window.innerHeight - 1) { target.current = i; lockUntil.current = performance.now() + 600; scrollTo(i); }
      }, 180);
    };
    window.addEventListener('scroll', on, { passive: true }); return () => { window.removeEventListener('scroll', on); cancelAnimationFrame(raf); window.clearTimeout(settle); };
  }, [scrollTo]);
  const curItem = items[Math.min(cur, items.length - 1)];
  const selOf = (it: FeedItem) => Math.min(sels[it.maker.id] ?? firstAvailable(it.products), it.products.length - 1);
  // ← → = this piece's photos
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input,textarea') || !curItem || cur >= items.length) return;
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const n = curItem.products[selOf(curItem)].images.length; const id = curItem.maker.id;
      setPics((x) => ({ ...x, [id]: ((x[id] ?? 0) + (e.key === 'ArrowRight' ? 1 : -1) + n) % n }));
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  });
  useEffect(() => {
    const home = () => { setPics({}); scrollTo(0, false); setCur(0); };
    window.addEventListener('u:home', home); return () => window.removeEventListener('u:home', home);
  }, [scrollTo]);
  const washItem = items[Math.min(cur, items.length - 1)];

  return (
    <>
      <Wash src={washItem?.products[selOf(washItem)]?.images[0]} />
      <div className={s.desk} ref={desk}>
        {items.map((it, i) => (
          <section key={it.maker.id} className={s.dslide} aria-label={it.maker.name}>
            <DeskSlide item={it} next={items[i + 1]} active={i === cur} inBag={inBag}
              sel={selOf(it)} setSel={(n) => { setSels((x) => ({ ...x, [it.maker.id]: n })); setPics((x) => ({ ...x, [it.maker.id]: 0 })); }}
              pic={pics[it.maker.id] ?? 0} setPic={(n) => setPics((x) => ({ ...x, [it.maker.id]: n }))}
              onNext={() => { lockUntil.current = performance.now() + 600; scrollTo(i + 1); }} />
          </section>
        ))}
        <section className={`${s.dslide} ${s.end}`}>
          <span className={`hand ${s.endTitle}`}>You’ve met everyone for now</span>
          <span className="m">New makers join every week.</span>
          <Link href="/explore" className="cta">Explore all pieces</Link>
          <button type="button" className="sec gs" onClick={() => scrollTo(0)}>Back to the top</button>
        </section>
      </div>
    </>
  );
}

function DeskSlide({ item, next, active, inBag, sel, setSel, pic, setPic, onNext }: { item: FeedItem; next?: FeedItem; active: boolean; inBag: Set<string>; sel: number; setSel: (n: number) => void; pic: number; setPic: (n: number) => void; onNext: () => void }) {
  const router = useRouter();
  const add = useAddToBag();
  const [story, setStory] = useState(false);
  const m = item.maker;
  const p = item.products[sel];
  // FIXES 11.3: the first photo is the wide 4:3 hero made for this frame, so the whole piece shows
  const photos = p.hero?.wide ? [p.hero.wide, ...p.images.slice(1)] : p.images;
  const n = photos.length;
  const k = ((pic % n) + n) % n;
  const { mk, up } = stickerPair(item, p);
  const added = inBag.has(p.id);
  const action = () => {
    if (p.sold || p.sizes) return router.push(`/p/${p.id}`);
    if (added) return openBag();
    add(p);
  };
  const label = p.sold ? 'Sold · see similar' : p.heldByOther ? 'In someone’s bag' : added ? 'In your bag' : p.sizes ? 'Choose size' : 'Add to bag';
  const poster = m.video?.posterUrl ?? m.portraitUrl;
  return (
    <div className={s.dgrid}>
      {/* the piece: big photo, nothing over it but one sticker, arrows and dots */}
      <div className={s.dphoto}>
        <Link href={`/p/${p.id}`} aria-label={`Open ${p.title}`} className={s.dphotoLink}>
          {photos.map((u, i) => <Img key={u + i} src={u} alt={i === k ? `${p.title} by ${m.name}` : ''} eager={active && i === 0} className={`${s.dimg} ${i === k ? s.dimgOn : ''}`} />)}
        </Link>
        {mk ? <span className={s.dstk}><Sticker k={mk} city={m.city} width={150} /></span> : up ? <span className={s.dstk}><Sticker k={up} width={150} tilt={6} /></span> : null}
        {n > 1 ? (
          <>
            <button type="button" className={`ic gs ${s.dprev}`} aria-label="Previous photo" onClick={() => setPic(k - 1)}><Back size={18} /></button>
            <button type="button" className={`ic gs ${s.dnext}`} aria-label="Next photo" onClick={() => setPic(k + 1)}><Chevron size={18} /></button>
            <div className={s.ddots}>{photos.map((_, i) => <button key={i} type="button" aria-label={`Photo ${i + 1} of ${n}`} aria-current={i === k} className={i === k ? s.on : ''} onClick={() => setPic(i)} />)}</div>
          </>
        ) : null}
        {story ? (
          <div className={`${s.dstory} u-fade-in`} role="dialog" aria-label={`${m.name} at work`}>
            <Img src={poster} alt={`${m.name} at work`} className={s.dstoryImg} />
            {m.video ? <><p className={s.dcaption}><span>“{m.video.caption}”</span></p><div className={s.dprog}><span style={{ animationDuration: `${m.video.seconds}s` }} /></div></> : null}
            <button type="button" className={`ic gs ${s.dstoryClose}`} aria-label="Close her story" onClick={() => setStory(false)}><Icon name="close" /></button>
          </div>
        ) : null}
      </div>
      {/* the card */}
      <div className={`g ${s.dside}`}>
        <div className={s.dwho}>
          <Link href={`/m/${m.slug}`} className={s.dwhoLink} aria-label={`${m.name}’s profile`}>
            <Img small src={m.portraitUrl} alt="" className={`u-avatar ${s.dav}`} />
            <span className="grow minw0"><span className={`hand ${s.dname}`}>{m.name}</span><span className="m t-small">{item.reason === 'surprise' ? 'Picked for you · new to you' : makerMeta(m)}</span></span>
          </Link>
          <FollowButton m={m} className={`sec gs ${s.dfollow}`} />
        </div>
        <div className={s.ddiv} />
        <Link href={`/p/${p.id}`} className={s.dtitleRow}><h2 className={`hand ${s.dtitle}`}>{p.title}</h2><span className={s.dprice}>{formatEUR(p.priceCents)}</span></Link>
        <span className={`m ${s.dmeta}`}>{pieceMeta(p)}</span>
        {item.reason === 'surprise' ? <span className={`m t-small ${s.dwhy}`}>Outside what you picked. Something new we think you might like.</span> : null}
        <div className={s.dacts}>
          <button type="button" className="cta" onClick={action} disabled={!!p.heldByOther && !p.sold}><span key={label} className="u-fade-in row gap-8">{label}{added ? <Icon name="check" size={16} /> : null}</span></button>
          <SaveButton p={p} className="ic gs" />
        </div>
        <button type="button" className={`gs ${s.dvideo}`} onClick={() => setStory(true)}>
          <span className={s.dvthumb}><Img small src={poster} alt="" className="u-cover" /><span className={s.dvplay}><Icon name="play" size={14} /></span></span>
          <span className="grow minw0 flex col"><span className="fw600 t-small">Watch {m.name} at work</span><span className="m t-meta">{m.video ? `Her story · ${Math.floor(m.video.seconds / 60)}:${String(m.video.seconds % 60).padStart(2, '0')}` : 'Her story · photo'}</span></span>
        </button>
        <div className={s.dmoreHead}>
          <span className="lbl">More from {m.name}</span>
          {item.reason === 'surprise' ? <button type="button" className="link m t-small" onClick={() => hideMaker(m.id)}>Not for me</button> : <Link href={`/m/${m.slug}`} className="link m t-small">Her profile →</Link>}
        </div>
        <div className={s.dthumbs}>
          {item.products.slice(0, 4).map((x, i) => (
            <button key={x.id} type="button" className={s.dthumb} aria-pressed={i === sel} aria-label={`${x.title}, ${formatEUR(x.priceCents)}`} onClick={() => setSel(i)}>
              <Img small src={x.images[0]} alt="" className="u-cover" />
            </button>
          ))}
        </div>
        <div className="grow" />
        {next ? (
          <button type="button" className={s.dnextMaker} onClick={onNext}>
            <Img small src={next.maker.portraitUrl} alt="" className="u-avatar" />
            <span className="grow minw0 flex col"><span className="m t-meta">Next maker · {CATEGORY_LABEL[next.maker.categories[0]]}</span><span className={`hand ${s.dnextName}`}>{next.maker.name}</span></span>
            <span className="m t-small row gap-4">Scroll<Icon name="arrow-down" size={14} /></span>
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** 03 Discover. First visit goes to the welcome screen. Phone: v3 feed (P9). Desktop: P7. */
export default function Discover() {
  const router = useRouter();
  const [me] = useData(getMe);
  const [items] = useData(getFeed);
  const [bag] = useData(getBag);
  const desktop = useIsDesktop();
  useEffect(() => { if (me && !me.onboarded) router.replace('/welcome'); }, [me, router]);
  const inBag = useMemo(() => new Set((bag?.groups ?? []).flatMap((g) => g.lines.map((l) => l.productId))), [bag]);
  const [firstVisit] = useState(() => true);
  // FIXES 10.5: the order of makers is decided once, when Discover opens, and stays frozen until a reload.
  // Follow / unfollow, save and add to bag only update the data of the makers already on screen (mapped by id),
  // so nothing reorders or remounts. Only "Not for me" (hideMaker) removes a maker.
  const order = useRef<string[] | null>(null);
  const feed = useMemo(() => {
    if (!items) return items;
    if (!order.current) order.current = items.map((x) => x.maker.id);
    const byId = new Map(items.map((x) => [x.maker.id, x]));
    return order.current.map((id) => byId.get(id)).filter(Boolean) as FeedItem[];
  }, [items]);
  if (!me || !me.onboarded || !feed || desktop === undefined) return <Loading />;
  if (!feed.length) return <Loading />;
  if (desktop) return <DeskStage items={feed} inBag={inBag} />;
  return <PhoneFeed items={feed} inBag={inBag} firstVisit={firstVisit && !me.hintsSeen} />;
}
