'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Maker, Product } from '@/lib/types';
import { getMaker, getMessages, getProduct, MAKER_EXTRAS, sendMessage, type ChatMessage } from '@/lib/data';
import { formatEUR } from '@/lib/format';
import { chatTime } from '@/lib/time';
import { backTarget } from '@/lib/ui';
import s from './chat.module.css';

// A9 · Conversation + Custom request (docs/design/screens/Messages*.dc.html, ReplyD).
// No fake "Active now": the header shows the maker; an empty chat shows the usual reply time.

const QUICK = ['Could you make this in my size?', 'Would this work in another colour?', 'Can you make something similar as a gift?'];
const BUDGETS = ['Under 150€', '150–300€', '300–500€', 'Over 500€'];

export default function Chat({ slug, tab: startTab, productId, from }: { slug: string; tab: 'msg' | 'req'; productId: string | null; from: string | null }) {
  const router = useRouter();
  const [m, setM] = useState<Maker | null | undefined>(undefined);
  const [ctx, setCtx] = useState<Product | null>(null);
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [tab, setTab] = useState(startTab);
  const [draft, setDraft] = useState('');
  const [req, setReq] = useState('');
  const [budget, setBudget] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getMaker(slug).then(async (mk) => {
      setM(mk);
      if (!mk) return;
      setMsgs(await getMessages(mk.id));
      if (productId) { const d = await getProduct(productId); if (d && d.maker.id === mk.id) setCtx(d.product); }
    });
  }, [slug, productId]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs, tab]);

  if (m === undefined) return <main className={s.screen} />;
  if (m === null) return <main className={s.screen}><p className={s.missing}>Maker not found. <Link href="/messages">Messages</Link></p></main>;

  const x = MAKER_EXTRAS[m.id];
  const back = from?.startsWith('product:') ? { href: `/product/${from.slice(8)}`, label: 'Back' } : from ? backTarget(from, (sl) => (sl === m.slug ? m.name : undefined)) : { href: '/messages', label: 'Messages' };

  async function send(text: string) {
    if (!text.trim() || !m) return;
    const msg = await sendMessage(m.id, text, ctx?.id);
    setMsgs((list) => [...list, msg]);
    setDraft('');
  }
  async function sendRequest() {
    if (!req.trim() || !budget || !m) return;
    const msg = await sendMessage(m.id, `Custom request: ${req.trim()}`, ctx?.id, { budget });
    setMsgs((list) => [...list, msg]);
    setSent(true);
  }

  return (
    <main className={s.screen}>
      <header className={s.top}>
        <button type="button" className={s.back} onClick={() => (window.history.length > 1 ? router.back() : router.push(back.href))}>‹ {back.label}</button>
        <Link href={`/maker/${m.slug}?from=messages`} className={s.who}>
          <span className={s.whoName}>{m.name}</span>
          <img src={m.portraitUrl} alt="" />
        </Link>
      </header>
      <div className={s.tabs}>
        <button type="button" aria-pressed={tab === 'msg'} className={tab === 'msg' ? s.tabOn : s.tab} onClick={() => setTab('msg')}>Message</button>
        <button type="button" aria-pressed={tab === 'req'} className={tab === 'req' ? s.tabOn : s.tab} onClick={() => setTab('req')}>Custom request</button>
      </div>

      {tab === 'msg' ? (
        <>
          <div className={s.thread}>
            {ctx && (
              <Link href={`/product/${ctx.id}?from=messages`} className={s.ctx}>
                <img src={ctx.images[0]} alt="" />
                <span><span className={s.ctxKick}>About this piece</span><span>{ctx.title} · <span className="mono">{formatEUR(ctx.priceCents)}</span></span></span>
              </Link>
            )}
            {msgs.map((g) => (
              <div key={g.id} className={g.me ? s.me : s.them}>
                <span>{g.text}{g.request ? ` (${g.request.budget})` : ''}</span>
                <span className={`mono ${s.when}`}>{chatTime(g.at)}</span>
              </div>
            ))}
            <div ref={end} />
          </div>
          <div className={s.composer}>
            {msgs.length === 0 && x?.replyTime && <div className={s.hint}>{m.name} usually replies within {x.replyTime.replace('about ', '').replace('a few hours', 'a few hours')}</div>}
            <div className={`noscroll ${s.quick}`}>
              {QUICK.map((q) => <button key={q} type="button" onClick={() => send(q)}>{q}</button>)}
            </div>
            <form className={s.inputRow} onSubmit={(e) => { e.preventDefault(); send(draft); }}>
              <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Write to ${m.name}`} aria-label="Write a message" />
              <button type="submit" aria-label="Send" className={draft.trim() ? s.sendOn : s.send}>
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5" /><path d="M6 11l6-6 6 6" /></svg>
              </button>
            </form>
          </div>
        </>
      ) : (
        <div className={s.request}>
          {sent ? (
            <div className={s.sent}>
              <span className={s.sentTitle}><span aria-hidden="true" className={s.dot} />Request sent to {m.name}</span>
              <span>You’ll get an answer{x ? ` in ${x.replyTime}` : ''}, with a price and a date. Nothing is paid until you say yes.</span>
              <button type="button" className={s.linkBtn} onClick={() => setTab('msg')}>See the conversation</button>
            </div>
          ) : (
            <>
              <h2 className={s.reqTitle}>ASK {m.name.toUpperCase()} TO MAKE SOMETHING</h2>
              {ctx && <span className={s.reqCtx}>About: {ctx.title}</span>}
              <label className={s.field}>
                <span>What would you like?</span>
                <textarea rows={4} value={req} onChange={(e) => setReq(e.target.value)} placeholder={ctx ? `e.g. The ${ctx.title} in another size or colour` : 'e.g. A ring like the Flow ring, a bit wider'} />
              </label>
              <div className={s.field}>
                <span>Budget</span>
                <div className={s.budgets}>
                  {BUDGETS.map((b) => <button key={b} type="button" aria-pressed={budget === b} className={budget === b ? s.budgetOn : s.budget} onClick={() => setBudget(b)}>{b}</button>)}
                </div>
              </div>
              <button type="button" className={req.trim() && budget ? s.sendReqOn : s.sendReq} onClick={sendRequest} disabled={!req.trim() || !budget}>SEND REQUEST</button>
            </>
          )}
        </div>
      )}
    </main>
  );
}
