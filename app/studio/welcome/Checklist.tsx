'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getChecklist, getMyMaker, goLive } from '@/lib/data';
import { useData } from '@/lib/useData';
import Sticker from '@/components/u/Sticker';
import { toast } from '@/components/u/Toast';
import Loading from '@/components/u/Loading';
import Wash from '@/components/u/Wash';
import s from '../studio.module.css';
import Img from '@/components/u/Img';

/** B3 You're in: four steps to Go live. Profile stays hidden until she presses Go live. */
export default function Checklist() {
  const router = useRouter();
  const [me] = useData(getMyMaker);
  const [c] = useData(getChecklist);
  if (!me || !c) return <Loading />;
  const rows = [
    { done: c.steps.profile, href: '/studio/profile', t: 'Set up your profile', d: 'Photo, a few words, three pieces for your collage' },
    { done: c.steps.pieces, href: '/studio/pieces/new', t: 'Add your first pieces', d: `At least 3, so buyers have something to look at${c.pieces ? ` · ${c.pieces} so far` : ''}` },
    { done: c.steps.payouts, href: '/studio/payouts', t: 'Connect payouts', d: 'So we can send you the money' },
    { done: c.steps.video, href: '/studio/post', t: 'Record a short video', d: 'Optional · 15–60 s of you at work' },
  ];
  const next = rows.find((r) => !r.done);
  const live = me.status === 'live';
  return (
    <>
      <Wash src={me.portraitUrl} />
      <main className="u-page narrow has-bar">
        <div style={{ position: 'relative', textAlign: 'center', paddingTop: 16 }}>
          <Img small src={me.portraitUrl} alt="" className="u-avatar" style={{ width: 96, height: 96, margin: '0 auto', border: '3px solid var(--u-ink)' }} />
          <span style={{ position: 'absolute', left: 'calc(50% + 30px)', top: 0 }}><Sticker k="new_maker" width={110} /></span>
          <h1 className="hand" style={{ fontSize: 26, margin: '16px 0 6px' }}>{live ? `You’re live, ${me.name}!` : `You’re in, ${me.name}!`}</h1>
          <p className="m m0">{live ? 'Buyers can find you in Discover now.' : 'Four short steps and buyers can find you.'}</p>
        </div>
        <div className="g u-card u-stack">
          <div className="row between"><span className="lbl">Get ready to go live</span><span className="m t-small">{c.done} of 4</span></div>
          <div className={s.steps}>{[0, 1, 2, 3].map((i) => <span key={i} className={i < c.done ? s.on : ''} />)}</div>
          {rows.map((r) => (
            <Link key={r.t} href={r.href} className="row" style={{ minHeight: 56 }}>
              <span className={`chk ${r.done ? 'on' : ''}`}>{r.done ? '✓' : ''}</span>
              <span className={s.grow}><span>{r.t}</span><span className="m">{r.d}</span></span>
              {next === r ? <span className="t-meta fw600 accent">Next</span> : null}<span className="m">›</span>
            </Link>
          ))}
        </div>
        <span className="m t-small lh-15">Your profile stays hidden until you press Go live. “New maker” shows on it for your first 30 days.</span>
        <div className="g u-bar">
          {live ? <Link href="/studio" className="cta">Open Studio</Link>
            : c.canGoLive ? <button type="button" className="cta" onClick={async () => { if (await goLive()) { toast('You’re live!'); router.push('/studio'); } }}>Go live</button>
              : <Link href={next?.href ?? '/studio/profile'} className="cta">{next?.t ?? 'Set up your profile'}</Link>}
        </div>
      </main>
    </>
  );
}
