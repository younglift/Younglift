'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getFollowing, getFollowingFeed, getMakers, toggleFollow } from '@/lib/data';
import { ago, plural } from '@/lib/format';
import { useData } from '@/lib/useData';
import Wash from '@/components/u/Wash';

/** 06 Following: your makers (stories row), what's new from them, unfollow in one tap. */
export default function Following() {
  const [followed] = useData(getFollowing);
  const [everyone] = useData(getMakers);
  const [feed] = useData(getFollowingFeed);
  const [only, setOnly] = useState<string | null>(null);
  // Keep makers you just unfollowed on screen, so "+ Follow" brings them back in one tap.
  const [ids, setIds] = useState<string[]>();
  useEffect(() => { if (followed) setIds((x) => Array.from(new Set([...(x ?? []), ...followed.map((m) => m.id)]))); }, [followed]);
  if (!followed || !feed || !everyone || !ids) return <Wash />;
  const makers = everyone.filter((m) => ids.includes(m.id));
  const byId = new Map(makers.map((m) => [m.id, m]));
  const recent = new Set(feed.filter((x) => Date.now() - new Date(x.at).getTime() < 7 * 864e5).map((x) => x.makerId));
  const items = feed.filter((x) => (!only || x.makerId === only) && followed.some((m) => m.id === x.makerId));
  const ring = (on: boolean, fresh: boolean) => ({ width: 64, height: 64, borderRadius: '50%', padding: 3, border: `2px solid ${fresh ? 'var(--u-accent)' : 'var(--u-line)'}`, display: 'block', outline: on ? '2px solid var(--u-ink)' : 'none', outlineOffset: 2 });
  return (
    <>
      <Wash src={makers[0]?.portraitUrl ?? '/img/mara.jpg'} />
      <main className="u-page">
        <div className="u-head"><span><h1 className="hand">Following</h1><span className="m sub">{plural(followed.length, 'maker')}</span></span></div>
        {makers.length ? (
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', scrollbarWidth: 'none', margin: '0 -16px', padding: '4px 16px' }}>
            <button type="button" onClick={() => setOnly(null)} aria-pressed={!only} style={{ background: 'none', border: 0, color: 'var(--u-ink)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', padding: 0 }}>
              <span className="gs" style={{ ...ring(!only, false), display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 13px var(--u-ui)' }}>All</span><span style={{ fontSize: 13 }}>&nbsp;</span>
            </button>
            {makers.map((m) => (
              <button key={m.id} type="button" onClick={() => setOnly(only === m.id ? null : m.id)} aria-pressed={only === m.id} aria-label={`Only ${m.name}${recent.has(m.id) ? ', something new' : ''}`} style={{ background: 'none', border: 0, color: 'var(--u-ink)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', padding: 0 }}>
                <span style={ring(only === m.id, recent.has(m.id))}><img src={m.portraitUrl} alt="" className="u-avatar" style={{ width: '100%', height: '100%' }} /></span><span className="hand" style={{ fontSize: 13 }}>{m.name}</span>
              </button>
            ))}
          </div>
        ) : null}
        <span className="lbl m">New from your makers</span>
        {items.map((x) => {
          const m = byId.get(x.makerId)!;
          return (
            <article key={x.kind + x.makerId + x.at} className="g u-card u-stack">
              <div className="row"><img src={m.portraitUrl} alt="" className="u-avatar" style={{ width: 36, height: 36 }} /><span style={{ flex: 1 }}><Link href={`/m/${m.slug}`} className="hand">{m.name}</Link> <span className="m" style={{ fontSize: 13 }}>{x.kind === 'pieces' ? `added ${plural(x.products.length, 'piece')}` : x.post.kind === 'in_progress' ? 'is making something' : 'wrote in her journal'}</span></span><span className="m" style={{ fontSize: 12 }}>{ago(x.at)}</span></div>
              {x.kind === 'pieces' ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>{x.products.slice(0, 3).map((p) => <Link key={p.id} href={`/p/${p.id}`} aria-label={p.title}><img src={p.images[0]} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 14, display: 'block' }} /></Link>)}</div>
                  <Link href={`/m/${m.slug}`} className="sec gs">See new pieces</Link>
                </>
              ) : (
                <>
                  {x.post.imageUrl ? <img src={x.post.imageUrl} alt="" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 16 }} /> : null}
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{x.post.caption}</p>
                  <Link href={`/m/${m.slug}?tab=journal`} className="sec gs">Open her journal</Link>
                </>
              )}
            </article>
          );
        })}
        {!items.length ? <div className="g u-card m">Nothing new yet. Follow makers in Discover to see their new pieces here.</div> : null}
        <span className="lbl m">Your makers</span>
        <div className="g u-card u-stack">
          {makers.map((m) => (
            <div key={m.id} className="row">
              <img src={m.portraitUrl} alt="" className="u-avatar" style={{ width: 40, height: 40 }} />
              <Link href={`/m/${m.slug}`} style={{ flex: 1 }}><span className="hand" style={{ fontSize: 15 }}>{m.name}</span> <span className="m" style={{ fontSize: 12 }}>{m.city}</span></Link>
              <button type="button" className="chip" aria-pressed={!!m.isFollowing} onClick={() => toggleFollow(m.id)}>{m.isFollowing ? 'Following' : '+ Follow'}</button>
            </div>
          ))}
          {!makers.length ? <Link href="/" className="cta">Discover makers</Link> : null}
        </div>
      </main>
    </>
  );
}
