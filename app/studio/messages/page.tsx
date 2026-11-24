'use client';
import { useState } from 'react';
import { BUDGET_LABEL, getMessages, getMyMaker, getStudioRequests, replyAsMaker } from '@/lib/data';
import { clock, shortDate } from '@/lib/format';
import { useData } from '@/lib/useData';
import { toast } from '@/components/u/Toast';
import Wash from '@/components/u/Wash';

/** Studio messages: custom requests and the conversation with buyers. */
export default function StudioMessages() {
  const [me] = useData(getMyMaker);
  const [reqs] = useData(getStudioRequests);
  const [msgs] = useData(async () => { const m = await getMyMaker(); return m ? getMessages(m.id) : []; });
  const [text, setText] = useState('');
  if (!me || !reqs || !msgs) return <Wash />;
  return (
    <>
      <Wash src={me.portraitUrl} />
      <main className="u-page narrow">
        <div className="u-head"><span><h1 className="hand">Messages</h1><span className="m sub">{reqs.filter((r) => r.status === 'sent').length} new requests</span></span></div>
        {reqs.length ? <span className="lbl m">Custom requests</span> : null}
        {reqs.map((r) => (
          <div key={r.id} className="g u-card u-stack" style={{ gap: 8 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}><span style={{ fontWeight: 600 }}>{r.buyerName} · {r.kind}</span><span className="m" style={{ fontSize: 12 }}>{shortDate(r.createdAt)} · {r.status === 'sent' ? 'New' : 'Replied'}</span></div>
            <span style={{ fontSize: 14, lineHeight: 1.5 }}>“{r.text}”</span>
            <span className="m" style={{ fontSize: 13 }}>Budget {BUDGET_LABEL[r.budget]} · {r.when === 'by_date' ? `by ${r.date}` : 'no rush'}</span>
            {r.photos.length ? <div className="row" style={{ gap: 6 }}>{r.photos.map((u, i) => <img key={i} src={u} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover' }} />)}</div> : null}
          </div>
        ))}
        <span className="lbl m">Conversation with {msgs.length ? 'Lina' : 'buyers'}</span>
        <div className="g u-card u-stack" style={{ gap: 8 }}>
          {msgs.map((x) => (
            <div key={x.id} style={{ alignSelf: x.fromMe ? 'flex-start' : 'flex-end', maxWidth: '80%', background: x.fromMe ? 'var(--u-glass-sm)' : 'var(--u-cta)', color: x.fromMe ? 'var(--u-ink)' : 'var(--u-on-accent)', borderRadius: 18, padding: '9px 13px', fontSize: 14, lineHeight: 1.45 }}>
              {x.imageUrl ? <img src={x.imageUrl} alt="" style={{ borderRadius: 12, maxWidth: 200, display: 'block' }} /> : null}{x.text}<span style={{ display: 'block', fontSize: 11, opacity: 0.7, textAlign: 'right' }}>{clock(x.at)}</span>
            </div>
          ))}
          {!msgs.length ? <span className="m">No messages yet.</span> : null}
          <form className="row" onSubmit={async (e) => { e.preventDefault(); if (!text.trim()) return; await replyAsMaker(text); setText(''); toast('Sent'); }}>
            <input className="inp" placeholder="Write a reply" value={text} onChange={(e) => setText(e.target.value)} aria-label="Reply" />
            <button type="submit" className="cta" disabled={!text.trim()}>Send</button>
          </form>
        </div>
      </main>
    </>
  );
}
