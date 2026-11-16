'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Maker, Product } from '@/lib/types';
import { addToBag, getProduct, MAKER_EXTRAS, PRODUCT_EXTRAS, toggleSave } from '@/lib/data';
import { formatEUR, formatEURText } from '@/lib/format';
import { backTarget } from '@/lib/ui';
import BackPill from '@/components/BackPill';
import ShareButton from '@/components/ShareButton';
import { bagChanged } from '@/components/BottomNav';
import { Bookmark, Chat } from '@/components/Icons';
import s from './product.module.css';

// A5 · Product, full page with its own URL (docs/design/screens/Product*.dc.html).
// States: ready to ship, made to order (orange dot), sizes (rings), sold ("found a home").

export default function ProductPage({ id, from }: { id: string; from: string | null }) {
  const [data, setData] = useState<{ product: Product; maker: Maker } | null | undefined>(undefined);
  const [img, setImg] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [added, setAdded] = useState(false);
  const [open, setOpen] = useState<{ ship: boolean; returns: boolean }>({ ship: true, returns: false });

  useEffect(() => {
    getProduct(id).then((d) => { setData(d); if (d) setSaved(!!d.product.isSaved); });
  }, [id]);

  if (data === undefined) return <main className={s.screen} />;
  if (data === null) {
    return (
      <main className={s.missing}>
        <h1 className={s.missingTitle}>PIECE NOT FOUND</h1>
        <Link href="/" className={s.mainBtn}>BACK TO DISCOVER</Link>
      </main>
    );
  }

  const { product: p, maker: m } = data;
  const x = MAKER_EXTRAS[m.id];
  const status = PRODUCT_EXTRAS[p.id]?.status ?? (p.stock === 0 ? 'sold' : 'ready');
  const sold = status === 'sold';
  const label = sold ? 'SOLD' : PRODUCT_EXTRAS[p.id]?.label;
  const back = backTarget(from, (slug) => (slug === m.slug ? m.name : undefined));
  const gallery = [
    { src: p.images[0], alt: p.title },
    ...p.images.slice(1).map((src) => ({ src, alt: p.title })),
    { src: m.portraitUrl, alt: `${m.name} at work` },
  ];
  const n = gallery.length;
  const sizeOpt = p.variants?.[0];
  const needSize = !!sizeOpt && !size;
  const ask = `/messages/${m.slug}?product=${p.id}&from=${encodeURIComponent(`product:${p.id}`)}`;
  const statusText = {
    ready: { title: 'Ready to ship', note: `Sent from ${m.city} within 2 days. Arrives in 2–4 days.`, dot: 'var(--accent)' },
    order: { title: 'Made to order', note: `${m.name} makes it for you in 1–2 weeks, then sends it from ${m.city}.`, dot: 'var(--amber)' },
    sold: { title: 'This piece has found a home', note: `${m.name} can make something similar for you, in your size or colours.`, dot: 'var(--muted)' },
  }[status];

  async function add() {
    await addToBag({ productId: p.id, qty: 1, variant: size && sizeOpt ? { [sizeOpt.name]: size } : undefined });
    bagChanged();
    setAdded(true);
    setTimeout(() => setAdded(false), 4000);
  }

  return (
    <main className={s.screen}>
      <div className={s.gallery}>
        <img src={gallery[img].src} alt={gallery[img].alt} className={sold ? s.soldImg : undefined} />
        {n > 1 && (
          <>
            <button type="button" aria-label="Previous photo" className={s.prev} onClick={() => setImg((img - 1 + n) % n)} />
            <button type="button" aria-label="Next photo" className={s.next} onClick={() => setImg((img + 1) % n)} />
          </>
        )}
        <div className={s.bar}>
          <BackPill href={back.href} label={back.label} />
          <ShareButton title={`${p.title} by ${m.name}`} label="Share" />
        </div>
        {label && <span className={sold ? s.labelSold : s.label}>{label}</span>}
        {n > 1 && (
          <div className={`glass ${s.dots}`}>
            {gallery.map((g, i) => (
              <button key={i} type="button" aria-label={`Photo ${i + 1}`} onClick={() => setImg(i)} className={i === img ? s.dotOn : s.dot} />
            ))}
          </div>
        )}
      </div>

      <div className={s.body}>
        <Link href={`/maker/${m.slug}?from=${encodeURIComponent(`product:${p.id}`)}`} className={s.makerLine}>{m.name}{m.studio ? ` · ${m.studio}` : ''}</Link>
        <h1 className={s.title}>{p.title}</h1>
        <span className={`mono ${s.price} ${sold ? s.priceSold : ''}`}>{formatEUR(p.priceCents)}</span>
        {!sold && (
          <span className={s.total}>+ {formatEURText(p.shippingCents)} shipping to Lithuania · {formatEURText(p.priceCents + p.shippingCents)} total</span>
        )}
        <span className={s.material}>Material: <b>{p.materials.join(', ')}</b></span>

        <div className={s.box}>
          <span className={s.statusTitle}><span aria-hidden="true" className={s.statusDot} style={{ background: statusText.dot }} />{statusText.title}</span>
          <span className={s.statusNote}>{statusText.note}</span>
        </div>

        {sizeOpt && !sold && (
          <div className={`${s.box} ${needSize ? s.boxStrong : ''}`}>
            <span className={s.sizeHead}>Size: <b>{size ? `EU ${size}` : 'Choose your size'}</b></span>
            <div className={s.sizes}>
              {sizeOpt.options.map((o) => (
                <button key={o} type="button" aria-pressed={size === o} className={size === o ? s.sizeOn : s.size} onClick={() => setSize(o)}>{o}</button>
              ))}
            </div>
            <span className={s.sizeNote}>Not sure? <Link href={ask}>Ask {m.name}</Link>, {x ? 'she can size it for you' : 'they can help'}.</span>
          </div>
        )}

        <div className={s.about}>
          <span className={s.aboutHead}>About this piece</span>
          <p>{p.description}</p>
        </div>
        <Link href={ask} className={s.ask}><Chat />{sold ? `Ask ${m.name} about something similar` : `Ask ${m.name} a question`}</Link>
      </div>

      <dl className={s.specs}>
        <div><dt>Material</dt><dd>{p.materials.join(', ')}</dd></div>
        <div><dt>Made in</dt><dd>{m.city}</dd></div>
        {p.oneOfAKind && <div><dt>Edition</dt><dd>One of a kind</dd></div>}
      </dl>

      <div className={s.acc}>
        <button type="button" aria-expanded={open.ship} onClick={() => setOpen({ ...open, ship: !open.ship })}>Shipping<span aria-hidden="true">{open.ship ? '−' : '+'}</span></button>
        {open.ship && <p>{status === 'order' ? `Made to order in 1–2 weeks, then sent from ${m.city}.` : `Sent within 2 days from ${m.city}.`} {formatEURText(p.shippingCents)} within the EU.</p>}
        <button type="button" aria-expanded={open.returns} onClick={() => setOpen({ ...open, returns: !open.returns })}>Returns<span aria-hidden="true">{open.returns ? '−' : '+'}</span></button>
        {open.returns && <p>{m.name} accepts returns within 14 days if the piece is unused. Custom pieces can’t be returned.</p>}
      </div>

      <section className={s.reviews}>
        <h2>Reviews of {m.name}</h2>
        <p>No reviews yet. Only people who bought from {m.name} can leave one.</p>
      </section>

      <Link href={`/maker/${m.slug}?from=${encodeURIComponent(`product:${p.id}`)}`} className={s.madeBy}>
        <img src={m.portraitUrl} alt="" />
        <span className={s.madeText}><span className={s.madeName}>Made by {m.name}</span><span className={s.madeMeta}>{m.city}{x ? ` · replies in ${x.replyTime}` : ''}</span></span>
        <span className={s.madeLink}>Studio ›</span>
      </Link>

      {added && (
        <div className={`glass ${s.toast}`} role="status">
          <span><span aria-hidden="true" className={s.toastDot} />Added to bag</span>
          <Link href="/bag">View bag ›</Link>
        </div>
      )}

      <div className={s.buy}>
        <button
          type="button"
          aria-pressed={saved}
          aria-label={saved ? 'Saved' : 'Save'}
          className={s.saveBtn}
          onClick={async () => setSaved(await toggleSave(p.id))}
        >
          <Bookmark size={18} color="var(--fg)" fill={saved ? 'var(--fg)' : 'none'} />
        </button>
        {sold ? (
          <Link href={`/messages/${m.slug}?tab=request&product=${p.id}&from=${encodeURIComponent(`product:${p.id}`)}`} className={`${s.mainBtn} ${s.center}`}>ASK FOR SOMETHING SIMILAR</Link>
        ) : needSize ? (
          <button type="button" className={`${s.mainBtn} ${s.muted}`} onClick={() => document.querySelector(`.${s.boxStrong}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
            <span>CHOOSE A SIZE</span><span className="mono">{formatEUR(p.priceCents)}</span>
          </button>
        ) : (
          <button type="button" className={s.mainBtn} onClick={add}>
            <span>ADD TO BAG</span><span className="mono">{formatEUR(p.priceCents)}</span>
          </button>
        )}
      </div>
    </main>
  );
}
