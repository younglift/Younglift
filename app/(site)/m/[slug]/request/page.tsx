'use client';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { BudgetBand, Category } from '@/lib/types';
import { BUDGET_LABEL, getMaker, getProduct, replyLine, sendCustomRequest, uploadImage } from '@/lib/data';
import { useData } from '@/lib/useData';
import { BackButton } from '@/components/u/Bits';
import Loading from '@/components/u/Loading';
import Wash from '@/components/u/Wash';

const KINDS: Partial<Record<Category, string[]>> = {
  jewelry: ['Ring', 'Necklace', 'Earrings', 'Bracelet'],
  ceramics: ['Plates', 'Cups', 'Bowl', 'Vase'],
  crochet: ['Bag', 'Hood', 'Cardigan', 'Blanket'],
  prints: ['Print', 'Poster', 'Card'],
};

/** 06 Custom request: form, then "Request sent" with what happens next. */
export default function CustomRequest() {
  const { slug } = useParams<{ slug: string }>();
  const q = useSearchParams();
  const [m] = useData(() => getMaker(slug), [slug]);
  const kinds = [...(m ? KINDS[m.categories[0]] ?? [] : []), 'Something else'];
  const [kind, setKind] = useState('');
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [budget, setBudget] = useState<BudgetBand>();
  const [when, setWhen] = useState<'no_rush' | 'by_date'>('no_rush');
  const [date, setDate] = useState('');
  const [sent, setSent] = useState(false);
  const [tried, setTried] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => { const like = q.get('like'); if (like) getProduct(like).then((d) => d && setPhotos([d.product.images[0]])); }, [q]);
  if (!m) return <Loading />;
  const ok = !!kind && text.trim().length > 5 && !!budget && (when === 'no_rush' || !!date.trim());
  const send = async () => {
    setTried(true); if (!ok) return;
    await sendCustomRequest({ makerId: m.id, kind, text, photos, budget: budget!, when, date: when === 'by_date' ? date : undefined });
    setSent(true); window.scrollTo(0, 0);
  };
  const reply = replyLine(m);

  if (sent) return (
    <>
      <Wash src={photos[0] ?? m.coverUrl} />
      <main className="u-page narrow has-bar">
        <div className="u-head"><BackButton href={`/m/${m.slug}`} /><h1 className="hand">Request sent</h1></div>
        <div className="g u-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <img src={m.portraitUrl} alt="" className="u-avatar" style={{ width: 64, height: 64 }} />
          <span className="hand" style={{ fontSize: 20 }}>{m.name} has your idea</span>
          <p className="m" style={{ margin: 0, lineHeight: 1.5 }}>{reply ? `${reply.replace(`${m.name} u`, 'She u')} with questions or a first sketch.` : 'She’ll reply with questions or a first sketch.'} Nothing is ordered or paid yet.</p>
        </div>
        <div className="g u-card u-stack">
          <span className="lbl">What happens next</span>
          {[`${m.name} replies in Messages`, 'You agree on the piece, price and date', 'She sends you a private listing to buy', 'She makes it and ships it'].map((t, i) => (
            <div key={t} className="row"><span className="chk" style={{ borderRadius: '50%' }}>{i + 1}</span><span>{t}</span></div>
          ))}
        </div>
        <div className="g u-bar"><Link href={`/messages/${m.slug}`} className="cta">Go to the conversation</Link></div>
      </main>
    </>
  );

  return (
    <>
      <Wash src={photos[0] ?? m.coverUrl} />
      <main className="u-page narrow has-bar">
        <div className="u-head" style={{ alignItems: 'flex-start' }}><BackButton href={`/m/${m.slug}`} /><span><h1 className="hand">Ask {m.name} to make it</h1><span className="m sub" style={{ lineHeight: 1.5 }}>Describe what you’d love. {m.name} replies with questions or a first idea. Nothing is ordered or paid yet.</span></span></div>
        {!m.customRequestsOpen ? <div className="gs u-card">{m.name} isn’t taking custom requests right now. You can still <Link href={`/messages/${m.slug}`} style={{ textDecoration: 'underline' }}>send her a message</Link>.</div> : null}
        <div className="g u-card u-stack" style={{ gap: 18 }}>
          <div className="fld"><span className="lbl">What kind of piece?</span><div className="chips">{kinds.map((k) => <button key={k} type="button" className="chip" aria-pressed={kind === k} onClick={() => setKind(k)}>{k}</button>)}</div>{tried && !kind ? <span className="m" style={{ fontSize: 12 }}>Pick one</span> : null}</div>
          <label className="fld"><span className="lbl">Tell {m.name} about it</span><textarea className="inp" rows={4} value={text} onChange={(e) => setText(e.target.value)} aria-invalid={tried && text.trim().length <= 5} placeholder="Size, colours, who it’s for, anything that matters." /><span className="m" style={{ fontSize: 12 }}>The more you share, the better the first idea.</span></label>
          <div className="fld">
            <span className="lbl">Reference photos <span className="m">(optional)</span></span>
            <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
              {photos.map((u, i) => (
                <span key={u + i} style={{ position: 'relative', width: 72, height: 72, borderRadius: 14, overflow: 'hidden' }}>
                  <img src={u} alt="" className="u-cover" />
                  <button type="button" aria-label="Remove photo" className="gs" style={{ position: 'absolute', right: 2, top: 2, width: 26, height: 26, borderRadius: '50%', color: 'var(--u-ink)', cursor: 'pointer', fontSize: 12 }} onClick={() => setPhotos(photos.filter((_, j) => j !== i))}>✕</button>
                </span>
              ))}
              {photos.length < 4 ? <button type="button" aria-label="Add a photo" className="gs" style={{ width: 72, height: 72, borderRadius: 14, color: 'var(--u-ink)', fontSize: 24, cursor: 'pointer' }} onClick={() => file.current?.click()}>+</button> : null}
              <input ref={file} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) setPhotos([...photos, await uploadImage(f)]); e.target.value = ''; }} />
            </div>
          </div>
          <div className="fld"><span className="lbl">Budget</span><div className="chips">{(Object.keys(BUDGET_LABEL) as BudgetBand[]).map((b) => <button key={b} type="button" className="chip" aria-pressed={budget === b} onClick={() => setBudget(b)}>{BUDGET_LABEL[b]}</button>)}</div>{tried && !budget ? <span className="m" style={{ fontSize: 12 }}>Pick a budget</span> : null}</div>
          <div className="fld">
            <span className="lbl">When do you need it?</span>
            <div className="chips"><button type="button" className="chip" aria-pressed={when === 'no_rush'} onClick={() => setWhen('no_rush')}>No rush</button><button type="button" className="chip" aria-pressed={when === 'by_date'} onClick={() => setWhen('by_date')}>By a date</button></div>
            {when === 'by_date' ? <input className="inp" type="text" value={date} onChange={(e) => setDate(e.target.value)} placeholder="e.g. 14 December" aria-label="Date" aria-invalid={tried && !date.trim()} /> : null}
          </div>
        </div>
        <span className="m" style={{ fontSize: 13, lineHeight: 1.5 }}>{m.name} takes custom orders.{reply ? ` ${reply.replace(`${m.name} u`, 'She u')}.` : ''} You only pay if you both agree on a piece and a price.</span>
        <div className="g u-bar"><button type="button" className="cta" onClick={send} disabled={!m.customRequestsOpen}>Send to {m.name}</button></div>
      </main>
    </>
  );
}
