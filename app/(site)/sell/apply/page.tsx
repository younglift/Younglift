'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import type { Category } from '@/lib/types';
import { CATEGORY_LABEL, submitApplication, uploadImage } from '@/lib/data';
import { BackButton } from '@/components/u/Bits';
import Wash from '@/components/u/Wash';
import Img from '@/components/u/Img';
import Logo from '@/components/u/Logo';
import ap from './apply.module.css';

const CATS: Category[] = ['jewelry', 'ceramics', 'crochet', 'clothing', 'home', 'prints', 'other'];

/** B2 Show us your work (application, 3–10 photos). */
export default function Apply() {
  const [f, setF] = useState({ name: '', email: '', city: '', country: '', link: '', about: '' });
  const [cats, setCats] = useState<Category[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [self, setSelf] = useState(false);
  const [tried, setTried] = useState(false);
  const [sent, setSent] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const emailOk = /.+@.+\..+/.test(f.email);
  const ok = f.name.trim() && emailOk && f.city.trim() && f.country.trim() && cats.length && photos.length >= 3 && f.about.trim() && self;
  const bad = (c: boolean) => (tried && !c ? true : undefined);
  const send = async () => {
    setTried(true); if (!ok) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    await submitApplication({ ...f, link: f.link || undefined, categories: cats, photos, makesItself: self });
    setSent(true); window.scrollTo(0, 0);
  };
  if (sent) return (
    <>
      <Wash src={photos[0]} />
      <main className="u-page narrow has-bar">
        <div className="u-head"><BackButton href="/sell" /><h1 className="hand">Thank you, {f.name.split(' ')[0]}!</h1></div>
        <div className="g u-card u-stack"><span>We got your application and will look at your work by hand.</span><span className="m">We reply within 3 days to {f.email}. If you’re in, you’ll get a link to set up your studio.</span></div>
        <div className="gs u-card m t-small">Test version: there’s no email yet. The founders approve applications on the <Link className="underline" href="/admin">review page</Link>.</div>
        <div className="g u-bar"><Link href="/" className="cta">Back to Uplift</Link></div>
      </main>
    </>
  );
  return (
    <>
      <Wash src={photos[0] ?? '/img/plates.jpg'} />
      <header className={ap.head}><Link href="/" aria-label="Uplift home"><Logo height={28} wordmark /></Link></header>
      <main className={`u-page narrow has-bar ${ap.page}`}>
        <div className="u-head"><span className={ap.back}><BackButton href="/sell" /></span><span><h1 className="hand">Show us your work</h1><span className="m sub">Takes about 5 minutes. We reply within 3 days.</span></span></div>
        {tried && !ok ? <div className="gs u-card t-small" role="alert">A few things are missing. They’re marked below.</div> : null}
        <div className={`g u-card u-stack ${ap.form}`}>
          <span className={`lbl ${ap.sec}`}>About you</span>
          <label className="fld"><span className="lbl">Your name</span><input className="inp" autoComplete="name" value={f.name} onChange={set('name')} aria-invalid={bad(!!f.name.trim())} /></label>
          <label className="fld"><span className="lbl">Email</span><input className="inp" type="email" autoComplete="email" value={f.email} onChange={set('email')} aria-invalid={bad(emailOk)} /></label>
          <div className={ap.pair}>
            <label className="fld"><span className="lbl">City</span><input className="inp" value={f.city} onChange={set('city')} aria-invalid={bad(!!f.city.trim())} /></label>
            <label className="fld"><span className="lbl">Country</span><input className="inp" value={f.country} onChange={set('country')} aria-invalid={bad(!!f.country.trim())} /></label>
          </div>
          <label className={`fld ${ap.wide}`}><span className="lbl">Instagram or website</span><input className="inp" value={f.link} onChange={set('link')} placeholder="@yourstudio" /><span className="m t-meta">Optional, but it helps us get to know you.</span></label>
        </div>
        <div className="g u-card u-stack">
          <span className={`lbl ${ap.sec}`}>Your work</span>
          <div className="fld"><span className="lbl">What do you make?</span><div className="chips">{CATS.map((c) => <button key={c} type="button" className="chip" aria-pressed={cats.includes(c)} onClick={() => setCats(cats.includes(c) ? cats.filter((x) => x !== c) : [...cats, c])}>{CATEGORY_LABEL[c]}</button>)}</div>{tried && !cats.length ? <span className="t-meta accent">Pick at least one</span> : null}</div>
          <div className="fld">
            <span className="lbl">Photos of your work</span>
            <span className={`m t-meta${tried && photos.length < 3 ? ' accent' : ''}`}>{photos.length} of 3–10 · real pieces you made, at least one of you working</span>
            <div className="row wrap gap-8">
              {photos.map((u, i) => (
                <span key={i} className={ap.photo}><Img small src={u} alt="" className="u-cover" /><button type="button" aria-label="Remove photo" className={`gs ${ap.remove}`} onClick={() => setPhotos(photos.filter((_, j) => j !== i))}>✕</button></span>
              ))}
              {photos.length < 10 ? <button type="button" aria-label="Add photos" className={`gs ${ap.add}`} onClick={() => file.current?.click()}>+</button> : null}
              <input ref={file} type="file" accept="image/*" multiple hidden onChange={async (e) => { const fs = Array.from(e.target.files ?? []).slice(0, 10 - photos.length); setPhotos([...photos, ...(await Promise.all(fs.map(uploadImage)))]); e.target.value = ''; }} />
            </div>
          </div>
          <label className="fld"><span className="lbl">Tell us how you make it</span><textarea className="inp" rows={3} value={f.about} onChange={set('about')} aria-invalid={bad(!!f.about.trim())} /></label>
        </div>
        <label className="g u-card row pointer ai-start">
          <input type="checkbox" className="sr" checked={self} onChange={() => setSelf(!self)} />
          <span className={`chk ${self ? 'on' : ''}${tried && !self ? ' ' + ap.chkBad : ''}`} aria-hidden="true">{self ? '✓' : ''}</span>
          <span className="t-small lh-15">I make everything I’ll sell myself (alone or in my own small studio).</span>
        </label>
        <div className="g u-bar"><button type="button" className="cta" onClick={send}>Send application</button></div>
      </main>
    </>
  );
}
