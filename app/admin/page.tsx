'use client';
import Link from 'next/link';
import { CATEGORY_LABEL, approveApplication, getApplications, rejectApplication, switchToDemoMaker } from '@/lib/data';
import { shortDate } from '@/lib/format';
import { useData } from '@/lib/useData';
import { toast } from '@/components/u/Toast';
import Loading from '@/components/u/Loading';
import Wash from '@/components/u/Wash';
import Img from '@/components/u/Img';

/** Admin: review maker applications (approve / reject). Not designed yet; plain on purpose. Sign-in will protect it. */
export default function Admin() {
  const [apps] = useData(getApplications);
  if (!apps) return <Loading />;
  const pending = apps.filter((a) => a.status === 'pending');
  const done = apps.filter((a) => a.status !== 'pending');
  return (
    <>
      <Wash src="/img/studio-table.jpg" />
      <main className="u-page narrow">
        <div className="u-head"><span><h1 className="hand">Applications</h1><span className="m sub">{pending.length} waiting · reply within 3 days</span></span></div>
        {pending.map((a) => (
          <article key={a.id} className="g u-card u-stack">
            <div className="row" style={{ justifyContent: 'space-between' }}><span><b>{a.name}</b> <span className="m">· {a.city}, {a.country}</span></span><span className="m" style={{ fontSize: 12 }}>{shortDate(a.createdAt)}</span></div>
            <span className="m" style={{ fontSize: 13 }}>{a.email}{a.link ? ` · ${a.link}` : ''} · {a.categories.map((c) => CATEGORY_LABEL[c]).join(', ')}</span>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>{a.photos.map((u, i) => <Img small key={i} src={u} alt="" style={{ width: 96, height: 96, borderRadius: 14, objectFit: 'cover', flexShrink: 0 }} />)}</div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{a.about}</p>
            <span className="m" style={{ fontSize: 13 }}>{a.makesItself ? '✓ Makes everything herself' : '✗ Did not confirm she makes it herself'}</span>
            <div className="row" style={{ gap: 8 }}>
              <button type="button" className="sec gs" style={{ flex: 1 }} onClick={async () => { await rejectApplication(a.id); toast(`Rejected ${a.name.split(' ')[0]}`); }}>Reject</button>
              <button type="button" className="cta" style={{ flex: 1 }} onClick={async () => { await approveApplication(a.id); toast(`${a.name.split(' ')[0]} is in. Her studio is open (demo: it’s now yours).`); }}>Approve</button>
            </div>
          </article>
        ))}
        {!pending.length ? <div className="g u-card m">No applications waiting.</div> : null}
        {done.length ? <span className="lbl m">Decided</span> : null}
        {done.map((a) => (
          <div key={a.id} className="gs u-card row" style={{ justifyContent: 'space-between' }}><span>{a.name} <span className="m">· {a.city}</span></span>
            {a.status === 'approved' ? <Link href="/studio/welcome" style={{ fontWeight: 600 }}>Approved · open studio →</Link> : <span className="m">Rejected</span>}</div>
        ))}
        <div className="gs u-card u-stack" style={{ fontSize: 13 }}>
          <span className="m">Demo: approving makes that maker “you” in Studio. Switch back to Mara’s studio any time.</span>
          <button type="button" className="sec gs" onClick={async () => { await switchToDemoMaker(); toast('Studio is Mara’s again'); }}>Use Mara’s demo studio</button>
        </div>
      </main>
    </>
  );
}
