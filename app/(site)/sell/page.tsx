'use client';
import Link from 'next/link';
import { getMyMaker } from '@/lib/data';
import { useData } from '@/lib/useData';
import { BackButton } from '@/components/u/Bits';
import Logo from '@/components/u/Logo';
import Wash from '@/components/u/Wash';
import Img from '@/components/u/Img';

/** B1 Sell on Uplift. */
export default function Sell() {
  const [me] = useData(getMyMaker);
  return (
    <>
      <Wash src="/img/mara-wheel.jpg" />
      <main className="u-page narrow has-bar" style={{ paddingTop: 0 }}>
        <div style={{ position: 'relative', margin: '0 -16px', height: 360 }}>
          <Img src="/img/mara-wheel.jpg" alt="Mara at her pottery wheel" className="u-cover" />
          <div style={{ position: 'absolute', inset: 0, background: 'var(--u-scrim-bottom)' }} />
          <span style={{ position: 'absolute', left: 14, top: 'calc(14px + env(safe-area-inset-top))' }}><BackButton href="/" /></span>
          <span style={{ position: 'absolute', right: 16, top: 'calc(16px + env(safe-area-inset-top))' }}><Logo height={56} /></span>
          <div style={{ position: 'absolute', left: 16, right: 16, bottom: 18 }}><h1 className="hand" style={{ margin: 0, fontSize: 28 }}>Sell what you make</h1><p style={{ margin: '8px 0 0', lineHeight: 1.5 }}>Join a community of upcoming makers from the Baltics, Poland and Germany.</p></div>
        </div>
        <div className="g u-card u-stack" style={{ gap: 16 }}>
          {[['✦', 'A world, not a listing', 'Buyers meet you first: your photos, your video, your story. Then your pieces.'], ['€', 'You set your prices', 'No monthly fee. We only take a small cut when you sell.'], ['♥', 'People who care', 'A community that follows makers, not brands. Talk to buyers directly.']].map(([i, t, d]) => (
            <div key={t} className="row" style={{ alignItems: 'flex-start' }}><span className="chk on" style={{ width: 34, height: 34, borderRadius: 12, fontSize: 15 }}>{i}</span><span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span style={{ fontWeight: 600 }}>{t}</span><span className="m" style={{ fontSize: 14, lineHeight: 1.5 }}>{d}</span></span></div>
          ))}
        </div>
        <div className="g u-card u-stack">
          <span className="lbl">How it works</span>
          {['Show us your work (5 minutes)', 'We look at every maker by hand', 'Set up your profile and first pieces'].map((t, i) => <div key={t} className="row"><span className="chk" style={{ borderRadius: '50%' }}>{i + 1}</span><span>{t}</span></div>)}
        </div>
        <div className="gs u-card row" style={{ alignItems: 'flex-start' }}><Img small src="/img/inez.jpg" alt="" className="u-avatar" style={{ width: 44, height: 44 }} /><span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><span style={{ fontSize: 14, lineHeight: 1.5 }}>“I sold my first ring in the second week. Buyers write to me like friends.”</span><span className="hand m" style={{ fontSize: 13 }}>Inez, Vilnius</span></span></div>
        <span className="m" style={{ fontSize: 13, lineHeight: 1.5 }}>Everything you sell must be made by you. We don’t accept resellers or mass-produced goods.</span>
        <div className="g u-bar">{me ? <Link href="/studio" className="cta">Open your studio</Link> : <Link href="/sell/apply" className="cta">Apply to join</Link>}</div>
      </main>
    </>
  );
}
