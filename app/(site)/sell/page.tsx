'use client';
import Link from 'next/link';
import { getMyMaker } from '@/lib/data';
import { useData } from '@/lib/useData';
import { BackButton } from '@/components/u/Bits';
import Logo from '@/components/u/Logo';
import Wash from '@/components/u/Wash';
import Img from '@/components/u/Img';
import se from './sell.module.css';

/** B1 Sell on Uplift. */
export default function Sell() {
  const [me] = useData(getMyMaker);
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
          {[['✦', 'A world, not a listing', 'Buyers meet you first: your photos, your video, your story. Then your pieces.'], ['€', 'You set your prices', 'No monthly fee. We only take a small cut when you sell.'], ['♥', 'People who care', 'A community that follows makers, not brands. Talk to buyers directly.']].map(([i, t, d]) => (
            <div key={t} className="row ai-start"><span className={`chk on ${se.icon}`}>{i}</span><span className="flex col gap-4"><span className="fw600">{t}</span><span className="m t-small lh-15">{d}</span></span></div>
          ))}
        </div>
        <div className="g u-card u-stack">
          <span className="lbl">How it works</span>
          {['Show us your work (5 minutes)', 'We look at every maker by hand', 'Set up your profile and first pieces'].map((t, i) => <div key={t} className="row"><span className={`chk ${'circle'}`}>{i + 1}</span><span>{t}</span></div>)}
        </div>
        <div className="gs u-card row ai-start"><Img small src="/img/inez.jpg" alt="" className="u-avatar ph ph-44" /><span className="flex col gap-8"><span className="t-small lh-15">“I sold my first ring in the second week. Buyers write to me like friends.”</span><span className="hand m t-small">Inez, Vilnius</span></span></div>
        <span className="m t-small lh-15">Everything you sell must be made by you. We don’t accept resellers or mass-produced goods.</span>
        <div className="g u-bar">{me ? <Link href="/studio" className="cta">Open your studio</Link> : <Link href="/sell/apply" className="cta">Apply to join</Link>}</div>
      </main>
    </>
  );
}
