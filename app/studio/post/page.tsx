'use client';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import type { PostKind } from '@/lib/types';
import { createPost, getMyMaker, getStudioProducts, uploadImage } from '@/lib/data';
import { useData } from '@/lib/useData';
import { BackButton } from '@/components/u/Bits';
import { toast } from '@/components/u/Toast';
import Loading from '@/components/u/Loading';
import Wash from '@/components/u/Wash';

/** B6 Share something: video, journal post, or "in progress" (adds the In progress sticker to that piece). */
export default function Post() {
  const router = useRouter();
  const [me] = useData(getMyMaker);
  const [pieces] = useData(getStudioProducts);
  const [kind, setKind] = useState<PostKind>('video');
  const [img, setImg] = useState<string>();
  const [caption, setCaption] = useState('');
  const [ids, setIds] = useState<string[]>([]);
  const [story, setStory] = useState(true);
  const [captions, setCaptions] = useState(true);
  const file = useRef<HTMLInputElement>(null);
  if (!me || !pieces) return <Loading />;
  const live = pieces.filter((p) => p.status === 'live');
  const pick = (id: string) => setIds(kind === 'in_progress' ? [id] : ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  const ok = caption.trim() && (kind !== 'video' || img) && (kind !== 'in_progress' || ids.length === 1);
  const post = async () => {
    if (!ok) { toast(kind === 'video' ? 'Add a video and a caption' : kind === 'in_progress' ? 'Pick the piece and write a line' : 'Write something first'); return; }
    await createPost({ kind, caption: caption.trim(), imageUrl: img, seconds: kind === 'video' ? 30 : undefined, productIds: ids, showAsStory: kind === 'video' && story });
    toast(kind === 'in_progress' ? 'Posted · “In progress” is on that piece now' : 'Posted');
    router.push(me.status === 'live' ? '/studio' : '/studio/welcome');
  };
  return (
    <>
      <Wash src={img ?? me.portraitUrl} />
      <main className="u-page narrow has-bar">
        <div className="u-head"><BackButton href="/studio" /><h1 className="hand">Share something</h1></div>
        <div className="chips">{([['video', 'Video'], ['journal', 'Journal post'], ['in_progress', 'In progress']] as const).map(([k, l]) => <button key={k} type="button" className="chip" aria-pressed={kind === k} onClick={() => { setKind(k); setIds([]); }}>{l}</button>)}</div>
        <div style={{ position: 'relative', borderRadius: 26, overflow: 'hidden', aspectRatio: kind === 'video' ? '4/5' : '16/10' }} className="gs">
          {img ? <img src={img} alt="Preview" className="u-cover" /> : (
            <button type="button" onClick={() => file.current?.click()} style={{ position: 'absolute', inset: 0, background: 'none', border: 0, color: 'var(--u-ink)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, font: '600 15px var(--u-ui)' }}>
              <span style={{ fontSize: 30 }}>+</span>{kind === 'video' ? 'Add a video (15–60 s)' : 'Add a photo (optional)'}
            </button>
          )}
          {img && kind === 'video' && captions && caption ? <p style={{ position: 'absolute', left: 16, right: 16, bottom: 70, textAlign: 'center', margin: 0 }}><span style={{ background: 'var(--u-shade)', padding: '4px 10px', borderRadius: 8, lineHeight: 1.9, boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' }}>“{caption}”</span></p> : null}
          {img ? (
            <div className="row" style={{ position: 'absolute', left: 12, right: 12, bottom: 12, gap: 6 }}>
              <button type="button" className="sec gs" style={{ minHeight: 40, fontSize: 13 }} onClick={() => file.current?.click()}>Replace</button>
              {kind === 'video' ? <button type="button" className="sec gs" style={{ minHeight: 40, fontSize: 13 }} aria-pressed={captions} onClick={() => setCaptions(!captions)}>Captions {captions ? 'on' : 'off'}</button> : null}
              <button type="button" className="sec gs" style={{ minHeight: 40, fontSize: 13 }} onClick={() => setImg(undefined)}>Remove</button>
            </div>
          ) : null}
          <input ref={file} type="file" accept={kind === 'video' ? 'image/*,video/*' : 'image/*'} hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) setImg(f.type.startsWith('video') ? me.portraitUrl : await uploadImage(f)); e.target.value = ''; }} />
        </div>
        {kind === 'video' ? <span className="m" style={{ fontSize: 12, marginTop: -8 }}>In this test version a video is shown by its cover photo. Real video upload comes with storage.</span> : null}
        <div className="g u-card u-stack">
          <label className="fld"><span className="lbl">{kind === 'in_progress' ? 'What are you making?' : 'Caption'}</span><textarea className="inp" rows={2} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder={kind === 'in_progress' ? 'Pouring six new candle cups this week.' : 'Glazing day. Two coats, then into the kiln on Thursday.'} /></label>
          <div className="fld">
            <span className="lbl">{kind === 'in_progress' ? 'Which piece?' : kind === 'video' ? 'Pieces in this video' : 'Pieces in this post'}</span>
            <span className="m" style={{ fontSize: 12 }}>{kind === 'in_progress' ? 'It gets an “In progress” sticker for 30 days.' : 'Buyers can tap to see them'}</span>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {live.map((p) => (
                <button key={p.id} type="button" aria-pressed={ids.includes(p.id)} onClick={() => pick(p.id)} style={{ padding: 0, border: 0, background: 'none', color: 'var(--u-ink)', display: 'flex', flexDirection: 'column', gap: 4, cursor: 'pointer', flexShrink: 0, width: 72 }}>
                  <span style={{ width: 72, height: 72, borderRadius: 14, overflow: 'hidden', display: 'block', outline: ids.includes(p.id) ? '2px solid var(--u-accent)' : 'none', outlineOffset: 2 }}><img src={p.images[0]} alt="" className="u-cover" /></span>
                  <span style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        {kind === 'video' ? (
          <div className="g u-card row"><span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}><span>Show as my story in Discover</span><span className="m" style={{ fontSize: 12 }}>Replaces your current video on the second slide</span></span><button type="button" role="switch" aria-checked={story} aria-label="Show as my story in Discover" className="tg" onClick={() => setStory(!story)}><i /></button></div>
        ) : null}
        <div className="g u-bar"><button type="button" className="cta" onClick={post}>Post</button></div>
      </main>
    </>
  );
}
