'use client';
import Link from 'next/link';
import { getMyMaker } from '@/lib/data';
import { useData } from '@/lib/useData';
import { BackButton } from '@/components/u/Bits';
import Logo from '@/components/u/Logo';
import Wash from '@/components/u/Wash';
import Img from '@/components/u/Img';
import se from './sell.module.css';
import { useIsDesktop } from '@/lib/useIsDesktop';

const WHY = [['✦', 'A world, not a listing', 'Buyers meet you first: your photos, your video, your story. Then your pieces.'], ['€', 'You set your prices', 'No monthly fee. We only take a small cut when you sell.'], ['♥', 'People who care', 'A community that follows makers, not brands. Talk to buyers directly.']];

/** B1 Sell on Uplift. */
export default function Sell() {
  const [me] = useData(getMyMaker);
  const desktop = useIsDesktop();
  const cta = me ? <Link href="/studio" className="cta">Open your studio</Link> : <Link href="/sell/apply" className="cta">Apply to join</Link>;
  if (desktop) return (
    /* desktop-Sell: full-bleed photo, text and Apply left, four cards along the bottom */
    <>
      <div className={se.dPhoto} aria-hidden="true"><Img src="/img/mara-wheel.jpg" alt="" eager /></div>
      <header className={se.dHead}><Link href="/" aria-label="Uplift home"><Logo height={30} wordmark /></Link><Link href="/account" className="sec">Sign in</Link></header>
      <main className={se.dPage}>
        <div className={se.dText}>
          <h1 className="hand m0">Sell what you make</h1>
          <p className={se.lead}>Join a community of upcoming makers from the Baltics, Poland and Germany.</p>
          <div className="row gap-12">{cta}<span className="m t-small">5 minutes · we reply within 3 days</span></div>
        </div>
        <div className={se.dCards}>
          {WHY.map(([i, t, d]) => (
            <div key={t} className="g u-card u-stack gap-8"><span className={`chk on ${se.icon}`}>{i}</span><span className="fw600 t-16 mt-8">{t}</span><span className="m t-small lh-15">{d}</span></div>
          ))}
          <div className="g u-card flex col between"><span className="t-body">“I sold my first ring in the second week. Buyers write to me like friends.”</span><span className="row gap-8"><Img small src="/img/inez.jpg" alt="" className="u-avatar ph ph-36" /><span className="hand t-small">Inez, Vilnius</span></span></div>
        </div>
      </main>
    </>
  );
  return (
    <>
      <Wash src="/img/mara-wheel.jpg" />
      <main className={`u-page narrow has-bar ${se.page}`}>
        <div className={se.hero}>
          <Img src="/img/mara-wheel.jpg" alt="Mara at her pottery wheel" className="u-cover" />
          <div className={se.shade} />
          <span className={se.back}><BackButton href="/" /></span>
          <span className={se.logo}><Logo height={56} /></span>
          <div className={se.heroText}><h1 className="hand m0 t-28">Sell what you make</h1><p className={se.lead}>Join a community of upcoming makers from the Baltics, Poland and Germany.</p></div>
        </div>
        <div className="g u-card u-stack gap-16">
          {WHY.map(([i, t, d]) => (
            <div key={t} className="row ai-start"><span className={`chk on ${se.icon}`}>{i}</span><span className="flex col gap-4"><span className="fw600">{t}</span><span className="m t-small lh-15">{d}</span></span></div>
          ))}
        </div>
        <div className="g u-card u-stack">
          <span className="lbl">How it works</span>
          {['Show us your work (5 minutes)', 'We look at every maker by hand', 'Set up your profile and first pieces'].map((t, i) => <div key={t} className="row"><span className={`chk ${'circle'}`}>{i + 1}</span><span>{t}</span></div>)}
        </div>
        <div className="gs u-card row ai-start"><Img small src="/img/inez.jpg" alt="" className="u-avatar ph ph-44" /><span className="flex col gap-8"><span className="t-small lh-15">“I sold my first ring in the second week. Buyers write to me like friends.”</span><span className="hand m t-small">Inez, Vilnius</span></span></div>
        <span className="m t-small lh-15">Everything you sell must be made by you. We don’t accept resellers or mass-produced goods.</span>
        <div className="g u-bar">{cta}</div>
      </main>
    </>
  );
}
