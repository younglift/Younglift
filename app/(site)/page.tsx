'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FeedItem, Maker, Product } from '@/lib/types';
import { getBag, getFeed, getMe, hideMaker, markHintsSeen, toggleFollow } from '@/lib/data';
import { formatEUR, shipsLine } from '@/lib/format';
import { useData } from '@/lib/useData';
import { SaveButton, useAddToBag } from '@/components/u/Bits';
import { Back, Chevron } from '@/components/u/Icons';
import MakerProfile, { makerMeta } from '@/components/u/MakerProfile';
import Sticker from '@/components/u/Sticker';
import Loading from '@/components/u/Loading';
import Wash from '@/components/u/Wash';
import s from './discover/discover.module.css';

const STEP_LABEL = ['The piece', 'Her story', 'Her profile'];

function pieceMeta(p: Product) {
  const first = p.oneOfAKind ? '1 of 1' : p.madeToOrder ? (p.sizes ? 'Made to size' : 'Made to order') : p.subtitle ?? (p.madeCount > 1 ? `${p.stock} left` : '');
  return [first, p.materials.join(' & '), p.sold ? 'Sold' : shipsLine(p)].filter(Boolean).join(' · ');
}
const firstAvailable = (ps: Product[]) => Math.max(0, ps.findIndex((p) => !p.sold));

/** Name, price, Add to bag, Save, "More from …" (piece step, phone and desktop). */
function PieceBox({ item, sel, setSel, inBag, desktop, onProfile }: { item: FeedItem; sel: number; setSel: (i: number) => void; inBag: Set<string>; desktop?: boolean; onProfile: () => void }) {
  const router = useRouter();
  const add = useAddToBag();
  const p = item.products[sel];
  const m = item.maker;
  const added = inBag.has(p.id);
  const action = () => {
    if (p.sold) return router.push(`/p/${p.id}`);
    if (p.sizes) return router.push(`/p/${p.id}`);
    if (!added) add(p);
  };
  const label = p.sold ? 'Sold · see similar' : p.heldByOther ? 'In someone’s bag' : added ? 'In your bag ✓' : p.sizes ? 'Choose size' : 'Add to bag';
  return (
    <div className={`g ${desktop ? s.dcard : s.piece}`}>
      <Link href={`/p/${p.id}`} className={s.head} aria-label={`${p.title}, details`}>
        <span style={{ minWidth: 0 }}><span className={`hand ${s.name}`}>{p.title} <span className={s.chev}>›</span></span><span className={`m ${s.meta}`}>{pieceMeta(p)}</span></span>
        <span className={s.price}>{formatEUR(p.priceCents)}</span>
      </Link>
      {item.reason === 'surprise' ? <span className={`m ${s.why}`}>Outside what you picked. Something new we think you might like.</span> : null}
      <div className={s.acts}>
        <button type="button" className="cta" onClick={action} disabled={!!p.heldByOther && !p.sold}>{label}</button>
        <SaveButton p={p} className="ic gs" />
      </div>
      <div className={s.div} />
      <div className={s.moreHead}>
        <span>More from {m.name}</span>
        {item.reason === 'surprise' ? <button type="button" className="link m" style={{ fontSize: 12 }} onClick={() => hideMaker(m.id)}>Not for me</button>
          : desktop ? <button type="button" className="link m" style={{ fontSize: 12, textDecoration: 'none' }} onClick={onProfile}>See her profile →</button>
            : <span className="m" style={{ fontWeight: 400 }}>Tap to see</span>}
      </div>
      <div className={s.thumbs}>
        {item.products.slice(0, 6).map((x, i) => (
          <button key={x.id} type="button" className={s.thumb} aria-pressed={i === sel} aria-label={`${x.title}, ${formatEUR(x.priceCents)}`} onClick={() => setSel(i)}>
            <span className="gs"><img src={x.images[0]} alt="" className="u-cover" /></span><span>{x.sold ? 'Sold' : formatEUR(x.priceCents)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function stickerPair(item: FeedItem, p: Product) {
  const up = item.reason === 'surprise' ? 'picked_for_you' : p.stickers?.uplift;
  return { mk: p.stickers?.maker, up };
}

/** Phone: one maker per screen. */
function MakerCard({ item, next, hints, inBag, onNext, index }: { item: FeedItem; next?: Maker; hints: boolean; inBag: Set<string>; onNext: () => void; index: number }) {
  const m = item.maker;
  const [sel, setSel] = useState(() => firstAvailable(item.products));
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const track = useRef<HTMLDivElement>(null);
  const p = item.products[Math.min(sel, item.products.length - 1)];
  const go = (i: number) => track.current?.scrollTo({ left: i * track.current.clientWidth, behavior: 'smooth' });
  const onScroll = () => {
    const t = track.current; if (!t) return;
    const i = Math.round(t.scrollLeft / t.clientWidth);
    if (i !== step) { setStep(i); if (i > 0) markHintsSeen(); }
  };
  const { mk, up } = stickerPair(item, p);
  const sub = item.reason === 'surprise' ? `${m.city} · ${makerMeta(m).split(' · ')[1]} · new to you` : [makerMeta(m), `Her story · 0:${String(m.video?.seconds ?? 0).padStart(2, '0')}`, `Profile · ${item.products.length} pieces`][step];

  return (
    <section className={s.card} aria-label={`${m.name}, maker ${index + 1}`}>
      <div className={s.track} ref={track} onScroll={onScroll}>
        {/* 1 · the piece */}
        <div className={s.panel}>
          <Link href={`/p/${p.id}`} aria-label={`Open ${p.title}`} className={`${s.photo} ${hints && index === 0 ? s.nudge : ''}`}>
            <img src={p.images[0]} alt={`${p.title} by ${m.name}`} />
            <img src={m.video?.posterUrl ?? m.portraitUrl} alt="" aria-hidden="true" className={s.peek} />
          </Link>
          {mk ? <span className={s.stk}><Sticker k={mk} city={m.city} width={mk === 'one_of_one' ? 104 : 120} /></span> : null}
          {up ? <span className={mk ? s.stk2 : s.stk}><Sticker k={up} width={118} tilt={mk ? 6 : -8} /></span> : null}
          <PieceBox item={item} sel={sel} setSel={setSel} inBag={inBag} onProfile={() => go(2)} />
        </div>
        {/* 2 · her story */}
        <div className={s.panel}>
          <img src={m.video?.posterUrl ?? m.portraitUrl} alt={`${m.name} at work`} className={s.photo} style={{ objectFit: 'cover', objectPosition: 'center 30%', width: '100%', height: '100%' }} />
          <div className={s.shade} />
          {m.video ? (
            <>
              <button type="button" className={`ic gs ${s.playBtn}`} aria-label={playing ? 'Pause video' : 'Play video'} onClick={() => setPlaying(!playing)}>{playing ? '❚❚' : '▶'}</button>
              {m.video.hasCaptions ? <p className={s.caption}><span>“{m.video.caption}”</span></p> : null}
              <div className={s.prog}><span style={{ animationDuration: `${m.video.seconds}s`, animationPlayState: playing && step === 1 ? 'running' : 'paused' }} /></div>
            </>
          ) : <span className={`gs ${s.noVideo}`}>Photo · no video yet</span>}
          {hints && index === 0 && step === 1 && next ? (
            <div className={`gs ${s.upnext}`}><img src={next.portraitUrl} alt="" className="u-avatar" /><span>Up next · {next.name}</span><span className="m" style={{ fontWeight: 400 }}>swipe up ↑</span></div>
          ) : null}
          <div className={`g ${s.mini}`}>
            <Link href={`/p/${p.id}`} aria-label={`Open ${p.title}`} style={{ lineHeight: 0 }}><img src={p.images[0]} alt="" style={{ width: 52, height: 52, borderRadius: 14, objectFit: 'cover', display: 'block' }} /></Link>
            <span style={{ flex: 1, minWidth: 0 }}><span className="hand">{p.title}</span><span style={{ font: '600 15px var(--u-ui)' }}>{formatEUR(p.priceCents)}</span></span>
            <MiniAdd p={p} inBag={inBag} />
          </div>
        </div>
        {/* 3 · her profile */}
        <div className={s.panel}>
          <img src={m.portraitUrl} alt="" className={s.blur} />
          <div className={s.profile}>
            <MakerProfile maker={m} products={item.products} onStory={() => go(1)} next={next ? { maker: next, go: onNext } : undefined} />
          </div>
        </div>
      </div>

      <div className={s.scrim} />
      <div className={s.bars}>
        {STEP_LABEL.map((l, i) => <button key={l} type="button" aria-label={l} aria-current={i === step ? 'step' : undefined} className={i < step ? s.past : ''} onClick={() => go(i)}><span /></button>)}
      </div>
      {step !== 2 ? (
        <div className={`gs ${s.pill}`}>
          <button type="button" onClick={() => go(2)} aria-label={`${m.name}’s profile`} style={{ padding: 0, border: 0, background: 'none', lineHeight: 0, cursor: 'pointer' }}><img src={m.portraitUrl} alt="" className="u-avatar" /></button>
          <span className={s.txt}><span className="hand">{m.name}</span><span className="m">{sub}</span></span>
          <button type="button" className={s.follow} aria-pressed={!!m.isFollowing} onClick={() => toggleFollow(m.id)}>{m.isFollowing ? 'Following' : 'Follow'}</button>
        </div>
      ) : null}
    </section>
  );
}

function MiniAdd({ p, inBag }: { p: Product; inBag: Set<string> }) {
  const add = useAddToBag(); const router = useRouter();
  const added = inBag.has(p.id);
  return (
    <button type="button" className="cta" style={{ padding: '0 18px', minHeight: 42 }} disabled={!!p.heldByOther}
      onClick={() => (p.sold || p.sizes ? router.push(`/p/${p.id}`) : !added && add(p))}>
      {p.sold ? 'Sold' : added ? 'Added ✓' : p.sizes ? 'Size' : 'Add'}
    </button>
  );
}

/** Desktop: a big stage, ← → through her steps, ↓ next maker. */
function DeskStage({ items, inBag }: { items: FeedItem[]; inBag: Set<string> }) {
  const [mi, setMi] = useState(0);
  const [step, setStep] = useState(0);
  const [sels, setSels] = useState<Record<string, number>>({});
  const [playing, setPlaying] = useState(true);
  const item = items[Math.min(mi, items.length - 1)];
  const m = item.maker;
  const sel = sels[m.id] ?? firstAvailable(item.products);
  const p = item.products[Math.min(sel, item.products.length - 1)];
  const nextMaker = useCallback((d: number) => { setMi((i) => (i + d + items.length) % items.length); setStep(0); }, [items.length]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input,textarea')) return;
      if (e.key === 'ArrowRight') setStep((x) => Math.min(2, x + 1));
      else if (e.key === 'ArrowLeft') setStep((x) => Math.max(0, x - 1));
      else if (e.key === 'ArrowDown' && step !== 2) { e.preventDefault(); nextMaker(1); }
      else if (e.key === 'ArrowUp' && step !== 2) { e.preventDefault(); nextMaker(-1); }
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [nextMaker, step]);
  const { mk, up } = stickerPair(item, p);
  const bg = step === 0 ? p.images[0] : m.video?.posterUrl ?? m.portraitUrl;

  return (
    <div className={s.desk}>
      <div className={s.stage}>
        {step === 0 ? <Link href={`/p/${p.id}`} aria-label={`Open ${p.title}`} style={{ position: 'absolute', inset: 0, zIndex: 1 }}><img src={bg} alt={`${p.title} by ${m.name}`} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 45%' }} /></Link> : null}
        {step === 1 ? <img src={bg} alt={`${m.name} at work`} /> : null}
        {step < 2 ? <div className={s.stageShade} /> : null}
        {step === 2 ? <div className={s.dprofile}><MakerProfile maker={m} products={item.products} desktop onStory={() => setStep(1)} /></div> : null}
        <div className={s.dbars}>{[0, 1, 2].map((i) => <span key={i} className={i <= step ? s.on : ''} />)}</div>
        {step < 2 ? (
          <div className={`gs ${s.dpill}`}>
            <img src={m.portraitUrl} alt="" className="u-avatar" />
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25, paddingRight: 6 }}><span className="hand" style={{ fontSize: 16 }}>{m.name}</span><span className="m" style={{ fontSize: 12 }}>{item.reason === 'surprise' ? 'Picked for you · new to you' : makerMeta(m)}</span></span>
            <button type="button" className={s.follow} aria-pressed={!!m.isFollowing} onClick={() => toggleFollow(m.id)}>{m.isFollowing ? 'Following' : 'Follow'}</button>
          </div>
        ) : null}
        <span className={`gs ${s.dstep}`}>{step + 1} / 3 · {STEP_LABEL[step]}</span>
        {step === 0 && mk ? <span className={s.dstk}><Sticker k={mk} city={m.city} width={150} /></span> : null}
        {step === 0 && up ? <span className={mk ? s.dstk2 : s.dstk}><Sticker k={up} width={150} tilt={mk ? 6 : -8} /></span> : null}
        {step > 0 ? <button type="button" aria-label="Previous" className={`ic gs ${s.prev}`} onClick={() => setStep(step - 1)}><Back /></button> : null}
        {step < 2 ? <button type="button" aria-label={step === 0 ? 'Next: her story' : 'Next: her profile'} className={`ic gs ${s.nextBtn}`} onClick={() => setStep(step + 1)}><Chevron /></button> : null}
        {step === 0 ? <PieceBox item={item} sel={sel} setSel={(i) => setSels({ ...sels, [m.id]: i })} inBag={inBag} desktop onProfile={() => setStep(2)} /> : null}
        {step === 1 ? (
          m.video ? (
            <>
              <p className={s.dcaption}><span>“{m.video.caption}”</span></p>
              <div className={s.dprog}><span style={{ animationDuration: `${m.video.seconds}s`, animationPlayState: playing ? 'running' : 'paused' }} /></div>
              <button type="button" className="ic gs" aria-label={playing ? 'Pause video' : 'Play video'} style={{ position: 'absolute', right: 24, bottom: 24, zIndex: 3 }} onClick={() => setPlaying(!playing)}>{playing ? '❚❚' : '▶'}</button>
            </>
          ) : <span className="gs" style={{ position: 'absolute', right: 24, bottom: 24, zIndex: 3, borderRadius: 999, padding: '7px 14px', fontSize: 12 }}>Photo · no video yet</span>
        ) : null}
      </div>
      <div className={s.upnextRow}>
        <span className="m" style={{ fontSize: 13, marginRight: 6 }}>Up next</span>
        <div className={s.upnextList}>
        {items.map((x, i) => (
          <button key={x.maker.id} type="button" className={i === mi ? 'g' : 'gs'} aria-pressed={i === mi} onClick={() => { setMi(i); setStep(0); }}>
            <img src={x.maker.portraitUrl} alt="" className="u-avatar" /><span style={{ font: '600 13px var(--u-ui)' }}>{x.maker.name}</span><span className="m" style={{ fontSize: 12 }}>{makerMeta(x.maker).split(' · ')[1]}</span>
          </button>
        ))}
        </div>
        <span className="m" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>← → photos · ↓ next maker</span>
        <button type="button" className="cta" onClick={() => nextMaker(1)}>Next maker ↓</button>
      </div>
    </div>
  );
}

/** 03 Discover. First visit goes to the welcome screen. */
export default function Discover() {
  const router = useRouter();
  const [me] = useData(getMe);
  const [items] = useData(getFeed);
  const [bag] = useData(getBag);
  const feed = useRef<HTMLDivElement>(null);
  useEffect(() => { if (me && !me.onboarded) router.replace('/welcome'); }, [me, router]);
  const inBag = useMemo(() => new Set((bag?.groups ?? []).flatMap((g) => g.lines.map((l) => l.productId))), [bag]);
  if (!me || !me.onboarded || !items) return <Loading />;
  const scrollTo = (i: number) => feed.current?.scrollTo({ top: i * feed.current.clientHeight, behavior: 'smooth' });

  return (
    <>
      <Wash src={items[0]?.products[0]?.images[0]} />
      <div className={s.feed} ref={feed}>
        {items.map((it, i) => (
          <MakerCard key={it.maker.id} item={it} index={i} next={items[i + 1]?.maker} hints={!me.hintsSeen} inBag={inBag} onNext={() => scrollTo(i + 1)} />
        ))}
        <div className={s.end}>
          <span className="hand" style={{ fontSize: 22 }}>You’ve met everyone for now</span>
          <span className="m">New makers join every week.</span>
          <Link href="/explore" className="cta">Explore all pieces</Link>
          <button type="button" className="sec gs" onClick={() => scrollTo(0)}>Back to the top</button>
        </div>
      </div>
      {items.length ? <DeskStage items={items} inBag={inBag} /> : null}
    </>
  );
}
