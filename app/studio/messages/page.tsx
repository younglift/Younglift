'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import type { CustomRequest } from '@/lib/types';
import {
  BUDGET_LABEL, declineRequest, getMyMaker, getStudioMessages, getStudioRequests, getStudioReviews, getStudioThreads,
  replyAsMaker, replyToReview, sendPrivateListing, uploadImage,
} from '@/lib/data';
import { ago, clock, formatEUR, shortDate } from '@/lib/format';
import { useData } from '@/lib/useData';
import { toast } from '@/components/u/Toast';
import Loading from '@/components/u/Loading';
import Wash from '@/components/u/Wash';
import s from '../studio.module.css';

const euros = (v: string) => Math.round(parseFloat(v.replace(',', '.').replace(/[^0-9.]/g, '')) * 100) || 0;

/** Studio messages: custom requests (→ private listing), conversations per buyer, reviews with replies. */
export default function StudioMessages() {
  const [me] = useData(getMyMaker);
  const [reqs] = useData(getStudioRequests);
  const [threads] = useData(getStudioThreads);
  const [reviews] = useData(getStudioReviews);
  const [open, setOpen] = useState<string | null>(null);
  const [tab, setTab] = useState<'chats' | 'requests' | 'reviews'>('chats');
  if (!me || !reqs || !threads || !reviews) return <Loading />;
  const newReq = reqs.filter((r) => r.status === 'sent' || r.status === 'replied').length;
  return (
    <>
      <Wash src={me.portraitUrl} />
      <main className="u-page narrow">
        <div className="u-head"><span><h1 className="hand">Messages</h1><span className="m sub">{threads.filter((t) => t.waiting).length} waiting for you · {newReq} open requests</span></span></div>
        <div className="chips">
          <button type="button" className="chip" aria-pressed={tab === 'chats'} onClick={() => setTab('chats')}>Chats · {threads.length}</button>
          <button type="button" className="chip" aria-pressed={tab === 'requests'} onClick={() => setTab('requests')}>Custom requests · {reqs.length}</button>
          <button type="button" className="chip" aria-pressed={tab === 'reviews'} onClick={() => setTab('reviews')}>Reviews · {reviews.length}</button>
        </div>
        {tab === 'chats' ? (
          open ? <Thread buyer={open} name={threads.find((t) => t.buyer === open)?.name ?? 'Buyer'} onBack={() => setOpen(null)} /> : (
            <div className={`g ${s.list}`}>
              {threads.map((t) => (
                <button key={t.buyer} type="button" onClick={() => setOpen(t.buyer)} style={{ background: 'none', border: 0, color: 'var(--u-ink)', textAlign: 'left', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', minHeight: 68 }}>
                  <span className="gs" style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span className="hand">{t.name.slice(0, 1)}</span></span>
                  <span className={s.grow}><span>{t.name}</span><span className="m" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.last.fromMe ? '' : 'You: '}{t.last.text || 'Photo'}</span></span>
                  <span className="m" style={{ fontSize: 12 }}>{ago(t.last.at)}</span>{t.waiting ? <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--u-accent)' }} aria-label="Waiting for your reply" /> : null}
                </button>
              ))}
              {!threads.length ? <div className="m">No messages yet. Buyers can write to you from your profile and pieces.</div> : null}
            </div>
          )
        ) : null}
        {tab === 'requests' ? (
          <>
            {reqs.map((r) => <Request key={r.id} r={r} />)}
            {!reqs.length ? <div className="g u-card m">{me.customRequestsOpen ? 'No custom requests yet.' : 'Custom requests are closed. Turn them on in your profile.'}</div> : null}
          </>
        ) : null}
        {tab === 'reviews' ? (
          <>
            {reviews.map((r) => <ReviewReply key={r.id} r={r} />)}
            {!reviews.length ? <div className="g u-card m">No reviews yet. Buyers can review after their order arrives.</div> : null}
          </>
        ) : null}
      </main>
    </>
  );
}

function Thread({ buyer, name, onBack }: { buyer: string; name: string; onBack: () => void }) {
  const [msgs] = useData(() => getStudioMessages(buyer), [buyer]);
  const [text, setText] = useState('');
  if (!msgs) return null;
  return (
    <div className="g u-card u-stack" style={{ gap: 8 }}>
      <div className="row"><button type="button" className="ic" aria-label="Back to chats" onClick={onBack}>‹</button><span className="hand" style={{ fontSize: 18 }}>{name}</span></div>
      {msgs.map((x) => (
        <div key={x.id} style={{ alignSelf: x.fromMe ? 'flex-start' : 'flex-end', maxWidth: '80%', background: x.fromMe ? 'var(--u-glass-sm)' : 'var(--u-cta)', color: x.fromMe ? 'var(--u-ink)' : 'var(--u-on-accent)', borderRadius: 18, padding: '9px 13px', fontSize: 14, lineHeight: 1.45 }}>
          {x.imageUrl ? <img src={x.imageUrl} alt="" style={{ borderRadius: 12, maxWidth: 200, display: 'block' }} /> : null}{x.text}
          <span style={{ display: 'block', fontSize: 11, opacity: 0.7, textAlign: 'right' }}>{shortDate(x.at)} {clock(x.at)}</span>
        </div>
      ))}
      <form className="row" onSubmit={async (e) => { e.preventDefault(); if (!text.trim()) return; await replyAsMaker(text, buyer); setText(''); }}>
        <input className="inp" placeholder={`Reply to ${name}`} value={text} onChange={(e) => setText(e.target.value)} aria-label="Reply" />
        <button type="submit" className="cta" disabled={!text.trim()}>Send</button>
      </form>
    </div>
  );
}

function Request({ r }: { r: CustomRequest }) {
  const [making, setMaking] = useState(false);
  const [title, setTitle] = useState(`${r.kind} for ${r.buyerName}`);
  const [price, setPrice] = useState('');
  const [days, setDays] = useState('14');
  const [desc, setDesc] = useState(r.text);
  const [img, setImg] = useState<string>();
  const file = useRef<HTMLInputElement>(null);
  const label = { sent: 'New', replied: 'Replied', agreed: 'Listing sent', declined: 'Declined' }[r.status];
  return (
    <div className="g u-card u-stack" style={{ gap: 8 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}><span style={{ fontWeight: 600 }}>{r.buyerName} · {r.kind}</span><span className="m" style={{ fontSize: 12 }}>{shortDate(r.createdAt)} · {label}</span></div>
      <span style={{ fontSize: 14, lineHeight: 1.5 }}>“{r.text}”</span>
      <span className="m" style={{ fontSize: 13 }}>Budget {BUDGET_LABEL[r.budget]} · {r.when === 'by_date' ? `by ${r.date}` : 'no rush'}</span>
      {r.photos.length ? <div className="row" style={{ gap: 6 }}>{r.photos.map((u, i) => <img key={i} src={u} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover' }} />)}</div> : null}
      {r.status === 'agreed' && r.listingId ? <Link href={`/p/${r.listingId}`} className="sec gs">See the private listing</Link> : null}
      {r.status !== 'agreed' && r.status !== 'declined' && !making ? (
        <div className="row" style={{ gap: 8 }}>
          <button type="button" className="sec gs" style={{ flex: 1 }} onClick={async () => { await declineRequest(r.id); toast('Declined kindly'); }}>Decline</button>
          <button type="button" className="cta" style={{ flex: 1.4 }} onClick={() => setMaking(true)}>Send private listing</button>
        </div>
      ) : null}
      {making ? (
        <form className="u-stack" style={{ gap: 10 }} onSubmit={async (e) => {
          e.preventDefault(); if (!euros(price)) { toast('Add a price'); return; }
          await sendPrivateListing(r.id, { title, priceCents: euros(price), shipsWithinDays: parseInt(days, 10) || 14, description: desc, imageUrl: img });
          toast(`Sent to ${r.buyerName}. Only she can see it.`); setMaking(false);
        }}>
          <span className="m" style={{ fontSize: 13 }}>Agree on the details in chat first. {r.buyerName} sees this listing in your conversation and can buy it. Nobody else can.</span>
          <label className="fld"><span className="lbl">Name</span><input className="inp" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
          <div className={s.two}>
            <label className="fld"><span className="lbl">Price (€)</span><input className="inp" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="160" /></label>
            <label className="fld"><span className="lbl">Ready in (days)</span><input className="inp" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, ''))} /></label>
          </div>
          <label className="fld"><span className="lbl">What you’ll make</span><textarea className="inp" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} /></label>
          <div className="row" style={{ gap: 8 }}>
            {img ? <img src={img} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover' }} /> : null}
            <button type="button" className="sec gs" onClick={() => file.current?.click()}>{img ? 'Change sketch' : 'Add a sketch or photo'}</button>
            <input ref={file} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) setImg(await uploadImage(f)); e.target.value = ''; }} />
          </div>
          <div className="row" style={{ gap: 8 }}><button type="button" className="sec" onClick={() => setMaking(false)}>Cancel</button><button type="submit" className="cta" style={{ flex: 1 }}>Send listing{euros(price) ? ` · ${formatEUR(euros(price))}` : ''}</button></div>
        </form>
      ) : null}
    </div>
  );
}

function ReviewReply({ r }: { r: Awaited<ReturnType<typeof getStudioReviews>>[number] }) {
  const [text, setText] = useState(r.reply ?? '');
  const [edit, setEdit] = useState(false);
  return (
    <div className="g u-card u-stack" style={{ gap: 8 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}><span style={{ fontWeight: 600 }}>{r.who}</span><span style={{ color: 'var(--u-accent)' }} aria-label={`${r.rating} of 5`}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span></div>
      <span style={{ fontSize: 14, lineHeight: 1.5 }}>{r.text || <span className="m">No text, just stars.</span>}</span>
      <span className="m" style={{ fontSize: 12 }}>Bought {r.productTitle} · {shortDate(r.createdAt)}</span>
      {r.reply && !edit ? <div className="gs" style={{ borderRadius: 14, padding: '10px 12px', fontSize: 14 }}><span className="m" style={{ fontSize: 12 }}>Your reply</span><br />{r.reply} <button type="button" className="link m" style={{ fontSize: 12 }} onClick={() => setEdit(true)}>Edit</button></div> : (
        <form className="row" onSubmit={async (e) => { e.preventDefault(); await replyToReview(r.id, text); setEdit(false); toast(text.trim() ? 'Reply posted on your profile' : 'Reply removed'); }}>
          <input className="inp" placeholder="Say thank you (shown on your profile)" value={text} onChange={(e) => setText(e.target.value)} aria-label="Reply to review" />
          <button type="submit" className="cta">{r.reply ? 'Save' : 'Reply'}</button>
        </form>
      )}
    </div>
  );
}
