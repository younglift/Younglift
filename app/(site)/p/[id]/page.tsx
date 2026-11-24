'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { getBag, getMakerProducts, getProduct, getReviews, getSimilar, replyLine } from '@/lib/data';
import { formatEUR, formatEURExact, shipsLine } from '@/lib/format';
import { useData } from '@/lib/useData';
import { useIsDesktop } from '@/lib/useIsDesktop';
import { useLockBody } from '@/lib/useLockBody';
import { BackButton, SaveButton, useAddToBag } from '@/components/u/Bits';
import { Close } from '@/components/u/Icons';
import MakerProfile from '@/components/u/MakerProfile';
import Sticker from '@/components/u/Sticker';
import Loading from '@/components/u/Loading';
import Sheet from '@/components/u/Sheet';
import Wash from '@/components/u/Wash';
import s from './product.module.css';
import Img from '@/components/u/Img';

/** 04 Piece: ready to ship / made to size / sold. Desktop: a window over her profile. */
export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const add = useAddToBag();
  const [data] = useData(() => getProduct(id), [id]);
  const [more] = useData(() => getSimilar(id), [id]);
  // her profile behind the window is drawn only on desktop (FIXES 1.1)
  const [all] = useData(async () => { const d = await getProduct(id); return d && window.matchMedia('(min-width: 820px)').matches ? getMakerProducts(d.maker.id) : []; }, [id]);
  const [reviews] = useData(async () => { const d = await getProduct(id); return d ? getReviews(d.maker.id) : []; }, [id]);
  const [bag] = useData(getBag);
  const [img, setImg] = useState(0);
  const [size, setSize] = useState<string>();
  const [guide, setGuide] = useState(false);
  const desktop = useIsDesktop();
  useLockBody(!!desktop && !guide, () => { if (window.history.length > 1) router.back(); });
  if (data === null) return (<main className="u-page"><Wash /><BackButton /><span className="hand t-22">This piece is gone</span><Link href="/explore" className="cta">Explore</Link></main>);
  if (!data) return <Loading />;
  const { product: p, maker: m } = data;
  const inBag = (bag?.groups ?? []).some((g) => g.lines.some((l) => l.productId === p.id));
  const r = replyLine(m);
  const tags = p.privateFor ? ['Only for you', shipsLine({ madeToOrder: true, shipsWithinDays: p.shipsWithinDays })] : p.sold ? ['Sold', p.oneOfAKind ? '1 of 1' : `${p.madeCount} made`] : [p.oneOfAKind ? '1 of 1' : p.madeToOrder ? (p.sizes ? 'Made to size' : 'Made to order') : p.madeCount > 1 ? `${p.stock} of ${p.madeCount} left` : '', ...p.materials, shipsLine(p)].filter(Boolean);
  const close = () => (window.history.length > 1 ? router.back() : router.push(`/m/${m.slug}`));
  const sizeLabel = p.sizes?.label ?? 'Size';
  const addIt = async () => {
    if (p.sizes && !size) { document.getElementById('sizes')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return add(p); }
    return add(p, p.sizes ? { [sizeLabel]: size! } : undefined);
  };
  const subline = p.sold ? '' : p.heldByOther ? 'In someone’s bag for up to 15 min' : p.oneOfAKind ? 'Only one made' : p.sizes && size ? `Size ${size} · ${shipsLine(p).toLowerCase()}` : p.madeToOrder ? shipsLine(p) : `${p.stock} left`;
  const ctaLabel = inBag ? 'In your bag ✓' : p.heldByOther ? 'In someone’s bag' : p.sizes && size ? `Add to bag · size ${size}` : 'Add to bag';

  return (
    <>
      <Wash src={p.images[0]} />
      {desktop ? <div className={`${s.behind} ${s.deskOnly}`} aria-hidden="true">{all ? <div className="w-full"><MakerProfile maker={m} products={all} desktop /></div> : null}</div> : null}
      {desktop ? <button type="button" className={`${s.scrimD} ${s.deskOnly} u-scrim`} aria-label="Close" onClick={close} /> : null}
      <div className={`${s.scroll} u-fade-in`} role="dialog" aria-label={p.title}>
        <div className={s.hero}>
          <Img src={p.images[img] ?? p.images[0]} alt={`${p.title} by ${m.name}`} eager />
          {p.stickers?.maker && !p.sold ? <span className={s.stk}><Sticker k={p.stickers.maker} city={m.city} width={110} /></span> : null}
          {p.images.length > 1 ? (
            <>
              <div className={s.dots}>{p.images.map((_, i) => <button key={i} type="button" aria-label={`Photo ${i + 1}`} aria-current={i === img} onClick={() => setImg(i)}><span /></button>)}</div>
              <div className={s.thumbs}>{p.images.map((u, i) => <button key={u + i} type="button" aria-label={`Photo ${i + 1}`} aria-current={i === img} onClick={() => setImg(i)}><Img small src={u} alt="" className="u-cover" /></button>)}</div>
            </>
          ) : null}
        </div>
        <div className={`g ${s.card}`}>
          {desktop ? <button type="button" className={`ic gs ${s.close} ${s.deskOnly}`} aria-label="Close" onClick={close}><Close /></button> : null}
          <div className={s.tags}>{tags.map((t) => <span key={t} className="gs">{t}</span>)}</div>
          <div className={s.title}><h1 className="hand">{p.title}</h1><span>{formatEUR(p.priceCents)}</span></div>
          {p.sold ? (
            <>
              <div className={`gs ${s.found}`}><span className="hand">This piece found a home</span><span className="m t-small">{p.oneOfAKind ? 'It was one of a kind.' : 'This run is sold out.'} {m.name} can make you something in the same spirit.</span></div>
              {desktop ? <Link href={m.customRequestsOpen ? `/m/${m.slug}/request?like=${p.id}` : `/messages/${m.slug}?piece=${p.id}`} className={`cta ${s.deskOnly}`}>Ask {m.name} for something similar</Link> : null}
              {more?.length ? (
                <>
                  <span className="lbl">More from {m.name}</span>
                  <div className={s.more}>{more.map((x) => <Link key={x.id} href={`/p/${x.id}`}><Img small src={x.images[0]} alt="" /><span>{x.title}</span><span className="m">{formatEUR(x.priceCents)}</span></Link>)}</div>
                </>
              ) : null}
            </>
          ) : (
            <>
              {p.sizes ? (
                <div id="sizes" className="u-stack gap-8">
                  <div className="row between"><span className="lbl">{sizeLabel}</span><button type="button" className="link m t-small" onClick={() => setGuide(true)}>Size guide</button></div>
                  <div className={s.sizes} style={{ gridTemplateColumns: `repeat(${Math.min(6, p.sizes.options.length)},1fr)` }}>
                    {p.sizes.options.map((o) => <button key={o} type="button" aria-pressed={size === o} disabled={p.sizes!.unavailable?.includes(o)} onClick={() => setSize(o)}>{o}</button>)}
                  </div>
                  <span className="m t-small">Not sure? <Link href={`/messages/${m.slug}?piece=${p.id}`} className="tap underline">Ask {m.name}</Link> before you order.</span>
                </div>
              ) : null}
              <p className={s.desc}>{p.description}</p>
              {desktop ? <div className={`${s.deskOnly} row`}>
                <button type="button" className="cta grow" onClick={addIt} disabled={inBag || !!p.heldByOther}>{ctaLabel}</button>
                <SaveButton p={p} />
              </div> : null}
            </>
          )}
          <Link href={`/m/${m.slug}`} className={`gs ${s.maker}`}>
            <Img small src={m.portraitUrl} alt="" className="u-avatar" />
            <span className="grow minw0"><span className="hand">{m.name}</span><span className="m t-meta">{m.city}{m.rating ? ` · ★ ${m.rating.avg.toFixed(1)}` : ''}{r ? ` · ${r.replace(`${m.name} u`, 'u')}` : ''}</span></span>
            <span className="m">›</span>
          </Link>
          {!p.sold ? (
            <div className={s.facts}>
              <div><span>Parcel locker</span><span className="m">{formatEURExact(490)} · 2–3 days</span></div>
              <div><span>To your door</span><span className="m">{formatEURExact(690)} · 2–4 days</span></div>
              {m.freeShippingFromCents ? <div><span>Free shipping</span><span className="m">from {formatEUR(m.freeShippingFromCents)} at {m.name}</span></div> : null}
              <div><span>Returns</span><span className="m">14 days, free</span></div>
            </div>
          ) : null}
          {reviews?.length ? (
            <div className={s.reviews}>
              <div className="row between"><span className="lbl">Reviews of {m.name}</span><Link href={`/m/${m.slug}?tab=reviews`} className="m tap t-small">See all {reviews.length}</Link></div>
              {reviews.slice(0, 2).map((x) => <div key={x.id} className={s.rev}><span className="accent">{'★'.repeat(x.rating)}</span> <span className="m">{x.who}</span><br />{x.text}</div>)}
            </div>
          ) : null}
        </div>
      </div>
      {guide && p.sizes ? (
        <Sheet title="Size guide" onClose={() => setGuide(false)}>
            <div className="u-stack t-small lh-15 gap-16">
              {p.category === 'jewelry' ? (
                <>
                  <span>EU ring size = the inside circumference of the ring in millimetres.</span>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr><th style={{ textAlign: 'left', padding: '6px 0' }} className="lbl">EU size</th><th style={{ textAlign: 'left' }} className="lbl">Inside Ø</th><th style={{ textAlign: 'left' }} className="lbl">Circumference</th></tr></thead>
                    <tbody>{p.sizes.options.map((o) => { const c = parseFloat(o); return <tr key={o} style={{ borderTop: '1px solid var(--u-line)' }}><td style={{ padding: '8px 0' }}>{o}</td><td>{(c / Math.PI).toFixed(1)} mm</td><td>{c} mm</td></tr>; })}</tbody>
                  </table>
                  <span className="m">How to measure: wrap a strip of paper around the finger you want, mark where it meets, and measure the length in mm. That number is your EU size.</span>
                </>
              ) : <span>{p.description}</span>}
              <Link href={`/messages/${m.slug}?piece=${p.id}`} className="sec gs">Still not sure? Ask {m.name}</Link>
            </div>
        </Sheet>
      ) : null}
      {desktop === false ? <>
      <span className={s.back}><BackButton href={`/m/${m.slug}`} label={`Back`} /></span>
      <span className={s.save}><SaveButton p={p} /></span>
      <div className={`g ${s.bar}`}>
        {p.sold ? (
          <Link href={m.customRequestsOpen ? `/m/${m.slug}/request?like=${p.id}` : `/messages/${m.slug}?piece=${p.id}`} className="cta" style={{ flex: 1 }}>Ask {m.name} for something similar</Link>
        ) : (
          <>
            <span className={s.sum}><b>{formatEUR(p.priceCents)}</b><span className="m">{subline}</span></span>
            <button type="button" className="cta" onClick={addIt} disabled={inBag || !!p.heldByOther}>{p.sizes && !size ? 'Choose a size' : ctaLabel}</button>
          </>
        )}
      </div>
      </> : null}
    </>
  );
}
