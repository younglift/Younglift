'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FeedItem, Maker, Product } from '@/lib/types';
import { CATEGORY_LABEL, getBag, getFeed, getMe, hideMaker, markHintsSeen, toggleFollow } from '@/lib/data';
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
import Icon from '@/components/u/Icon';

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
              <button type="button" className={`ic gs ${s.playBtn}`} aria-label={playing ? 'Pause video' : 'Play video'} onClick={() => setPlaying(!playing)}><Icon name={playing ? 'pause' : 'play'} size={16} /></button>
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

/** Desktop Discover v2 (FIXES P7, Matas 2026-11-25): one piece per maker. Left: the piece's photos (← →, dots).
    Right: one card with the maker, the piece, Add to bag, her story, more from her, next maker.
    The page scrolls freely like a shop (Justinas 2026-11-25); one maker per screen height. */
function DeskStage({ items, inBag }: { items: FeedItem[]; inBag: Set<string> }) {
  const [cur, setCur] = useState(0);
  const [sels, setSels] = useState<Record<string, number>>({});
  const [pics, setPics] = useState<Record<string, number>>({});
  const scrollTo = useCallback((i: number, smooth = true) => {
    window.scrollTo({ top: Math.max(0, Math.min(items.length, i)) * window.innerHeight, behavior: smooth ? 'smooth' : 'auto' });
  }, [items.length]);
  useEffect(() => {
    let raf = 0;
    const on = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setCur(Math.round(window.scrollY / window.innerHeight))); };
    window.addEventListener('scroll', on, { passive: true }); return () => { window.removeEventListener('scroll', on); cancelAnimationFrame(raf); };
  }, []);
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
      <div className={s.desk}>
        {items.map((it, i) => (
          <section key={it.maker.id} className={s.dslide} aria-label={it.maker.name}>
            <DeskSlide item={it} next={items[i + 1]} active={i === cur} inBag={inBag}
              sel={selOf(it)} setSel={(n) => { setSels((x) => ({ ...x, [it.maker.id]: n })); setPics((x) => ({ ...x, [it.maker.id]: 0 })); }}
              pic={pics[it.maker.id] ?? 0} setPic={(n) => setPics((x) => ({ ...x, [it.maker.id]: n }))}
              onNext={() => scrollTo(i + 1)} />
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
  const n = p.images.length;
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
          {p.images.map((u, i) => <Img key={u + i} src={u} alt={i === k ? `${p.title} by ${m.name}` : ''} eager={active && i === 0} className={`${s.dimg} ${i === k ? s.dimgOn : ''}`} />)}
        </Link>
        {mk ? <span className={s.dstk}><Sticker k={mk} city={m.city} width={150} /></span> : up ? <span className={s.dstk}><Sticker k={up} width={150} tilt={6} /></span> : null}
        {n > 1 ? (
          <>
            <button type="button" className={`ic gs ${s.dprev}`} aria-label="Previous photo" onClick={() => setPic(k - 1)}><Back size={18} /></button>
            <button type="button" className={`ic gs ${s.dnext}`} aria-label="Next photo" onClick={() => setPic(k + 1)}><Chevron size={18} /></button>
            <div className={s.ddots}>{p.images.map((_, i) => <button key={i} type="button" aria-label={`Photo ${i + 1} of ${n}`} aria-current={i === k} className={i === k ? s.on : ''} onClick={() => setPic(i)} />)}</div>
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
          <button type="button" className={`sec gs ${s.dfollow}`} aria-pressed={!!m.isFollowing} onClick={() => toggleFollow(m.id)}>{m.isFollowing ? 'Following' : 'Follow'}</button>
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
