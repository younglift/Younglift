'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { FeedItem } from '@/lib/types';
import { getFeed, MAKER_EXTRAS, toggleFollow } from '@/lib/data';
import { formatEUR } from '@/lib/format';
import { getFlag, getSession, setFlag, setSession } from '@/lib/ui';
import BottomNav from '@/components/BottomNav';
import PieceCard from '@/components/PieceCard';
import pc from '@/components/PieceCard.module.css';
import s from './discover.module.css';

// A3 · Discover (docs/design/screens/Main.dc.html + Hints, Surprise).
// Vertical feed, one maker per screen. Swipe sideways through 3 slides: the work (price dots),
// her story, more pieces. The feed remembers where you were.

type Pos = { card: number; slides: Record<number, number> };

export default function Discover() {
  const router = useRouter();
  const [items, setItems] = useState<FeedItem[] | null>(null);
  const [hints, setHints] = useState(false);
  const feed = useRef<HTMLDivElement>(null);
  const pos = useRef<Pos>({ card: 0, slides: {} });

  useEffect(() => {
    if (!getFlag('welcome')) { router.replace('/welcome'); return; }
    pos.current = getSession<Pos>('feed', { card: 0, slides: {} });
    setHints(!getFlag('hints'));
    (async () => {
      const all: FeedItem[] = [];
      let cursor: string | undefined;
      do {
        const page = await getFeed({ cursor });
        all.push(...page.items);
        cursor = page.nextCursor;
      } while (cursor);
      setItems(all);
    })();
  }, [router]);

  // Restore the card the person was on.
  useEffect(() => {
    if (!items || !feed.current) return;
    const el = feed.current;
    el.scrollTop = pos.current.card * el.clientHeight;
  }, [items]);

  const onFeedScroll = useCallback(() => {
    const el = feed.current;
    if (!el) return;
    const card = Math.round(el.scrollTop / el.clientHeight);
    if (card !== pos.current.card) {
      pos.current.card = card;
      setSession('feed', pos.current);
      if (card > 0 && hints) { setHints(false); setFlag('hints'); }
    }
  }, [hints]);

  const onSlide = useCallback((card: number, slide: number) => {
    pos.current.slides[card] = slide;
    setSession('feed', pos.current);
  }, []);

  const next = (i: number) => feed.current?.scrollTo({ top: (i + 1) * feed.current.clientHeight, behavior: 'smooth' });

  return (
    <main className={s.screen}>
      <div ref={feed} className={`noscroll ${s.feed}`} onScroll={onFeedScroll}>
        {items?.map((it, i) => (
          <MakerCard
            key={it.maker.id}
            item={it}
            index={i}
            nextItem={items[i + 1]}
            startSlide={pos.current.slides[i] ?? 0}
            hints={hints && i === 0}
            onSlide={onSlide}
            onNext={() => next(i)}
          />
        ))}
        {items && (
          <section className={s.end}>
            <h2 className={s.endTitle}>YOU’VE MET EVERYONE HERE</h2>
            <p className={s.endText}>New makers join every week.</p>
            <Link href="/explore" className={s.endBtn}>EXPLORE ALL PIECES →</Link>
            <Link href="/welcome" className={s.endLink}>Change your taste</Link>
          </section>
        )}
      </div>
      <BottomNav />
    </main>
  );
}

function MakerCard({ item, index, nextItem, startSlide, hints, onSlide, onNext }: {
  item: FeedItem; index: number; nextItem?: FeedItem; startSlide: number; hints: boolean;
  onSlide: (card: number, slide: number) => void; onNext: () => void;
}) {
  const { maker: m, products } = item;
  const x = MAKER_EXTRAS[m.id];
  const track = useRef<HTMLDivElement>(null);
  const [slide, setSlide] = useState(startSlide);
  const [open, setOpen] = useState<string | null>(x?.tags[0]?.productId ?? null);
  const [following, setFollowing] = useState(!!m.isFollowing);
  const [sided, setSided] = useState(false);
  const [upDone, setUpDone] = useState(false);
  const byId = Object.fromEntries(products.map((p) => [p.id, p]));
  const work = x?.work[0] ?? m.coverUrl;
  const story = x?.meet.image ?? m.portraitUrl;
  const studioHref = `/maker/${m.slug}?from=discover`;

  useEffect(() => {
    const el = track.current;
    if (el && startSlide) el.scrollLeft = startSlide * el.clientWidth;
  }, [startSlide]);

  const go = (n: number) => {
    const el = track.current;
    if (!el) return;
    const i = Math.max(0, Math.min(2, n));
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };
  const onTrackScroll = () => {
    const el = track.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== slide) {
      setSlide(i);
      onSlide(index, i);
      if (i > 0) setSided(true);
    }
  };
  // Tap the left / right quarter of a photo to move, like stories. Swiping works everywhere.
  const onTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('a,button')) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    if (slide < 2 && px > 0.75) go(slide + 1);
    else if (slide > 0 && slide < 2 && px < 0.25) go(slide - 1);
  };
  const lightBars = slide !== 0;
  const peek = hints && !sided && slide === 0;

  return (
    <section className={s.card} aria-label={`${m.name}, ${m.city}`}>
      <div className={s.media}>
        <div ref={track} className={`noscroll ${s.track} ${peek ? s.peek : ''}`} onScroll={onTrackScroll} onClick={onTap}>
          {/* 1 · the work, with price dots */}
          <div className={s.slide}>
            <img src={work} alt={`${m.name}'s work`} className={s.photo} />
            {x?.tags.map((t) => {
              const p = byId[t.productId];
              if (!p) return null;
              const isOpen = open === t.productId;
              const right = t.x > 55;
              return (
                <div
                  key={t.productId}
                  className={right ? s.tagR : s.tag}
                  style={right ? { right: `calc(${100 - t.x}% - 15px)`, top: `calc(${t.y}% - 15px)` } : { left: `calc(${t.x}% - 15px)`, top: `calc(${t.y}% - 15px)` }}
                >
                  <button
                    type="button"
                    className={`glass ${s.dot} ${hints && !sided ? s.pulse : ''}`}
                    aria-expanded={isOpen}
                    aria-label={`${p.title}: ${isOpen ? 'hide' : 'show'} price`}
                    onClick={() => setOpen(isOpen ? null : t.productId)}
                  >
                    <span className={isOpen ? s.dotInOn : s.dotIn} />
                  </button>
                  {isOpen && (
                    <Link href={`/product/${p.id}?from=discover`} className={`glass ${s.pill}`}>
                      {p.title} <span className="mono">{formatEUR(p.priceCents)}</span><span aria-hidden="true" className={s.chev}>›</span>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

          {/* 2 · her story */}
          <div className={s.slide}>
            <img src={story} alt={`${m.name} in the studio`} className={s.photo} style={{ objectPosition: 'center 22%' }} />
            <div className={s.caption}>
              <span className={s.capTitle}>{x?.process.title ? sentence(x.process.title) : m.quote}</span>
              <span className={`mono ${s.capMeta}`}>VIDEO COMING SOON</span>
            </div>
            <button type="button" className={`mono ${s.more}`} onClick={() => go(2)}>MORE PIECES →</button>
          </div>

          {/* 3 · more pieces */}
          <div className={`${s.slide} ${s.moreSlide}`}>
            <div className={`noscroll ${s.moreScroll}`}>
              <div className={s.moreHead}>
                <span className={s.moreTitle}>MORE FROM {m.name.toUpperCase()}</span>
                <span className={`mono ${s.moreCount}`}>{products.length} PIECES</span>
              </div>
              <div className={pc.grid}>
                {products.slice(0, 4).map((p) => <PieceCard key={p.id} p={p} from="discover" />)}
              </div>
              <Link href={studioHref} className={s.allBtn}>ALL {products.length} PIECES →</Link>
            </div>
          </div>
        </div>

        <div className={s.bars}>
          {[0, 1, 2].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={['Slide 1, the work', 'Slide 2, her story', 'Slide 3, more pieces'][n]}
              onClick={() => go(n)}
              className={s.bar}
              style={{ background: n <= slide ? (lightBars ? 'var(--fg)' : 'var(--ink)') : (lightBars ? 'rgba(241,239,233,.35)' : 'rgba(18,20,18,.25)') }}
            />
          ))}
        </div>

        {hints && sided && slide === 1 && !upDone && nextItem && (
          <>
            <button type="button" className={s.upNext} onClick={() => { setUpDone(true); onNext(); }} aria-label={`Next maker: ${nextItem.maker.name}`}>
              <img src={nextItem.maker.portraitUrl} alt="" />
              <span><span className={`mono ${s.upKick}`}>UP NEXT</span><span className={s.upName}>{nextItem.maker.name} · {MAKER_EXTRAS[nextItem.maker.id]?.craft ?? ''}</span></span>
            </button>
            <span className={s.hand}>swipe up ↑ next maker</span>
          </>
        )}
      </div>

      <div className={s.info}>
        <div className={s.who}>
          <img src={m.portraitUrl} alt="" className={s.avatar} />
          <div className={s.whoText}>
            <h2 className={s.name}>{m.name.toUpperCase()}</h2>
            <span className={s.place}>{m.city} · {x?.craft ?? m.categories[0]}</span>
          </div>
          <button
            type="button"
            className={following ? s.followOn : s.follow}
            onClick={async () => setFollowing(await toggleFollow(m.id))}
          >
            {following ? 'Following' : '+ Follow'}
          </button>
        </div>
        <p className={s.quote}>“{m.quote}”</p>
        <Link href={studioHref} className={s.explore}>EXPLORE HER STUDIO →</Link>
      </div>
    </section>
  );
}

function sentence(t: string) {
  return t.charAt(0) + t.slice(1).toLowerCase();
}
