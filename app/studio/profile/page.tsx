'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { Maker, Slide } from '@/lib/types';
import { getMyMaker, getStudioProducts, updateMyMaker, uploadImage } from '@/lib/data';
import { formatEUR } from '@/lib/format';
import { useData } from '@/lib/useData';
import { toast } from '@/components/u/Toast';
import Loading from '@/components/u/Loading';
import Wash from '@/components/u/Wash';
import s from '../studio.module.css';
import Img from '@/components/u/Img';

const STEPS = [
  ['About you', 'This is how buyers meet you first.'],
  ['Your collage', 'Three pieces that show what you do best. They open your profile in Discover.'],
  ['Your video', 'Optional. 15–60 seconds of you at work. Buyers love seeing hands and tools.'],
  ['Order of your slides', 'What buyers see when they swipe across your profile.'],
  ['Pieces and requests', 'Last step. You can change all of this later in Studio.'],
] as const;
const SLIDE_LABEL = (name: string): Record<Slide, string> => ({ work: 'Your work', meet: `Meet ${name}`, process: 'Your process', piece: 'A piece' });
const euros = (v: string) => Math.round(parseFloat(v.replace(',', '.').replace(/[^0-9.]/g, '')) * 100) || 0;

/** B4 Profile editor: 5 steps, live preview on desktop. */
export default function StudioProfile() {
  const router = useRouter();
  const [me] = useData(getMyMaker);
  const [pieces] = useData(getStudioProducts);
  const [step, setStep] = useState(1);
  const [d, setD] = useState<Maker>();
  const [wrapPrice, setWrapPrice] = useState('');
  const [freeFrom, setFreeFrom] = useState('');
  const photo = useRef<HTMLInputElement>(null);
  const video = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (me && !d) {
      setD(me);
      setWrapPrice(me.giftWrap ? String(me.giftWrap.priceCents / 100) : '5');
      setFreeFrom(me.freeShippingFromCents ? String(me.freeShippingFromCents / 100) : '150');
    }
  }, [me, d]);
  if (!d || !pieces) return <Loading />;
  const set = (p: Partial<Maker>) => setD({ ...d, ...p });
  const live = pieces.filter((p) => p.status === 'live');
  const lib = live.length ? live : pieces;
  const pick = (id: string) => set({ collage: d.collage.includes(id) ? d.collage.filter((x) => x !== id) : d.collage.length < 3 ? [...d.collage, id] : d.collage });
  const move = (i: number, dir: number) => { const a = [...d.slideOrder]; const j = i + dir; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; set({ slideOrder: a }); };
  const save = async (andLeave = false) => {
    await updateMyMaker({
      ...d,
      giftWrap: d.giftWrap ? { ...d.giftWrap, priceCents: euros(wrapPrice) } : undefined,
      freeShippingFromCents: d.freeShippingFromCents != null ? euros(freeFrom) : undefined,
    });
    if (andLeave) { toast('Profile saved'); router.push(me?.status === 'live' ? '/studio' : '/studio/welcome'); }
  };
  const next = async () => { await save(step === 5); if (step < 5) setStep(step + 1); };
  const cover = d.collage.map((id) => pieces.find((p) => p.id === id)?.images[0]).filter(Boolean) as string[];

  return (
    <>
      <Wash src={cover[0] ?? d.portraitUrl} />
      <main className="u-page has-bar">
        <div className="u-head">
          <Link href="/studio" aria-label="Close" className="ic gs">✕</Link>
          <span style={{ flex: 1, textAlign: 'center', fontWeight: 600 }}>Your profile</span>
          <button type="button" className="sec gs" onClick={async () => { await save(); router.push(`/m/${d.slug}`); }}>Preview</button>
        </div>
        <div className={s.steps}>{[1, 2, 3, 4, 5].map((i) => <button key={i} type="button" aria-label={`Step ${i}: ${STEPS[i - 1][0]}`} onClick={() => setStep(i)} style={{ flex: 1, height: 18, padding: '7px 0', border: 0, background: 'none', cursor: 'pointer' }}><span style={{ display: 'block', height: 3, borderRadius: 2, background: i <= step ? 'var(--u-accent)' : 'var(--u-track)' }} /></button>)}</div>
        <div className={s.editor}>
          <div className="u-stack">
            <div><span className="m lbl">STEP {step} OF 5</span><h1 className="hand" style={{ margin: '6px 0', fontSize: 24 }}>{STEPS[step - 1][0]}</h1><span className="m" style={{ fontSize: 14 }}>{STEPS[step - 1][1]}</span></div>

            {step === 1 ? (
              <div className="g u-card u-stack">
                <div className="row"><Img small src={d.portraitUrl} alt="" className="u-avatar" style={{ width: 72, height: 72 }} /><button type="button" className="sec gs" onClick={() => photo.current?.click()}>Change photo</button>
                  <input ref={photo} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) set({ portraitUrl: await uploadImage(f) }); e.target.value = ''; }} /></div>
                <label className="fld"><span className="lbl">Your name</span><input className="inp" value={d.name} onChange={(e) => set({ name: e.target.value })} /></label>
                <label className="fld"><span className="lbl">Studio name</span><input className="inp" value={d.studio} onChange={(e) => set({ studio: e.target.value })} /><span className="m" style={{ fontSize: 12 }}>Optional</span></label>
                <label className="fld"><span className="lbl">One line about your work</span><textarea className="inp" rows={2} maxLength={140} value={d.tagline} onChange={(e) => set({ tagline: e.target.value })} /><span className="m" style={{ fontSize: 12 }}>{d.tagline.length} / 140</span></label>
                <label className="fld"><span className="lbl">About you</span><textarea className="inp" rows={3} value={d.bio} onChange={(e) => set({ bio: e.target.value })} /></label>
                <label className="fld"><span className="lbl">City</span><input className="inp" value={d.city} onChange={(e) => set({ city: e.target.value })} /><span className="m" style={{ fontSize: 12 }}>Shown on your profile and on “Made in” stickers.</span></label>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="g u-card u-stack">
                <div className="row" style={{ justifyContent: 'space-between' }}><span className="lbl">Pick three</span><span className="m">{d.collage.length} / 3</span></div>
                {lib.length ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                    {lib.map((p) => { const k = d.collage.indexOf(p.id); return (
                      <button key={p.id} type="button" aria-pressed={k >= 0} aria-label={p.title} onClick={() => pick(p.id)} style={{ position: 'relative', padding: 0, border: 0, borderRadius: 16, overflow: 'hidden', aspectRatio: '1', cursor: 'pointer', outline: k >= 0 ? '2px solid var(--u-accent)' : 'none', outlineOffset: 2 }}>
                        <Img small src={p.images[0]} alt="" className="u-cover" />
                        <span style={{ position: 'absolute', right: 6, top: 6, width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 13px var(--u-ui)', background: k >= 0 ? 'var(--u-accent)' : 'var(--u-shade)', color: k >= 0 ? 'var(--u-on-accent)' : 'var(--u-ink)' }}>{k >= 0 ? k + 1 : '+'}</span>
                      </button>
                    ); })}
                  </div>
                ) : <span className="m">Add pieces first, then pick three here. <Link href="/studio/pieces/new" style={{ textDecoration: 'underline' }}>Add a piece</Link></span>}
              </div>
            ) : null}

            {step === 3 ? (
              <div className="g u-card u-stack">
                <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', aspectRatio: '4/5' }} className="gs">
                  {d.video ? <><Img src={d.video.posterUrl} alt="" className="u-cover" /><span className="gs" style={{ position: 'absolute', left: 12, bottom: 12, borderRadius: 999, padding: '6px 12px', fontSize: 12 }}>0:{String(d.video.seconds).padStart(2, '0')} · plays muted first</span></>
                    : <button type="button" onClick={() => video.current?.click()} style={{ position: 'absolute', inset: 0, background: 'none', border: 0, color: 'var(--u-ink)', cursor: 'pointer', font: '600 15px var(--u-ui)' }}>+ Add a video</button>}
                </div>
                <input ref={video} type="file" accept="image/*,video/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const poster = f.type.startsWith('video') ? d.portraitUrl : await uploadImage(f); set({ video: { posterUrl: poster, caption: d.video?.caption ?? d.tagline, seconds: 30, hasCaptions: d.video?.hasCaptions ?? true } }); } e.target.value = ''; }} />
                <div className="row" style={{ gap: 8 }}>
                  <button type="button" className="sec gs" style={{ flex: 1 }} onClick={() => video.current?.click()}>{d.video ? 'Replace' : 'Upload'}</button>
                  {d.video ? <button type="button" className="sec gs" style={{ flex: 1 }} aria-pressed={d.video.hasCaptions} onClick={() => set({ video: { ...d.video!, hasCaptions: !d.video!.hasCaptions } })}>Captions {d.video.hasCaptions ? 'on' : 'off'}</button> : null}
                  {d.video ? <button type="button" className="sec" onClick={() => set({ video: undefined })}>Remove</button> : null}
                </div>
                {d.video?.hasCaptions ? <label className="fld"><span className="lbl">Caption</span><input className="inp" value={d.video.caption} onChange={(e) => set({ video: { ...d.video!, caption: e.target.value } })} /></label> : null}
                <span className="m" style={{ fontSize: 13 }}>No video? That’s fine. Your photo is shown instead, clearly labelled.</span>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="u-stack" style={{ gap: 8 }}>
                {d.slideOrder.map((sl, i) => (
                  <div key={sl} className="gs row" style={{ borderRadius: 18, padding: '6px 6px 6px 16px' }}>
                    <span className="m" style={{ width: 18 }}>{i + 1}</span><span style={{ flex: 1, fontWeight: 600 }}>{SLIDE_LABEL(d.name)[sl]}</span>
                    <button type="button" className="ic" aria-label={`Move ${SLIDE_LABEL(d.name)[sl]} up`} disabled={!i} onClick={() => move(i, -1)}>↑</button>
                    <button type="button" className="ic" aria-label={`Move ${SLIDE_LABEL(d.name)[sl]} down`} disabled={i === d.slideOrder.length - 1} onClick={() => move(i, 1)}>↓</button>
                  </div>
                ))}
              </div>
            ) : null}

            {step === 5 ? (
              <>
                <div className="g u-card u-stack">
                  <div className="row"><span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}><span>Custom requests</span><span className="m" style={{ fontSize: 12 }}>{d.customRequestsOpen ? 'Open · buyers can ask you for personal pieces' : 'Closed'}</span></span><button type="button" role="switch" aria-checked={d.customRequestsOpen} aria-label="Custom requests" className="tg" onClick={() => set({ customRequestsOpen: !d.customRequestsOpen })}><i /></button></div>
                  <hr className="hr" />
                  <div className="row"><span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}><span>Gift wrap</span><span className="m" style={{ fontSize: 12 }}>{d.giftWrap?.enabled ? `+${wrapPrice || 0}€ · You keep 100%.` : 'Off'}</span></span><button type="button" role="switch" aria-checked={!!d.giftWrap?.enabled} aria-label="Gift wrap" className="tg" onClick={() => set({ giftWrap: d.giftWrap ? { ...d.giftWrap, enabled: !d.giftWrap.enabled } : { enabled: true, priceCents: 500, description: 'Linen bag and a handwritten card.' } })}><i /></button></div>
                  {d.giftWrap?.enabled ? (
                    <div className={s.two}>
                      <label className="fld"><span className="lbl">Price (€)</span><input className="inp" inputMode="decimal" value={wrapPrice} onChange={(e) => setWrapPrice(e.target.value)} /></label>
                      <label className="fld"><span className="lbl">What’s included</span><input className="inp" value={d.giftWrap.description} onChange={(e) => set({ giftWrap: { ...d.giftWrap!, description: e.target.value } })} /></label>
                    </div>
                  ) : null}
                  <hr className="hr" />
                  <div className="row"><span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}><span>Free shipping from</span><span className="m" style={{ fontSize: 12 }}>{d.freeShippingFromCents != null ? `${freeFrom || 0}€ · shown in buyers’ bags as a goal` : 'Off'}</span></span><button type="button" role="switch" aria-checked={d.freeShippingFromCents != null} aria-label="Free shipping from" className="tg" onClick={() => set({ freeShippingFromCents: d.freeShippingFromCents != null ? undefined : euros(freeFrom) || 15000 })}><i /></button></div>
                  {d.freeShippingFromCents != null ? <label className="fld"><span className="lbl">From (€)</span><input className="inp" inputMode="decimal" value={freeFrom} onChange={(e) => setFreeFrom(e.target.value)} /></label> : null}
                </div>
                <div className="g u-card u-stack">
                  <div className="row" style={{ justifyContent: 'space-between' }}><span className="lbl">Your pieces · {pieces.length}</span><Link href="/studio/pieces/new" style={{ fontWeight: 600, fontSize: 14 }}>+ Add piece</Link></div>
                  {pieces.slice(0, 5).map((p) => <Link key={p.id} href={`/studio/pieces/${p.id}`} className="row"><Img small src={p.images[0]} alt="" style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover' }} /><span style={{ flex: 1 }}>{p.title}</span><span className="num">{formatEUR(p.priceCents)}</span></Link>)}
                </div>
              </>
            ) : null}
          </div>

          <aside className={s.preview} aria-label="Preview">
            <span className="lbl m">How it looks in Discover</span>
            <div className={`g ${s.phone}`}>
              {cover[0] ? <Img src={cover[0]} alt="" className="u-cover" style={{ position: 'absolute', inset: 0 }} /> : <Img src={d.portraitUrl} alt="" className="u-cover" style={{ position: 'absolute', inset: 0 }} />}
              <div className="gs row" style={{ position: 'absolute', left: 10, right: 10, top: 12, borderRadius: 999, padding: 5 }}><Img small src={d.portraitUrl} alt="" className="u-avatar" style={{ width: 32, height: 32 }} /><span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}><span className="hand" style={{ fontSize: 13 }}>{d.name || 'Your name'}</span><span className="m" style={{ fontSize: 11 }}>{d.city}</span></span></div>
              <div className="g" style={{ position: 'absolute', left: 10, right: 10, bottom: 10, borderRadius: 18, padding: 12, fontSize: 13, lineHeight: 1.45 }}>{d.tagline || 'One line about your work'}
                {cover.length > 1 ? <div className="row" style={{ gap: 6, marginTop: 8 }}>{cover.map((u, i) => <Img small key={i} src={u} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} />)}</div> : null}
              </div>
            </div>
          </aside>
        </div>
        <div className="g u-bar">
          <button type="button" className="sec" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>Back</button>
          <button type="button" className="cta" onClick={next}>{step < 5 ? 'Continue' : 'Save profile'}</button>
        </div>
      </main>
    </>
  );
}
