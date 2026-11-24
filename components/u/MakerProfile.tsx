'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { Maker, Product } from '@/lib/types';
import { CATEGORY_LABEL, getPosts, getReviews, replyLine, toggleFollow } from '@/lib/data';
import { formatEUR, shortDate } from '@/lib/format';
import { useData } from '@/lib/useData';
import { ProductCard } from './Bits';
import s from './MakerProfile.module.css';
import Img from '@/components/u/Img';

export function makerMeta(m: Maker, withCount = false) {
  const r = m.rating ? ` · ★ ${m.rating.avg.toFixed(1)}${withCount ? ` (${m.rating.count})` : ''}` : '';
  return `${m.city} · ${CATEGORY_LABEL[m.categories[0]]}${r}`;
}
export function makerInfo(m: Maker) {
  const parts = [`Ships in ${m.shipsInDays[0]}–${m.shipsInDays[1]} days`];
  const r = replyLine(m); if (r) parts.push(r.replace(`${m.name} u`, 'U'));
  if (m.customRequestsOpen) parts.push('Custom orders open');
  return parts.join(' · ');
}

type Tab = 'works' | 'journal' | 'reviews';
type Props = { maker: Maker; products: Product[]; onStory?: () => void; next?: { maker: Maker; go: () => void }; desktop?: boolean; initialTab?: Tab };
/** Her full profile: Works · Journal · Reviews (Discover step 3, and /m/[slug]). */
export default function MakerProfile({ maker: m, products, onStory, next, desktop, initialTab = 'works' }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [filter, setFilter] = useState<'all' | 'ready' | 'order' | 'sold'>('all');
  const [posts] = useData(() => getPosts(m.id), [m.id]);
  const [reviews] = useData(() => getReviews(m.id), [m.id]);
  const shown = products.filter((p) => filter === 'all' || (filter === 'ready' && !p.madeToOrder && !p.sold) || (filter === 'order' && p.madeToOrder) || (filter === 'sold' && p.sold));
  const extras = [m.giftWrap?.enabled ? `Gift wrap +${formatEUR(m.giftWrap.priceCents)}` : '', m.freeShippingFromCents ? `Free shipping from ${formatEUR(m.freeShippingFromCents)}` : ''].filter(Boolean).join(' · ');

  const card = (
    <div className={`g ${s.card}`}>
      <div className={s.who}>
        <Img small src={m.portraitUrl} alt="" className="u-avatar" />
        <span className="grow minw0"><span className="hand">{m.name}</span><span className={`m ${s.meta}`}>{makerMeta(m, true)} · {m.followers} followers</span></span>
      </div>
      <p className={s.bio}>{m.bio}</p>
      <div className={s.acts}>
        <button type="button" className="cta" aria-pressed={!!m.isFollowing} onClick={() => toggleFollow(m.id)}>{m.isFollowing ? 'Following' : 'Follow'}</button>
        <Link href={`/messages/${m.slug}`} className="sec gs">Message</Link>
      </div>
      {m.customRequestsOpen && desktop ? <Link href={`/m/${m.slug}/request`} className="sec w-full mt-8">Ask for a custom piece</Link> : null}
      <span className={`m ${s.info}`}>{makerInfo(m)}{extras && desktop ? <><br />{extras}</> : null}</span>
    </div>
  );
  const story = (
    <button type="button" onClick={onStory} className={`g ${s.story}`} aria-label={`${m.name}’s story`}>
      <Img src={m.video?.posterUrl ?? m.portraitUrl} alt="" />
      {m.video ? <span className={`gs ${s.play}`}>▶</span> : null}
      <span className={s.storyLbl}>{m.video ? `My story · 0:${String(m.video.seconds).padStart(2, '0')}` : 'Meet ' + m.name}</span>
    </button>
  );
  const tabs = (
    <div className={s.tabs}>
      {([['works', `Works · ${products.length}`], ['journal', 'Journal'], ['reviews', `Reviews · ${reviews?.length ?? 0}`]] as const).map(([k, label]) => (
        <button key={k} type="button" className={s.tab} aria-pressed={tab === k} onClick={() => setTab(k)}>{label}</button>
      ))}
    </div>
  );
  const filters = (
    <div className={s.filters}>
      {([['all', 'All'], ['ready', 'Ready to ship'], ['order', 'Made to order'], ['sold', 'Sold']] as const).map(([k, l]) => <button key={k} type="button" className="chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>)}
    </div>
  );
  const content = (
    <div key={tab} className={`u-fade-in ${s.tabBody}`}>
      {tab === 'works' ? (
        <>
          <div className="u-grid">{shown.map((p) => <ProductCard key={p.id} p={p} showMaker={false} />)}</div>
          {!shown.length ? <span className="m">Nothing here yet.</span> : null}
        </>
      ) : null}
      {tab === 'journal' ? (
        <>
          {!desktop ? story : null}
          {(posts ?? []).filter((p) => p.kind !== 'video').map((p) => (
            <article key={p.id} className={`g ${s.post}`}>
              {p.imageUrl ? <Img src={p.imageUrl} alt="" /> : null}
              <div><span className={`m ${s.kind}`}>{shortDate(p.createdAt)}{p.kind === 'in_progress' ? ' · In progress' : ''}</span><p>{p.caption}</p></div>
            </article>
          ))}
          {posts && !posts.some((p) => p.kind !== 'video') ? <span className="m">No journal posts yet.</span> : null}
        </>
      ) : null}
      {tab === 'reviews' ? (
        <>
          {(reviews ?? []).map((r) => (
            <div key={r.id} className={`g ${s.review}`}>
              <div className={s.top}><span>{r.who}</span><span className="accent" aria-label={`${r.rating} of 5`}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span></div>
              <p>{r.text}</p>
              <span className="m mt-8 t-meta">Bought {r.productTitle} · Verified purchase</span>
              {r.reply ? <p className="m" style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.5, paddingLeft: 10, borderLeft: '2px solid var(--u-line)' }}><b className="ink">{m.name}:</b> {r.reply}</p> : null}
            </div>
          ))}
          {reviews && !reviews.length ? <span className="m">No reviews yet. Only people who bought from {m.name} can leave one.</span> : null}
        </>
      ) : null}
    </div>
  );

  return (
    <>
      <div className={s.cover}><Img src={m.coverUrl} alt={`${m.name}’s work`} /></div>
      {desktop ? (
        <div className={s.body}>
          <div className={s.side}>{card}{story}</div>
          <div className={s.main}><div className={`g ${s.tabsBar}`}>{tabs}{tab === 'works' ? filters : null}</div>{content}</div>
        </div>
      ) : (
        <div className={s.body}>
          {card}{tabs}{content}
          {next ? (
            <button type="button" className={`gs ${s.next}`} onClick={next.go}>
              <Img small src={next.maker.portraitUrl} alt="" className="u-avatar" />
              <span className="grow"><span className="m t-meta">Next maker</span><span className="hand t-body">{next.maker.name} · {CATEGORY_LABEL[next.maker.categories[0]]}</span></span>
              <span className="t-small">Scroll ↓</span>
            </button>
          ) : null}
        </div>
      )}
    </>
  );
}
