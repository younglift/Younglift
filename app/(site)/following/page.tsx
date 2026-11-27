'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CATEGORY_LABEL, getFollowing, getFollowingFeed, getMakers, toggleFollow } from '@/lib/data';
import { ago, plural } from '@/lib/format';
import { useData } from '@/lib/useData';
import Loading from '@/components/u/Loading';
import Wash from '@/components/u/Wash';
import Img from '@/components/u/Img';
import fo from './following.module.css';

/** 06 Following: your makers (stories row), what's new from them, unfollow in one tap. */
export default function Following() {
  const [followed] = useData(getFollowing);
  const [everyone] = useData(getMakers);
  const [feed] = useData(getFollowingFeed);
  const [only, setOnly] = useState<string | null>(null);
  // Keep makers you just unfollowed on screen, so "+ Follow" brings them back in one tap.
  const [ids, setIds] = useState<string[]>();
  useEffect(() => { if (followed) setIds((x) => Array.from(new Set([...(x ?? []), ...followed.map((m) => m.id)]))); }, [followed]);
  if (!followed || !feed || !everyone || !ids) return <Loading />;
  const makers = everyone.filter((m) => ids.includes(m.id));
  const byId = new Map(makers.map((m) => [m.id, m]));
  const recent = new Set(feed.filter((x) => Date.now() - new Date(x.at).getTime() < 7 * 864e5).map((x) => x.makerId));
  const suggest = everyone.filter((m) => !followed.some((f) => f.id === m.id)).slice(0, 3);
  const items = feed.filter((x) => (!only || x.makerId === only) && followed.some((m) => m.id === x.makerId));
  return (
    <>
      <Wash src={makers[0]?.portraitUrl ?? '/img/mara.jpg'} />
      <main className="u-page">
        <div className="u-head"><span><h1 className="hand">Following</h1><span className="m sub">{plural(followed.length, 'maker')}{recent.size ? <span className="desk-only"> · {plural(recent.size, 'new post')}</span> : null}</span></span></div>
        {makers.length ? (
          <div className={`snap-x bleed gap-12 ${fo.stories}`}>
            <button className={fo.story} type="button" onClick={() => setOnly(null)} aria-pressed={!only}>
              <span className={`gs ${fo.ring + ' ' + fo.all + (!only ? ' ' + fo.sel : '')}`}>All</span><span className="t-small">&nbsp;</span>
            </button>
            {makers.map((m) => (
              <button className={fo.story} key={m.id} type="button" onClick={() => setOnly(only === m.id ? null : m.id)} aria-pressed={only === m.id} aria-label={`Only ${m.name}${recent.has(m.id) ? ', something new' : ''}`}>
                <span className={`${fo.ring}${recent.has(m.id) ? ' ' + fo.fresh : ''}${only === m.id ? ' ' + fo.sel : ''}`}><Img small src={m.portraitUrl} alt="" className={`u-avatar ${fo.fullImg}`} /></span><span className="hand t-small">{m.name}</span>
              </button>
            ))}
          </div>
        ) : null}
        <div className={fo.cols}>
        <aside className={`g u-card ${fo.side}`} aria-label="Your makers">
          <span className="lbl">Your makers</span>
          {makers.filter((m) => m.isFollowing).map((m) => (
            <button key={m.id} type="button" className={fo.mk} aria-pressed={only === m.id} onClick={() => setOnly(only === m.id ? null : m.id)}>
              <Img small src={m.portraitUrl} alt="" className="u-avatar ph ph-40" />
              <span className="grow col"><span className="hand t-small">{m.name}</span><span className="m t-meta">{m.city} · {CATEGORY_LABEL[m.categories[0]]}</span></span>
              {recent.has(m.id) ? <span className={fo.dot} aria-label="Something new" /> : null}
            </button>
          ))}
        </aside>
        <div className={`u-stack ${fo.feed}`}>
        <span className="lbl m phone-only">New from your makers</span>
        {items.map((x) => {
          const m = byId.get(x.makerId)!;
          return (
            <article key={x.kind + x.makerId + x.at} className="g u-card u-stack">
              <div className="row"><Img small src={m.portraitUrl} alt="" className="u-avatar ph ph-36" /><span className="grow"><Link href={`/m/${m.slug}`} className="hand tap">{m.name}</Link> <span className="m t-small">{x.kind === 'pieces' ? `added ${plural(x.products.length, 'piece')}` : x.post.kind === 'in_progress' ? 'is making something' : 'wrote in the journal'}</span></span><span className="m t-meta phone-only">{ago(x.at)}</span><span className="desk-only"><Link href={`/messages/${m.slug}`} className="sec gs">Message</Link></span></div>
              {x.kind === 'pieces' ? (
                <>
                  <div className={'grid3'}>{x.products.slice(0, 3).map((p) => <Link key={p.id} href={`/p/${p.id}`} aria-label={p.title}><Img className={'u-sq'} small src={p.images[0]} alt="" /></Link>)}</div>
                  <Link href={`/m/${m.slug}`} className="sec gs">See new pieces</Link>
                </>
              ) : (
                <>
                  {x.post.imageUrl ? <Img className={'u-photo-wide ' + fo.postImg} src={x.post.imageUrl} alt="" /> : null}
                  <p className="m0 t-small lh-15">{x.post.caption}</p>
                  <Link href={`/m/${m.slug}?tab=journal`} className="sec gs">Open {m.name}’s journal</Link>
                </>
              )}
            </article>
          );
        })}
        {!items.length ? <div className="g u-card m">Nothing new yet. Follow makers in For you to see their new pieces here.</div> : null}
        <span className="lbl m phone-only">Your makers</span>
        <div className="g u-card u-stack phone-only">
          {makers.map((m) => (
            <div key={m.id} className="row">
              <Img small src={m.portraitUrl} alt="" className="u-avatar ph ph-40" />
              <Link className="grow" href={`/m/${m.slug}`}><span className="hand t-body">{m.name}</span> <span className="m t-meta">{m.city}</span></Link>
              <button type="button" className="chip" aria-pressed={!!m.isFollowing} onClick={() => toggleFollow(m.id)}>{m.isFollowing ? 'Following' : '+ Follow'}</button>
            </div>
          ))}
          {!makers.length ? <Link href="/" className="cta">Discover makers</Link> : null}
        </div>
        </div>
        {suggest.length ? (
          <aside className={`g u-card ${fo.side}`} aria-label="You might like">
            <span className="lbl">You might like</span>
            {suggest.map((m) => (
              <div key={m.id} className={fo.mk}>
                <Img small src={m.portraitUrl} alt="" className="u-avatar ph ph-40" />
                <Link href={`/m/${m.slug}`} className="grow col"><span className="hand t-small">{m.name}</span><span className="m t-meta">{m.city} · {CATEGORY_LABEL[m.categories[0]]}</span></Link>
                <button type="button" className={`link accent ${fo.follow}`} onClick={() => toggleFollow(m.id)}>Follow</button>
              </div>
            ))}
          </aside>
        ) : null}
        </div>
      </main>
    </>
  );
}
