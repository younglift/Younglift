'use client';
// Phone Discover v3 (FIXES P9, docs/design/DISCOVER.md §1, spec screens/03-discover-v3.dc.html).
// Up/down = next maker (snap, one per swipe). Sideways = deeper into her: Pieces → Her story → All about her.
// Tap a small piece = it becomes the big piece. Tap the title = details page. Add to bag never moves you.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { FeedItem, Maker, Product } from '@/lib/types';
import { CATEGORY_LABEL, getReviews, markHintsSeen } from '@/lib/data';
import { formatEUR, formatEURExact, shipsLine } from '@/lib/format';
import { useData } from '@/lib/useData';
import { FollowButton, SaveButton, useAddToBag } from '@/components/u/Bits';
import Sticker from '@/components/u/Sticker';
import Img from '@/components/u/Img';
import Icon from '@/components/u/Icon';
import s from './phone.module.css';

const TABS = ['Pieces', 'Her story', 'All about her'];
const firstAvailable = (ps: Product[]) => Math.max(0, ps.findIndex((p) => !p.sold));
/** "pearl drop earrings, chain bracelet": what she makes, for the next-maker line. */
const makes = (it: FeedItem) => it.products.slice(0, 2).map((p) => p.title.toLowerCase()).join(', ');
const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function PhoneFeed({ items, inBag, firstVisit }: { items: FeedItem[]; inBag: Set<string>; firstVisit: boolean }) {
  const feed = useRef<HTMLDivElement>(null);
  const [cur, setCur] = useState(0);
  const onScroll = () => { const f = feed.current; if (!f) return; const i = Math.round(f.scrollTop / f.clientHeight); if (i !== cur) setCur(i); };
  const toMaker = (i: number) => { const f = feed.current; if (f) f.scrollTo({ top: i * f.clientHeight, behavior: reduced() ? 'auto' : 'smooth' }); };
  return (
    <div className={s.feed} ref={feed} onScroll={onScroll}>
      {items.map((it, i) => (
        <section key={it.maker.id} className={s.mk} aria-label={it.maker.name}>
          {Math.abs(i - cur) <= 1
            ? <Maker3 item={it} next={items[i + 1]} inBag={inBag} active={i === cur} bounce={firstVisit && i === 0} onNext={() => toMaker(i + 1)} />
            : <Img small src={it.products[firstAvailable(it.products)]?.images[0]} alt="" className={s.ghost} />}
        </section>
      ))}
      <section className={`${s.mk} ${s.end}`}>
        <span className={`hand ${s.endTitle}`}>You’ve met everyone for now</span>
        <span className="m">New makers join every week.</span>
        <Link href="/explore" className="cta">Explore all pieces</Link>
        <button type="button" className="sec gs" onClick={() => toMaker(0)}>Back to the top</button>
      </section>
    </div>
  );
}

/** One tab row per maker (FIXES 10.1). The underline is moved by the panel scroll every frame (see Maker3). */
function Tabs({ on, go, line, tabRefs }: { on: number; go: (i: number) => void; line: React.Ref<HTMLSpanElement>; tabRefs: React.MutableRefObject<(HTMLButtonElement | null)[]> }) {
  return (
    <div className={s.tabs} role="tablist">
      {TABS.map((t, i) => <button key={t} ref={(el) => { tabRefs.current[i] = el; }} type="button" role="tab" aria-selected={i === on} className={i === on ? s.tabOn : ''} onClick={() => go(i)}>{t}</button>)}
      <span ref={line} className={s.tabLine} aria-hidden="true" />
    </div>
  );
}

function MakerRow({ m, onAbout }: { m: Maker; onAbout: () => void }) {
  return (
    <div className={s.who}>
      <button type="button" className={s.whoBtn} onClick={onAbout} aria-label={`All about ${m.name}`}>
        <Img small src={m.portraitUrl} alt="" className={s.av40} />
        <span className="grow minw0"><span className={`hand ${s.name17}`}>{m.name}</span><span className={s.meta12}>{m.city} · {CATEGORY_LABEL[m.categories[0]]}</span></span>
      </button>
      <FollowButton m={m} className={`sec gs ${s.follow}`} />
    </div>
  );
}

function Maker3({ item, next, inBag, active, bounce, onNext }: { item: FeedItem; next?: FeedItem; inBag: Set<string>; active: boolean; bounce: boolean; onNext: () => void }) {
  const router = useRouter();
  const add = useAddToBag();
  const lay = useRef<HTMLDivElement>(null);
  const [panel, setPanel] = useState(0);
  const [sel, setSel] = useState(() => firstAvailable(item.products));
  const [details, setDetails] = useState(false);
  const [playing, setPlaying] = useState(false);
  const m = item.maker;
  const p = item.products[Math.min(sel, item.products.length - 1)];
  const mk = p.makerSticker;
  const up = p.stickers?.uplift;
  const added = inBag.has(p.id);
  const go = (i: number) => { const l = lay.current; if (l) l.scrollTo({ left: i * l.clientWidth, behavior: reduced() ? 'auto' : 'smooth' }); };
  // FIXES 10.1: one continuous screen. Tabs + maker row are one fixed layer (they never move); on every scroll
  // frame the underline glides between tabs, the panel being left moves at 0.3× and darkens to 60%, the incoming
  // panel slides over it with a shadow on its leading edge, and the small maker row fades out over All about her.
  // FIXES 11.2: the scroll itself is native snap only. Nothing here writes scrollLeft or moves the scroller or a
  // panel; the parallax moves only the layer inside the leaving panel (.panIn), read from scrollLeft in one rAF.
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const line = useRef<HTMLSpanElement>(null);
  const whoRef = useRef<HTMLDivElement>(null);
  const panRefs = useRef<(HTMLDivElement | null)[]>([]);
  const inRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dimRefs = useRef<(HTMLDivElement | null)[]>([]);
  const frame = useRef(0);
  const bounceAnim = useRef<Animation | undefined>(undefined);
  const paint = () => {
    const l = lay.current; if (!l) return;
    const w = l.clientWidth || 1; const pr = Math.max(0, Math.min(2, l.scrollLeft / w));
    const i = Math.min(1, Math.floor(pr)), f = pr - i;
    const a = tabRefs.current[i], b = tabRefs.current[Math.min(2, i + 1)];
    if (a && b && line.current) {
      const x = a.offsetLeft + (b.offsetLeft - a.offsetLeft) * f, lw = a.offsetWidth + (b.offsetWidth - a.offsetWidth) * f;
      line.current.style.transform = `translateX(${x}px)`; line.current.style.width = `${lw}px`;
    }
    if (whoRef.current) { const o = Math.max(0, Math.min(1, 2 - pr)); whoRef.current.style.opacity = String(o); whoRef.current.style.visibility = o < 0.02 ? 'hidden' : 'visible'; }
    if (reduced()) return;
    panRefs.current.forEach((el, j) => {
      if (!el) return; const d = pr - j;
      const inner = inRefs.current[j]; if (inner) inner.style.transform = d > 0 && d < 1 ? `translateX(${d * w * 0.7}px)` : '';
      el.style.boxShadow = d < 0 && d > -1 ? 'var(--u-pan-shadow)' : '';
      const dim = dimRefs.current[j]; if (dim) dim.style.opacity = d > 0 && d < 1 ? String(0.4 * d) : '0';
    });
  };
  const onLay = () => {
    cancelAnimationFrame(frame.current); frame.current = requestAnimationFrame(paint);
    const l = lay.current; if (!l) return; const i = Math.round(l.scrollLeft / l.clientWidth); if (i !== panel) { setPanel(i); if (i !== 1) setPlaying(false); }
  };
  useEffect(() => { paint(); const r = () => paint(); window.addEventListener('resize', r); return () => window.removeEventListener('resize', r); });

  // First visit only: 1.2s after Discover opens the panels bounce left so the next one peeks out. No hint text.
  useEffect(() => {
    if (!bounce || reduced()) return;
    const t = window.setTimeout(() => { bounceAnim.current = lay.current?.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-64px)', offset: 0.3 }, { transform: 'translateX(0)', offset: 0.55 }, { transform: 'translateX(-18px)', offset: 0.75 }, { transform: 'translateX(0)' }], { duration: 1600, easing: 'cubic-bezier(.2,.8,.2,1)' }); markHintsSeen(); }, 1200);
    return () => window.clearTimeout(t);
  }, [bounce]);

  const action = () => {
    if (p.sold || p.sizes) return router.push(`/p/${p.id}`);
    if (!added) add(p);
  };
  const label = p.sold ? 'Sold · see similar' : p.heldByOther ? 'In someone’s bag' : added ? 'In your bag' : p.sizes ? 'Choose size' : 'Add to bag';
  const poster = m.video?.posterUrl ?? m.portraitUrl;

  return (
    <>
      {/* a finger on the panels stops the first-visit bounce at once, so it never fights the swipe */}
      <div className={s.lay} ref={lay} onScroll={onLay} onPointerDown={() => bounceAnim.current?.cancel()} onTouchStart={() => bounceAnim.current?.cancel()}>
        {/* 1 · Pieces */}
        <div className={s.pan} ref={(el) => { panRefs.current[0] = el; }} style={{ zIndex: 1 }}>
          <div className={s.panIn} ref={(el) => { inRefs.current[0] = el; }}>
          {/* FIXES 11.1: one full-screen photo (the tall hero), its centre at the centre of the safe zone */}
          <Img key={`h${p.id}`} src={p.hero?.tall ?? p.images[0]} eager={active} alt={`${p.title} by ${m.name}`} className={`${s.hero} ${s.swap}`} />
          <div className={s.shadeTop} /><div className={s.shadeBottom} />
          {mk ? <span key={`k${p.id}`} className={`${s.stk} ${s.swap}`}><Sticker k={mk} city={m.city} width={104} tilt={6} /></span>
            : up ? <span key={`u${p.id}`} className={`${s.stk} ${s.swap}`}><Sticker k={up} width={104} tilt={6} /></span> : null}
          <div className={`g ${s.bar}`}>
            <button type="button" className={s.barText} onClick={() => setDetails(true)} aria-label={`${p.title}, ${formatEUR(p.priceCents)}. Details`}>
              <span key={`t${p.id}`} className={`hand ${s.barTitle} ${s.swap}`}>{p.title}</span>
              <span className={s.barSub}><b>{formatEUR(p.priceCents)}</b> · Details ›</span>
            </button>
            <button type="button" className={`cta ${s.add}`} onClick={action} disabled={!!p.heldByOther && !p.sold && !added}>
              <span key={label} className="u-fade-in row gap-4">{label}{added ? <Icon name="check" size={16} /> : null}</span>
            </button>
          </div>
          <div className={s.more}>
            {item.products.slice(0, 4).map((x, i) => (
              <button key={x.id} type="button" className={`${s.tb} ${i === sel ? s.tbOn : ''}`} aria-pressed={i === sel} aria-label={`${x.title}, ${formatEUR(x.priceCents)}`} onClick={() => setSel(i)}>
                <Img small src={x.images[0]} alt="" />
              </button>
            ))}
          </div>
          {next ? (
            <button type="button" className={s.nxt} onClick={onNext}>
              <Icon name="arrow-down" size={14} /><span>Next:</span><span className={`hand ${s.nxtName}`}>{next.maker.name}</span><span className="m">· {makes(next)}</span>
            </button>
          ) : null}
          </div>
          <div className={s.dim} ref={(el) => { dimRefs.current[0] = el; }} />
        </div>

        {/* 2 · Her story */}
        <div className={s.pan} ref={(el) => { panRefs.current[1] = el; }} style={{ zIndex: 2 }}>
          <div className={s.panIn} ref={(el) => { inRefs.current[1] = el; }}>
          <Img src={poster} alt={`${m.name} at work`} className={s.fill} />
          <div className={s.shadeTop} /><div className={s.shadeStory} />
          <button type="button" className={s.play} aria-label={playing ? 'Pause her story' : 'Play her story'} onClick={() => setPlaying(!playing)}><Icon name={playing ? 'pause' : 'play'} size={28} /></button>
          <div className={s.quote}>
            <span className="m t-meta">{m.video ? `Her story · ${Math.floor(m.video.seconds / 60)}:${String(m.video.seconds % 60).padStart(2, '0')}` : 'Her story'}</span>
            <p>“{m.video?.caption ?? m.tagline}”</p>
          </div>
          {m.video ? <div className={s.prog}><span style={{ animationDuration: `${m.video.seconds}s`, animationPlayState: playing && panel === 1 && active ? 'running' : 'paused' }} /></div> : null}
          </div>
          <div className={s.dim} ref={(el) => { dimRefs.current[1] = el; }} />
        </div>

        {/* 3 · All about her */}
        <div className={`${s.pan} ${s.panDark}`} ref={(el) => { panRefs.current[2] = el; }} style={{ zIndex: 3 }}>
          {panel === 2 || active ? <About item={item} next={next} onNext={onNext} /> : null}
        </div>
      </div>
      {/* one fixed layer per maker: tabs + maker row never move during a sideways swipe */}
      <div className={s.top}>
        <Tabs on={panel} go={go} line={line} tabRefs={tabRefs} />
        <div ref={whoRef}><MakerRow m={m} onAbout={() => go(2)} /></div>
      </div>
      {/* in <body>, above the bottom nav (the feed is its own stacking layer) */}
      {details ? createPortal(<Details p={p} m={m} added={added} label={label} action={action} onClose={() => setDetails(false)} />, document.body) : null}
    </>
  );
}

function About({ item, next, onNext }: { item: FeedItem; next?: FeedItem; onNext: () => void }) {
  const m = item.maker;
  const [reviews] = useData(() => getReviews(m.id), [m.id]);
  const sold = useMemo(() => item.products.reduce((a, p) => a + (p.madeToOrder ? 0 : Math.max(0, p.madeCount - p.stock)), 0), [item.products]);
  const months = m.liveAt ? Math.max(0, Math.floor((Date.now() - new Date(m.liveAt).getTime()) / (30.44 * 864e5))) : 0;
  const since = months >= 12 ? `${Math.round(months / 12)} ${Math.round(months / 12) === 1 ? 'yr' : 'yrs'}` : months >= 1 ? `${months} mo` : 'New';
  const r = reviews?.[0];
  return (
    <div className={s.prof} data-own-scroll>
      <div className={s.profTop} />
      <div className={s.aboutHead}>
        <Img small src={m.portraitUrl} alt="" className={s.av72} />
        <span className="grow minw0"><span className={`hand ${s.name24}`}>{m.name}</span><span className="m t-small">{m.city} · {CATEGORY_LABEL[m.categories[0]]}</span></span>
      </div>
      <div className={s.aboutActs}>
        <FollowButton m={m} className="cta" />
        <Link href={`/messages/${m.slug}`} className="sec gs">Message</Link>
      </div>
      <div className={s.stats}>
        <div className="gs"><span>{m.rating ? <>{m.rating.avg.toFixed(1)} <Icon name="star" size={13} filled /></> : 'New'}</span><span className="m">{m.rating ? `${m.rating.count} reviews` : 'no reviews yet'}</span></div>
        <div className="gs"><span>{sold}</span><span className="m">sold</span></div>
        <div className="gs"><span>{since}</span><span className="m">on Uplift</span></div>
      </div>
      <div className={`lbl ${s.secLbl}`}>All pieces</div>
      <div className={s.all}>
        {item.products.map((x) => (
          <Link key={x.id} href={`/p/${x.id}`} className={s.allItem}>
            <Img small src={x.images[0]} alt="" />
            <span className={s.allText}><span className="minw0 ellipsis">{x.title}</span><b>{formatEUR(x.priceCents)}</b></span>
          </Link>
        ))}
      </div>
      {r ? (
        <>
          <div className={`lbl ${s.secLbl}`}>Reviews</div>
          <div className={`gs ${s.review}`}><b>{r.who}</b> <span className="accent">{'★'.repeat(r.rating)}</span><br /><span className="m">{r.text}</span></div>
        </>
      ) : null}
      {next ? (
        <button type="button" className={s.upNext} onClick={onNext}>
          <Img small src={next.maker.portraitUrl} alt="" className={s.av44} />
          <span className="grow minw0"><span className="m t-meta">Up next ↓</span><span className={s.upNextLine}><span className={`hand ${s.name16}`}>{next.maker.name}</span> · {makes(next)}</span></span>
        </button>
      ) : <div className={s.upNextSpace} />}
    </div>
  );
}

/** Piece details: full-height page that slides up. ✕, Back / edge-swipe and swipe-down close it and return
    to exactly the same piece and photo (nothing under it changes). */
function Details({ p, m, added, label, action, onClose }: { p: Product; m: Maker; added: boolean; label: string; action: () => void; onClose: () => void }) {
  const page = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  const closing = useRef(false);
  const close = () => { if (closing.current) return; closing.current = true; setOn(false); window.setTimeout(onClose, reduced() ? 0 : 300); };
  useEffect(() => {
    requestAnimationFrame(() => setOn(true));
    window.history.pushState({ uDetails: true }, '');
    const pop = () => close();
    window.addEventListener('popstate', pop);
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') window.history.back(); };
    window.addEventListener('keydown', k);
    return () => { window.removeEventListener('popstate', pop); window.removeEventListener('keydown', k); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // swipe down from the top of the page closes it
  const start = useRef<number | null>(null);
  const facts: [string, string][] = [
    ['Materials', p.materials.join(', ') || '–'],
    [p.sizes?.label ?? 'Size', p.sizes ? p.sizes.options.join(', ') : p.subtitle ?? 'One size'],
    ['Ships', `${shipsLine(p).replace(/^Ships /, '')} · ${formatEURExact(490)}`],
    ['Returns', '14 days, free'],
  ];
  return (
    <div ref={page} role="dialog" aria-modal="true" aria-label={p.title} className={`${s.page} ${on ? s.pageOn : ''}`}
      onTouchStart={(e) => { start.current = page.current && page.current.scrollTop <= 0 ? e.touches[0].clientY : null; }}
      onTouchEnd={(e) => { if (start.current != null && e.changedTouches[0].clientY - start.current > 90) window.history.back(); start.current = null; }}>
      <div className={s.detPhoto}>
        <Img src={p.images[0]} alt={p.title} />
        <button type="button" className={`ic gs ${s.detClose}`} aria-label="Close details" onClick={() => window.history.back()}><Icon name="close" /></button>
      </div>
      <div className={s.detBody}>
        <div className={s.detTitle}><span className={`hand ${s.name22}`}>{p.title}</span><span className={s.detPrice}>{formatEUR(p.priceCents)}</span></div>
        <span className={`m ${s.detMeta}`}>{[p.materials.join(', '), p.sold ? 'Sold' : shipsLine(p)].filter(Boolean).join(' · ')}</span>
        <div className={s.detActs}>
          <button type="button" className="cta" onClick={action}><span className="row gap-4">{label}{added ? <Icon name="check" size={16} /> : null}</span></button>
          <SaveButton p={p} className={`ic gs ${s.detSave}`} />
        </div>
        <div className={s.facts}>{facts.map(([k, v]) => <div key={k} className={s.fact}><span className="m">{k}</span><span>{v}</span></div>)}</div>
        <Link href={`/m/${m.slug}`} className={s.madeBy}><Img small src={m.portraitUrl} alt="" className={s.av32} /><span className="m t-small">Made by <span className="hand">{m.name}</span> · {m.city} · {CATEGORY_LABEL[m.categories[0]]}</span></Link>
      </div>
    </div>
  );
}
