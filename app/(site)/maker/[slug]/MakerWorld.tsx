'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Maker, Product } from '@/lib/types';
import { getMaker, getMakerProducts, MAKER_EXTRAS, PRODUCT_EXTRAS, toggleFollow, type PieceStatus } from '@/lib/data';
import { backTarget } from '@/lib/ui';
import BackPill from '@/components/BackPill';
import BottomNav from '@/components/BottomNav';
import PieceCard from '@/components/PieceCard';
import ShareButton from '@/components/ShareButton';
import pc from '@/components/PieceCard.module.css';
import s from './maker.module.css';

// A4 · Maker world (docs/design/screens/Maker.dc.html): photo, name, facts, Follow / Message,
// tabs Pieces / Journal / About / Reviews. The selected tab is big Anton caps.

type Tab = 'pieces' | 'journal' | 'about' | 'reviews';
const FILTERS: [PieceStatus | 'all', string][] = [['all', 'All'], ['ready', 'Ready to ship'], ['order', 'Made to order'], ['sold', 'Sold']];

export default function MakerWorld({ slug, from, tab: startTab }: { slug: string; from: string | null; tab: string | null }) {
  const [m, setM] = useState<Maker | null | undefined>(undefined);
  const [pieces, setPieces] = useState<Product[]>([]);
  const [tab, setTab] = useState<Tab>((['pieces', 'journal', 'about', 'reviews'] as Tab[]).find((t) => t === startTab) ?? 'pieces');
  const [filter, setFilter] = useState<PieceStatus | 'all'>('all');
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    getMaker(slug).then((mk) => {
      setM(mk);
      if (!mk) return;
      setFollowing(!!mk.isFollowing);
      getMakerProducts(mk.id).then(setPieces);
    });
  }, [slug]);

  if (m === undefined) return <main className={s.screen} />;
  if (m === null) {
    return (
      <main className={s.missing}>
        <h1 className={s.missingTitle}>MAKER NOT FOUND</h1>
        <Link href="/" className={s.primary}>BACK TO DISCOVER</Link>
        <BottomNav active="Discover" />
      </main>
    );
  }

  const x = MAKER_EXTRAS[m.id];
  const back = backTarget(from);
  const status = (p: Product): PieceStatus => PRODUCT_EXTRAS[p.id]?.status ?? (p.stock === 0 ? 'sold' : 'ready');
  const shown = pieces.filter((p) => filter === 'all' || status(p) === filter);
  const here = `maker:${m.slug}`;
  const tabs: [Tab, string, string][] = [
    ['pieces', 'PIECES', `Pieces · ${pieces.length}`],
    ['journal', 'JOURNAL', 'Journal'],
    ['about', 'ABOUT', 'About'],
    ['reviews', 'REVIEWS', 'Reviews'],
  ];

  return (
    <main className={s.screen}>
      <div className={s.hero}>
        <img src={m.portraitUrl} alt={`${m.name} in the studio`} />
        <div className={s.heroBar}>
          <BackPill href={back.href} label={back.label} />
          <ShareButton title={`${m.name} on Young Lift`} label={`Share ${m.name}'s studio`} />
        </div>
      </div>

      <div className={s.head}>
        <span className={`mono ${s.kicker}`}>{[m.studio, m.city].filter(Boolean).join(' · ').toUpperCase()}</span>
        <h1 className={s.name}>{m.name.toUpperCase()}</h1>
        {x?.tagline && <span className={s.tagline}>{x.tagline}</span>}
        <p className={s.bio}>{m.bio}</p>
        <div className={s.facts}>
          {x?.material && <span className={s.fact}>{x.material}</span>}
          {x?.acceptsCustom && <span className={s.fact}><span aria-hidden="true" className={s.greenDot} />Custom pieces open</span>}
          {x?.replyTime && <span className={s.fact}>Replies in {x.replyTime}</span>}
        </div>
        <div className={s.actions}>
          <button type="button" className={following ? s.followOn : s.follow} onClick={async () => setFollowing(await toggleFollow(m.id))}>
            {following ? 'FOLLOWING' : '+ FOLLOW'}
          </button>
          <Link href={`/messages/${m.slug}?from=${here}`} className={s.outline}>MESSAGE</Link>
        </div>
      </div>

      <div role="tablist" className={s.tabs}>
        {tabs.map(([id, big, small]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? s.tabOn : s.tab} onClick={() => setTab(id)}>
            {tab === id ? big : small}
          </button>
        ))}
      </div>

      {tab === 'pieces' && (
        <>
          {x && (
            <div className={`noscroll ${s.strip}`}>
              {[x.process.image, ...x.work.slice(1)].map((src, i) => (
                <img key={src + i} src={src} alt={i === 0 ? x.process.title.toLowerCase() : `${m.name}'s work`} />
              ))}
            </div>
          )}
          <div className={s.filters}>
            {FILTERS.map(([id, label]) => (
              <button key={id} type="button" aria-pressed={filter === id} className={filter === id ? s.chipOn : s.chip} onClick={() => setFilter(id)}>{label}</button>
            ))}
          </div>
          <div className={`${pc.grid} ${s.grid}`}>
            {shown.map((p) => <PieceCard key={p.id} p={p} from={here} />)}
          </div>
          {!shown.length && <p className={s.empty}>Nothing here right now.</p>}
          {x?.acceptsCustom && (
            <div className={s.custom}>
              <span className={s.customTitle}>WANT SOMETHING PERSONAL?</span>
              <span className={s.customText}>Your size, another colour, a gift with a story. {m.name} takes a few commissions a month.</span>
              <Link href={`/messages/${m.slug}?tab=request&from=${here}`} className={s.customBtn}>REQUEST A CUSTOM PIECE</Link>
            </div>
          )}
        </>
      )}

      {tab === 'journal' && (
        <div className={s.journal}>
          {(x?.journal ?? []).map((j, i) => {
            const isQuote = !j.image && j.text.startsWith('“');
            const kind = j.isVideo ? 'PROCESS' : isQuote ? 'SKETCHBOOK' : j.image ? 'DISCOVERED' : 'NEXT IDEA';
            const kicker = `${j.date.toUpperCase()} · ${kind}`;
            if (!j.image) {
              return (
                <article key={i} className={s.note}>
                  <span className={`mono ${s.kick}`}>{kicker}</span>
                  {isQuote ? <p className={s.noteQuote}>{j.text.toUpperCase()}</p> : <p className={s.noteText}>{j.text}</p>}
                </article>
              );
            }
            return (
              <article key={i} className={s.post}>
                <img src={j.image} alt={j.title} />
                <span className={`mono ${s.kick}`}>{kicker}</span>
                <h3 className={s.postTitle}>{j.title}</h3>
                <p className={s.postText}>{j.isVideo ? 'Video coming soon.' : j.text}</p>
              </article>
            );
          })}
        </div>
      )}

      {tab === 'about' && (
        <div className={s.about}>
          {(x?.about ?? []).map((a) => (
            <div key={a.heading} className={s.aboutBlock}>
              <span className={`mono ${s.aboutHead}`}>{a.heading}</span>
              <p>{a.text}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'reviews' && (
        <div className={s.reviews}>
          <div className={s.reviewBox}>
            <span className={s.reviewEmpty}>No reviews yet</span>
            <span className={s.reviewNote}>Only people who bought from {m.name} can leave a review.</span>
          </div>
        </div>
      )}

      <div className={s.navSpace} />
      <BottomNav active="Discover" />
    </main>
  );
}
