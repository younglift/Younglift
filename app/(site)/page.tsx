'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FeedItem, Maker, Product } from '@/lib/types';
import { getBag, getFeed, getMe, hideMaker, markHintsSeen, toggleFollow } from '@/lib/data';
import { formatEUR, shipsLine } from '@/lib/format';
import { useData } from '@/lib/useData';
import { useIsDesktop } from '@/lib/useIsDesktop';
import { SaveButton, useAddToBag } from '@/components/u/Bits';
import { openBag } from '@/components/u/Nav';
import { Back, Chevron } from '@/components/u/Icons';
import MakerProfile, { makerMeta } from '@/components/u/MakerProfile';
import Sticker from '@/components/u/Sticker';
import Loading from '@/components/u/Loading';
import Wash from '@/components/u/Wash';
import s from './discover/discover.module.css';
import Img from '@/components/u/Img';
import { washSrc } from '@/lib/img';

const STEP_LABEL = ['The piece', 'Her story', 'Her profile'];

function pieceMeta(p: Product) {
  const first = p.oneOfAKind ? '1 of 1' : p.madeToOrder ? 'Made to order' : p.subtitle ?? (p.madeCount > 1 ? `${p.freeStock ?? p.stock} left` : '');
  return [first, p.materials.join(' & '), p.sold ? 'Sold' : shipsLine(p)].filter(Boolean).join(' · ');
}
const firstAvailable = (ps: Product[]) => Math.max(0, ps.findIndex((p) => !p.sold));

/** Name, price, Add to bag, Save, "More from …" (piece step, phone and desktop). */
function PieceBox({ item, sel, setSel, inBag, desktop, onProfile, active = true }: { item: FeedItem; sel: number; setSel: (i: number) => void; inBag: Set<string>; desktop?: boolean; onProfile: () => void; active?: boolean }) {
  const router = useRouter();
  const add = useAddToBag();
  const p = item.products[sel];
  const m = item.maker;
  const added = inBag.has(p.id);
  const action = () => {
    if (p.sold) return router.push(`/p/${p.id}`);
    if (p.sizes) return router.push(`/p/${p.id}`);
    if (added) return desktop ? openBag() : router.push('/bag');
    add(p);
  };
  const label = p.sold ? 'Sold · see similar' : p.heldByOther ? 'In someone’s bag' : added ? 'In your bag ✓' : p.sizes ? 'Choose size' : 'Add to bag';
  return (
    <div className={`g ${desktop ? s.dcard : s.piece}`}>
      <Link href={`/p/${p.id}`} className={s.head} aria-label={`${p.title}, details`}>
        <span className={s.headText}><span className={`hand ${s.name}`}>{p.title}&nbsp;<span className={s.chev}>›</span></span><span className={`m ${s.meta}`}>{pieceMeta(p)}</span></span>
        <span className={s.price}>{formatEUR(p.priceCents)}</span>
      </Link>
      {item.reason === 'surprise' ? <span className={`m ${s.why}`}>Outside what you picked. Something new we think you might like.</span> : null}
      <div className={s.acts}>
        <button type="button" className="cta" onClick={action} disabled={!!p.heldByOther && !p.sold}><span key={label} className="u-fade-in">{label}</span></button>
        <SaveButton p={p} className="ic gs" />
      </div>
      <div className={s.div} />
      <div className={s.moreHead}>
        <span>More from {m.name}</span>
        {item.reason === 'surprise' ? <button type="button" className={`link m ${s.moreLink}`} onClick={() => hideMaker(m.id)}>Not for me</button>
          : desktop ? <button type="button" className={`link m ${s.moreLink} ${s.plain}`} onClick={onProfile}>See her profile →</button>
            : <span className={`m ${s.moreHint}`}>Tap to see</span>}
      </div>
      <div className={s.thumbs}>
        {item.products.slice(0, 4).map((x, i) => (
          <button key={x.id} type="button" className={s.thumb} aria-pressed={i === sel} aria-label={`${x.title}, ${formatEUR(x.priceCents)}`} onClick={() => setSel(i)}>
            <span className="gs">{active ? <Img small src={x.images[0]} alt="" className="u-cover" /> : null}</span><span>{x.sold ? 'Sold' : formatEUR(x.priceCents)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** One badge per frame (QUALITY 2.8, FIXES 4.3): "Picked for you" on a surprise maker, else her sticker, else ours. */
function stickerPair(item: FeedItem, p: Product) {
  if (item.reason === 'surprise') return { mk: undefined, up: 'picked_for_you' as const };
  return p.stickers?.maker ? { mk: p.stickers.maker, up: undefined } : { mk: undefined, up: p.stickers?.uplift };
}

/** Makers away from the screen render only their photo (no glass, no extra images): FIXES 1.1/1.2. */
function LightCard({ item, index, show }: { item: FeedItem; index: number; show: boolean }) {
  const p = item.products[firstAvailable(item.products)];
  return (
    <section className={s.card} aria-label={`${item.maker.name}, maker ${index + 1}`}>
      {show ? <span className={s.photo}><Img src={p.images[0]} alt="" /></span> : null}
    </section>
  );
}

/** Phone: one maker per screen. */
function MakerCard({ item, next, hints, inBag, onNext, index, active }: { item: FeedItem; next?: Maker; hints: boolean; inBag: Set<string>; onNext: () => void; index: number; active: boolean }) {
  const m = item.maker;
  const [sel, setSel] = useState(() => firstAvailable(item.products));
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const track = useRef<HTMLDivElement>(null);
  const p = item.products[Math.min(sel, item.products.length - 1)];
  const [asked, setAsked] = useState(0); // furthest step asked for (so the profile is ready before the swipe lands)
  const go = (i: number) => { setAsked((a) => Math.max(a, i)); track.current?.scrollTo({ left: i * track.current.clientWidth, behavior: 'smooth' }); };
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
            <Img src={p.images[0]} alt={`${p.title} by ${m.name}`} eager={index === 0} />
            {hints && index === 0 ? <Img src={m.video?.posterUrl ?? m.portraitUrl} alt="" aria-hidden="true" className={s.peek} /> : null}
          </Link>
          {mk ? <span className={s.stk}><Sticker k={mk} city={m.city} width={mk === 'one_of_one' ? 104 : 120} /></span> : null}
          {up && !mk ? <span className={s.stk}><Sticker k={up} width={118} tilt={-8} /></span> : null}
          <PieceBox item={item} sel={sel} setSel={setSel} inBag={inBag} onProfile={() => go(2)} active={active} />
        </div>
        {/* 2 · her story (only for the maker on screen: the next one loads just her piece) */}
        <div className={s.panel}>{active ? (<>
          <Img src={m.video?.posterUrl ?? m.portraitUrl} alt={`${m.name} at work`} className={s.storyPhoto} />
          <div className={s.shade} />
          {m.video ? (
            <>
              <button type="button" className={`ic gs ${s.playBtn}`} aria-label={playing ? 'Pause video' : 'Play video'} onClick={() => setPlaying(!playing)}>{playing ? '❚❚' : '▶'}</button>
              {m.video.hasCaptions ? <p className={s.caption}><span>“{m.video.caption}”</span></p> : null}
              <div className={s.prog}><span style={{ animationDuration: `${m.video.seconds}s`, animationPlayState: playing && step === 1 ? 'running' : 'paused' }} /></div>
            </>
          ) : <span className={`gs ${s.noVideo}`}>Photo · no video yet</span>}
          {hints && index === 0 && step === 1 && next ? (
            <div className={`gs ${s.upnext}`}><Img small src={next.portraitUrl} alt="" className="u-avatar" /><span>Up next · {next.name}</span><span className={`m ${s.moreHint}`}>swipe up ↑</span></div>
          ) : null}
          <div className={`g ${s.mini}`}>
            <Link href={`/p/${p.id}`} aria-label={`Open ${p.title}`} className={s.miniPh}><Img small src={p.images[0]} alt="" /></Link>
            <span className={s.miniText}><span className="hand">{p.title}</span><span className={`num ${s.miniPrice}`}>{formatEUR(p.priceCents)}</span></span>
            <MiniAdd p={p} inBag={inBag} />
          </div>
        </>) : null}</div>
        {/* 3 · her profile */}
        <div className={s.panel}>{active && (step >= 1 || asked >= 2) ? (<>
          <Img src={m.portraitUrl} alt="" className={s.blur} />
          <div className={s.profile}>
            <MakerProfile maker={m} products={item.products} onStory={() => go(1)} next={next ? { maker: next, go: onNext } : undefined} />
          </div>
        </>) : null}</div>
      </div>

      <div className={s.scrim} />
      <div className={s.bars}>
        {STEP_LABEL.map((l, i) => <button key={l} type="button" aria-label={l} aria-current={i === step ? 'step' : undefined} className={i < step ? s.past : ''} onClick={() => go(i)}><span /></button>)}
      </div>
      {step !== 2 ? (
        <div className={`gs ${s.pill}`}>
          <button type="button" onClick={() => go(2)} aria-label={`${m.name}’s profile`} className={s.avBtn}><Img small src={m.portraitUrl} alt="" className="u-avatar" /></button>
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
    <button type="button" className={`cta ${s.miniAdd}`} disabled={!!p.heldByOther}
      onClick={() => (p.sold || p.sizes ? router.push(`/p/${p.id}`) : added ? router.push('/bag') : add(p))}>
      <span key={String(added)} className="u-fade-in">{p.sold ? 'Sold' : added ? 'In bag ✓' : p.sizes ? 'Size' : 'Add'}</span>
    </button>
  );
}

/** Desktop: the same vertical feed as phone. Scroll (wheel / trackpad / ↓) snaps to the next maker;
    ← → through her steps: piece → her story → her profile. */
function DeskStage({ items, inBag }: { items: FeedItem[]; inBag: Set<string> }) {
  const feed = useRef<HTMLDivElement>(null);
  const [cur, setCur] = useState(0);
  const [steps, setSteps] = useState<Record<string, number>>({});
  const [sels, setSels] = useState<Record<string, number>>({});
  const stepOf = (id: string) => steps[id] ?? 0;
  const setStep = useCallback((id: string, n: number) => setSteps((x) => ({ ...x, [id]: Math.max(0, Math.min(2, n)) })), []);
  // Own animation instead of the browser's slow 'smooth' scroll: 320ms, fast start, soft stop (--u-ease feel).
  const anim = useRef(0);
  const sliding = useRef(false);
  const scrollTo = useCallback((i: number, smooth = true) => {
    const f = feed.current; if (!f) return;
    const to = Math.max(0, Math.min(items.length, i)) * f.clientHeight;
    cancelAnimationFrame(anim.current);
    if (!smooth || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { f.scrollTop = to; return; }
    const from = f.scrollTop, t0 = performance.now(), dur = 280;
    f.style.scrollSnapType = 'none'; sliding.current = true;
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      f.scrollTop = from + (to - from) * e;
      if (k < 1) anim.current = requestAnimationFrame(tick);
      // React work (mounting the next maker, photo change) waits until the slide has landed, so the motion never stutters.
      else { f.style.scrollSnapType = ''; sliding.current = false; setCur(Math.round(to / f.clientHeight)); }
    };
    anim.current = requestAnimationFrame(tick);
  }, [items.length]);
  const onScroll = () => { const f = feed.current; if (!f || sliding.current) return; const i = Math.round(f.scrollTop / f.clientHeight); if (i !== cur) setCur(i); };
  const curId = items[Math.min(cur, items.length - 1)]?.maker.id;
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input,textarea') || !curId) return;
      const st = steps[curId] ?? 0;
      if (e.key === 'ArrowRight') setStep(curId, st + 1);
      else if (e.key === 'ArrowLeft') setStep(curId, st - 1);
      else if ((e.key === 'ArrowDown' || e.key === 'PageDown') && st !== 2) { e.preventDefault(); scrollTo(cur + 1); }
      else if ((e.key === 'ArrowUp' || e.key === 'PageUp') && st !== 2) { e.preventDefault(); scrollTo(cur - 1); }
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [cur, curId, steps, setStep, scrollTo]);
  // Mouse wheel / touchpad anywhere on the page (also over the top bar): one gesture = one maker, up or down.
  // A new swipe always counts: a pause, a change of direction or a speed-up. A swipe that starts while the
  // previous slide is still moving is queued and runs the moment it lands. The fading tail of the same swipe
  // (touchpad momentum) is ignored, so one swipe never skips two makers. Her profile (step 3) scrolls inside.
  useEffect(() => {
    let acc = 0, busyUntil = 0, last = 0, lastSign = 0, peak = 0, trough = 0, needFresh = false, queued = 0, timer = 0;
    const go = (dir: number) => {
      const f = feed.current; if (!f) return;
      acc = 0; needFresh = true; busyUntil = performance.now() + 280;
      scrollTo(Math.round(f.scrollTop / f.clientHeight) + dir);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => { if (queued) { const d = queued; queued = 0; go(d); } }, 290);
    };
    const w = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX) || e.ctrlKey) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest('[data-own-scroll],.u-drawer,.u-sheet,.u-scrim,[role="dialog"],input,textarea,select')) return;
      e.preventDefault();
      const now = performance.now(), abs = Math.abs(e.deltaY), sign = Math.sign(e.deltaY);
      // new swipe = a pause, the other direction, or speeding up again after this swipe had slowed down
      const fresh = now - last > 80 || sign !== lastSign || (trough < peak * 0.6 && abs > trough * 1.5 + 4);
      if (fresh) { peak = abs; trough = abs; } else { if (abs > peak) { peak = abs; trough = abs; } else if (abs < trough) trough = abs; }
      last = now; lastSign = sign;
      if (fresh) {
        needFresh = false;
        if (now < busyUntil) { queued = sign; needFresh = true; return; }
      }
      if (now < busyUntil || needFresh) return;
      acc += e.deltaY;
      if (Math.abs(acc) >= 15) go(sign);
    };
    window.addEventListener('wheel', w, { passive: false });
    return () => { window.removeEventListener('wheel', w); window.clearTimeout(timer); };
  }, [scrollTo]);
  // Logo / Discover tapped while already here: back to the very start of the feed.
  useEffect(() => {
    const home = () => { setSteps({}); scrollTo(0, false); setCur(0); };
    window.addEventListener('u:home', home); return () => window.removeEventListener('u:home', home);
  }, [scrollTo]);
  const washItem = items[Math.min(cur, items.length - 1)];

  return (
    <>
      <Wash src={washItem?.products[firstAvailable(washItem.products)]?.images[0]} />
      <div className={s.desk} ref={feed} onScroll={onScroll}>
        {items.map((it, i) => (
          <section key={it.maker.id} className={s.dslide} aria-label={it.maker.name}>
            {Math.abs(i - cur) <= 2 ? (
              <DeskSlide item={it} active={i === cur} step={stepOf(it.maker.id)} setStep={(n) => setStep(it.maker.id, n)}
                sel={sels[it.maker.id] ?? firstAvailable(it.products)} setSel={(n) => setSels((x) => ({ ...x, [it.maker.id]: n }))} inBag={inBag} />
            ) : <div className={s.stage} />}
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

function DeskSlide({ item, active, step, setStep, sel, setSel, inBag }: { item: FeedItem; active: boolean; step: number; setStep: (n: number) => void; sel: number; setSel: (n: number) => void; inBag: Set<string> }) {
  const [playing, setPlaying] = useState(true);
  const m = item.maker;
  const p = item.products[Math.min(sel, item.products.length - 1)];
  const { mk, up } = stickerPair(item, p);
  const bg = step === 0 ? p.images[0] : m.video?.posterUrl ?? m.portraitUrl;
  return (
    <div className={s.stage}>
      {step === 0 ? <Link key={`p0${p.id}`} href={`/p/${p.id}`} aria-label={`Open ${p.title}`} className={`${s.stagePhoto} u-fade-in`}><img src={washSrc(bg)} alt="" aria-hidden="true" decoding="async" className={`${s.stageBlur} ${washSrc(bg).startsWith('/img/w/') ? s.baked : ''}`} /><Img src={bg} alt={`${p.title} by ${m.name}`} eager={active} className={s.stageImg} /></Link> : null}
      {step === 1 ? <Img key={`s1${m.id}`} src={bg} alt={`${m.name} at work`} className="u-fade-in" /> : null}
      {step < 2 ? <div className={s.stageShade} /> : null}
      {step === 2 ? <div key={`s2${m.id}`} className={`${s.dprofile} u-step-in`} data-own-scroll><MakerProfile maker={m} products={item.products} desktop onStory={() => setStep(1)} /></div> : null}
      <div className={s.dbars}>{[0, 1, 2].map((i) => <span key={i} className={i <= step ? s.on : ''} />)}</div>
      {step < 2 ? (
        <div className={`gs ${s.dpill}`}>
          <button type="button" className={s.dpillWho} onClick={() => setStep(2)} aria-label={`${m.name}’s profile`}>
            <Img small src={m.portraitUrl} alt="" className="u-avatar" />
            <span className={s.dpillText}><span className="hand">{m.name}</span><span className="m">{item.reason === 'surprise' ? 'Picked for you · new to you' : makerMeta(m)}</span></span>
          </button>
          <button type="button" className={s.follow} aria-pressed={!!m.isFollowing} onClick={() => toggleFollow(m.id)}>{m.isFollowing ? 'Following' : 'Follow'}</button>
        </div>
      ) : null}
      <span className={`gs ${s.dstep}`}>{step + 1} / 3 · {STEP_LABEL[step]}</span>
      {step === 0 && mk ? <span className={s.dstk}><Sticker k={mk} city={m.city} width={150} /></span> : null}
      {step === 0 && up && !mk ? <span className={s.dstk}><Sticker k={up} width={150} tilt={-8} /></span> : null}
      {step > 0 ? <button type="button" aria-label="Previous" className={`ic gs ${s.prev}`} onClick={() => setStep(step - 1)}><Back /></button> : null}
      {step < 2 ? <button type="button" aria-label={step === 0 ? 'Next: her story' : 'Next: her profile'} className={`ic gs ${s.nextBtn}`} onClick={() => setStep(step + 1)}><Chevron /></button> : null}
      {step === 0 ? <PieceBox key={`p${m.id}`} item={item} sel={sel} setSel={setSel} inBag={inBag} desktop onProfile={() => setStep(2)} /> : null}
      {step === 1 ? (
        m.video ? (
          <>
            <p className={s.dcaption}><span>“{m.video.caption}”</span></p>
            <div className={s.dprog}><span style={{ animationDuration: `${m.video.seconds}s`, animationPlayState: playing && active ? 'running' : 'paused' }} /></div>
            <button type="button" className={`ic gs ${s.dplay}`} aria-label={playing ? 'Pause video' : 'Play video'} onClick={() => setPlaying(!playing)}>{playing ? '❚❚' : '▶'}</button>
          </>
        ) : <span className={`gs ${s.dnoVideo}`}>Photo · no video yet</span>
      ) : null}
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
  const desktop = useIsDesktop();
  const [cur, setCur] = useState(0);
  useEffect(() => { if (me && !me.onboarded) router.replace('/welcome'); }, [me, router]);
  const inBag = useMemo(() => new Set((bag?.groups ?? []).flatMap((g) => g.lines.map((l) => l.productId))), [bag]);
  if (!me || !me.onboarded || !items || desktop === undefined) return <Loading />;
  if (desktop) return items.length ? <DeskStage items={items} inBag={inBag} /> : <Loading />;
  const scrollTo = (i: number) => feed.current?.scrollTo({ top: i * feed.current.clientHeight, behavior: 'smooth' });
  const onFeedScroll = () => { const f = feed.current; if (!f) return; const i = Math.round(f.scrollTop / f.clientHeight); if (i !== cur) setCur(i); };
  const wash = items[Math.min(cur, items.length - 1)];

  return (
    <>
      <Wash src={wash?.products[firstAvailable(wash.products)]?.images[0]} />
      <div className={s.feed} ref={feed} onScroll={onFeedScroll}>
        {items.map((it, i) => (i === cur || i === cur + 1
          ? <MakerCard key={it.maker.id} item={it} index={i} active={i === cur} next={items[i + 1]?.maker} hints={!me.hintsSeen} inBag={inBag} onNext={() => scrollTo(i + 1)} />
          : <LightCard key={it.maker.id} item={it} index={i} show={i === cur - 1} />))}
        <div className={s.end}>
          <span className={`hand ${s.endTitle}`}>You’ve met everyone for now</span>
          <span className="m">New makers join every week.</span>
          <Link href="/explore" className="cta">Explore all pieces</Link>
          <button type="button" className="sec gs" onClick={() => scrollTo(0)}>Back to the top</button>
        </div>
      </div>
    </>
  );
}
