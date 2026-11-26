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
import Img from '@/components/u/Img';

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
          <button type="button" className="chip" aria-pressed={tab === 'chats'} onClick={() => setTab('chats')}>{`Chats · ${threads.length}`}</button>
          <button type="button" className="chip" aria-pressed={tab === 'requests'} onClick={() => setTab('requests')}>{`Custom requests · ${reqs.length}`}</button>
          <button type="button" className="chip" aria-pressed={tab === 'reviews'} onClick={() => setTab('reviews')}>{`Reviews · ${reviews.length}`}</button>
        </div>
        {tab === 'chats' ? (
          open ? <Thread buyer={open} name={threads.find((t) => t.buyer === open)?.name ?? 'Buyer'} onBack={() => setOpen(null)} /> : (
            <div className={`g ${s.list}`}>
              {threads.map((t) => (
                <button className={s.threadBtn} key={t.buyer} type="button" onClick={() => setOpen(t.buyer)}>
                  <span className={`gs ${s.initial}`}><span className="hand">{t.name.slice(0, 1)}</span></span>
                  <span className={s.grow}><span>{t.name}</span><span className={`m ${'ellipsis'}`}>{t.last.fromMe ? '' : 'You: '}{t.last.text || 'Photo'}</span></span>
                  <span className="m t-meta">{ago(t.last.at)}</span>{t.waiting ? <span className={s.pip} aria-label="Waiting for your reply" /> : null}
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
    <div className="g u-card u-stack gap-8">
      <div className="row"><button type="button" className="ic" aria-label="Back to chats" onClick={onBack}>‹</button><span className="hand t-18">{name}</span></div>
      {msgs.map((x) => (
        <div className={s.bub + ' ' + (x.fromMe ? s.bubThem : s.bubMe)} key={x.id}>
          {x.imageUrl ? <Img className={s.bubImg} src={x.imageUrl} alt="" /> : null}{x.text}
          <span className={s.bubTime}>{shortDate(x.at)} {clock(x.at)}</span>
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
    <div className="g u-card u-stack gap-8">
      <div className="row between"><span className="fw600">{r.buyerName} · {r.kind}</span><span className="m t-meta">{shortDate(r.createdAt)} · {label}</span></div>
      <span className="t-small lh-15">“{r.text}”</span>
      <span className="m t-small">Budget {BUDGET_LABEL[r.budget]} · {r.when === 'by_date' ? `by ${r.date}` : 'no rush'}</span>
      {r.photos.length ? <div className="row gap-8">{r.photos.map((u, i) => <Img className="ph ph-56" small key={i} src={u} alt="" />)}</div> : null}
      {r.status === 'agreed' && r.listingId ? <Link href={`/p/${r.listingId}`} className="sec gs">See the private listing</Link> : null}
      {r.status !== 'agreed' && r.status !== 'declined' && !making ? (
        <div className="row gap-8">
          <button type="button" className="sec gs grow" onClick={async () => { await declineRequest(r.id); toast('Declined kindly'); }}>Decline</button>
          <button type="button" className="cta grow" onClick={() => setMaking(true)}>Send private listing</button>
        </div>
      ) : null}
      {making ? (
        <form className="u-stack" style={{ gap: 10 }} onSubmit={async (e) => {
          e.preventDefault(); if (!euros(price)) { toast('Add a price'); return; }
          await sendPrivateListing(r.id, { title, priceCents: euros(price), shipsWithinDays: parseInt(days, 10) || 14, description: desc, imageUrl: img });
          toast(`Sent to ${r.buyerName}. Only ${r.buyerName} can see it.`); setMaking(false);
        }}>
          <span className="m t-small">Agree on the details in chat first. {r.buyerName} sees this listing in your conversation and can buy it. Nobody else can.</span>
          <label className="fld"><span className="lbl">Name</span><input className="inp" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
          <div className={s.two}>
            <label className="fld"><span className="lbl">Price (€)</span><input className="inp" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="160" /></label>
            <label className="fld"><span className="lbl">Ready in (days)</span><input className="inp" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, ''))} /></label>
          </div>
          <label className="fld"><span className="lbl">What you’ll make</span><textarea className="inp" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} /></label>
          <div className="row gap-8">
            {img ? <Img className="ph ph-56" small src={img} alt="" /> : null}
            <button type="button" className="sec gs" onClick={() => file.current?.click()}>{img ? 'Change sketch' : 'Add a sketch or photo'}</button>
            <input ref={file} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) setImg(await uploadImage(f)); e.target.value = ''; }} />
          </div>
          <div className="row gap-8"><button type="button" className="sec" onClick={() => setMaking(false)}>Cancel</button><button type="submit" className="cta grow">Send listing{euros(price) ? ` · ${formatEUR(euros(price))}` : ''}</button></div>
        </form>
      ) : null}
    </div>
  );
}

function ReviewReply({ r }: { r: Awaited<ReturnType<typeof getStudioReviews>>[number] }) {
  const [text, setText] = useState(r.reply ?? '');
  const [edit, setEdit] = useState(false);
  return (
    <div className="g u-card u-stack gap-8">
      <div className="row between"><span className="fw600">{r.who}</span><span className="accent" aria-label={`${r.rating} of 5`}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span></div>
      <span className="t-small lh-15">{r.text || <span className="m">No text, just stars.</span>}</span>
      <span className="m t-meta">Bought {r.productTitle} · {shortDate(r.createdAt)}</span>
      {r.reply && !edit ? <div className={`gs ${'u-note'}`}><span className="m t-meta">Your reply</span><br />{r.reply} <button type="button" className="link m t-meta" onClick={() => setEdit(true)}>Edit</button></div> : (
        <form className="row" onSubmit={async (e) => { e.preventDefault(); await replyToReview(r.id, text); setEdit(false); toast(text.trim() ? 'Reply posted on your profile' : 'Reply removed'); }}>
          <input className="inp" placeholder="Say thank you (shown on your profile)" value={text} onChange={(e) => setText(e.target.value)} aria-label="Reply to review" />
          <button type="submit" className="cta">{r.reply ? 'Save' : 'Reply'}</button>
        </form>
      )}
    </div>
  );
}
