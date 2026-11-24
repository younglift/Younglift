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
import Img from '@/components/u/Img';
import s from '../studio.module.css';

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
        <div className={`gs ${s.media + (kind === 'video' ? ' ' + s.mediaTall : '')}`}>
          {img ? <Img src={img} alt="Preview" className="u-cover" /> : (
            <button className={s.fillBtnCol} type="button" onClick={() => file.current?.click()}>
              <span className={s.plus}>+</span>{kind === 'video' ? 'Add a video (15–60 s)' : 'Add a photo (optional)'}
            </button>
          )}
          {img && kind === 'video' && captions && caption ? <p className={s.capLine}><span className={s.capSpan}>“{caption}”</span></p> : null}
          {img ? (
            <div className={`row ${s.mediaBar}`}>
              <button type="button" className={`sec gs ${s.smallBtn}`} onClick={() => file.current?.click()}>Replace</button>
              {kind === 'video' ? <button type="button" className={`sec gs ${s.smallBtn}`} aria-pressed={captions} onClick={() => setCaptions(!captions)}>Captions {captions ? 'on' : 'off'}</button> : null}
              <button type="button" className={`sec gs ${s.smallBtn}`} onClick={() => setImg(undefined)}>Remove</button>
            </div>
          ) : null}
          <input ref={file} type="file" accept={kind === 'video' ? 'image/*,video/*' : 'image/*'} hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) setImg(f.type.startsWith('video') ? me.portraitUrl : await uploadImage(f)); e.target.value = ''; }} />
        </div>
        {kind === 'video' ? <span className={`m ${s.note}`}>In this test version a video is shown by its cover photo. Real video upload comes with storage.</span> : null}
        <div className="g u-card u-stack">
          <label className="fld"><span className="lbl">{kind === 'in_progress' ? 'What are you making?' : 'Caption'}</span><textarea className="inp" rows={2} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder={kind === 'in_progress' ? 'Pouring six new candle cups this week.' : 'Glazing day. Two coats, then into the kiln on Thursday.'} /></label>
          <div className="fld">
            <span className="lbl">{kind === 'in_progress' ? 'Which piece?' : kind === 'video' ? 'Pieces in this video' : 'Pieces in this post'}</span>
            <span className="m t-meta">{kind === 'in_progress' ? 'It gets an “In progress” sticker for 30 days.' : 'Buyers can tap to see them'}</span>
            <div className="snap-x gap-8">
              {live.map((p) => (
                <button className={s.pPick} key={p.id} type="button" aria-pressed={ids.includes(p.id)} onClick={() => pick(p.id)}>
                  <span className={s.pThumb + (ids.includes(p.id) ? ' ' + s.pickOn : '')}><Img small src={p.images[0]} alt="" className="u-cover" /></span>
                  <span className={s.pName}>{p.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        {kind === 'video' ? (
          <div className="g u-card row"><span className="grow flex col gap-4"><span>Show as my story in Discover</span><span className="m t-meta">Replaces your current video on the second slide</span></span><button type="button" role="switch" aria-checked={story} aria-label="Show as my story in Discover" className="tg" onClick={() => setStory(!story)}><i /></button></div>
        ) : null}
        <div className="g u-bar"><button type="button" className="cta" onClick={post}>Post</button></div>
      </main>
    </>
  );
}
