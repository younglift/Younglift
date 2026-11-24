'use client';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { getMaker, getMessages, getProduct, isActive, markThreadRead, replyLine, sendMessage, uploadImage } from '@/lib/data';
import { clock, formatEUR, shortDate } from '@/lib/format';
import { useData } from '@/lib/useData';
import { BackButton } from '@/components/u/Bits';
import { Camera, Send } from '@/components/u/Icons';
import Loading from '@/components/u/Loading';
import Wash from '@/components/u/Wash';
import Inbox from '../Inbox';
import s from '../messages.module.css';
import Img from '@/components/u/Img';

const QUICK: Record<string, string[]> = {
  jewelry: ['When does it ship?', 'Gift wrap?', 'Other sizes?'],
  ceramics: ['Do you ship to Riga?', 'Can I pick a glaze?', 'Gift wrap?'],
};

/** Private listing card inside the chat (only this buyer can see it). */
function Listing({ id }: { id: string }) {
  const [d] = useData(() => getProduct(id), [id]);
  if (!d) return null;
  const p = d.product;
  return (
    <Link href={`/p/${p.id}`} className="g" style={{ display: 'flex', gap: 10, alignItems: 'center', borderRadius: 14, padding: 8, marginTop: 4, color: 'var(--u-ink)' }}>
      <Img className="ph ph-52" small src={p.images[0]} alt="" />
      <span className="grow flex col"><span className="hand t-small">{p.title}</span><span className="m t-meta">{p.sold ? 'Bought ✓' : `${formatEUR(p.priceCents)} · only for you`}</span></span>
      {!p.sold ? <span className="cta" style={{ minHeight: 36, padding: '0 12px', fontSize: 13 }}>View</span> : null}
    </Link>
  );
}

function Chat() {
  const { slug } = useParams<{ slug: string }>();
  const pieceId = useSearchParams().get('piece');
  const [m] = useData(() => getMaker(slug), [slug]);
  const [msgs] = useData(async () => { const x = await getMaker(slug); return x ? getMessages(x.id) : []; }, [slug]);
  const [piece] = useData(async () => {
    const x = await getMaker(slug); if (!x) return null;
    const id = pieceId ?? (await getMessages(x.id)).find((y) => y.productId)?.productId;
    return id ? (await getProduct(id))?.product ?? null : null;
  }, [slug, pieceId]);
  const [text, setText] = useState('');
  const end = useRef<HTMLDivElement>(null);
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => { if (m) markThreadRead(m.id); }, [m, msgs]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs?.length]);
  if (m === null) return <main className="u-page"><Wash /><span className="hand">Maker not found</span><Link href="/messages" className="cta">Messages</Link></main>;
  if (!m || !msgs) return <Loading />;
  const send = async (t: string, img?: string) => { if (!t.trim() && !img) return; await sendMessage(m.id, t, msgs.length ? undefined : piece?.id, img); setText(''); };
  const live = isActive(m);
  const reply = replyLine(m);
  let lastDay = '';

  return (
    <>
      <Wash src={piece?.images[0] ?? m.coverUrl} />
      <div className={s.split}>
        <aside className={s.side}><h1 className="hand" style={{ margin: '4px 4px 0', fontSize: 24 }}>Messages</h1><Inbox current={slug} /></aside>
        <div className={`${s.chat}`}>
          <div className={`g ${s.head}`}>
            <span className={`${s.back} flex`}><BackButton href="/messages" label="Back to messages" className="ic" /></span>
            <Link href={`/m/${m.slug}`} aria-label={`${m.name}’s profile`} className={s.avLink}><Img small src={m.portraitUrl} alt="" className="u-avatar" /></Link>
            <span className="grow flex col"><span className="hand t-16">{m.name}</span><span className={`m ${s.status}`}><span className={`${s.dot} ${live ? s.live : ''}`} />{live ? 'Active now' : 'Offline'}</span></span>
            <Link href={`/m/${m.slug}`} className="m tap" style={{ fontSize: 13, padding: '0 6px' }}>Profile</Link>
          </div>
          <div className={s.msgs} aria-live="polite">
            {piece ? <Link href={`/p/${piece.id}`} className={`gs ${s.piece}`}><Img small src={piece.images[0]} alt="" /><span>{piece.title} · <b>{formatEUR(piece.priceCents)}</b></span></Link> : null}
            {!msgs.length ? (
              <div className={`g ${s.empty}`}><Img small src={m.portraitUrl} alt="" className="u-avatar" /><span className="hand t-18">Ask {m.name} anything</span>{reply ? <span className="m t-small">{reply}. You’ll get a notification when she does.</span> : null}</div>
            ) : null}
            {msgs.map((x) => {
              const day = shortDate(x.at); const show = day !== lastDay; lastDay = day;
              const today = shortDate(new Date().toISOString()) === day;
              return (
                <div key={x.id} style={{ display: 'contents' }}>
                  {show ? <span className={`m ${s.day}`}>{today ? 'Today' : day}</span> : null}
                  <div className={`${s.b} ${x.fromMe ? s.mine : `gs ${s.theirs}`}`}>{x.imageUrl ? <Img src={x.imageUrl} alt="Photo you sent" /> : null}{x.text ? <span>{x.text}</span> : null}{x.listingId ? <Listing id={x.listingId} /> : null}<time>{clock(x.at)}</time></div>
                </div>
              );
            })}
            <div ref={end} />
          </div>
          <div className={s.quick}>{(QUICK[m.categories[0]] ?? ['When does it ship?', 'Gift wrap?', 'Do you take custom orders?']).map((q) => <button key={q} type="button" className="gs" onClick={() => send(q)}>{q}</button>)}</div>
          <form className={`g ${s.compose}`} onSubmit={(e) => { e.preventDefault(); send(text); }}>
            <button type="button" className="ic" aria-label="Add a photo" onClick={() => file.current?.click()}><Camera size={20} /></button>
            <input ref={file} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) await send('', await uploadImage(f)); e.target.value = ''; }} />
            <input aria-label={`Message ${m.name}`} placeholder={`Message ${m.name}`} value={text} onChange={(e) => setText(e.target.value)} />
            <button type="submit" aria-label="Send" className={`cta ${s.send}`} disabled={!text.trim()}><Send /></button>
          </form>
        </div>
      </div>
    </>
  );
}
export default function ChatPage() { return <Suspense fallback={<Loading />}><Chat /></Suspense>; }
