'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { Category, MakerSticker, Product } from '@/lib/types';
import { CATEGORY_LABEL, deleteProduct, getMakers, getMyMaker, uploadImage, upsertProduct } from '@/lib/data';
import { formatEUR } from '@/lib/format';
import { useData } from '@/lib/useData';
import { BackButton } from '@/components/u/Bits';
import Sticker, { STICKER_LABEL, stickerSrc } from '@/components/u/Sticker';
import { toast } from '@/components/u/Toast';
import Loading from '@/components/u/Loading';
import Wash from '@/components/u/Wash';
import s from '../studio.module.css';
import Img from '@/components/u/Img';
import Icon from '@/components/u/Icon';

const CATS: Category[] = ['jewelry', 'ceramics', 'crochet', 'clothing', 'accessories', 'home', 'prints', 'other'];
const STICKERS: (MakerSticker | 'none')[] = ['none', 'one_of_one', 'handmade', 'small_batch', 'made_in_city', 'made_in_collab', 'made_to_order'];
const euros = (s: string) => Math.round(parseFloat(s.replace(',', '.').replace(/[^0-9.]/g, '')) * 100) || 0;

/** B5 New piece / edit piece, with the sticker picker. */
export default function Editor({ initial }: { initial?: Product }) {
  const router = useRouter();
  const [me] = useData(getMyMaker);
  const [makers] = useData(getMakers);
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [price, setPrice] = useState(initial ? String(initial.priceCents / 100).replace('.', ',') : '');
  const [category, setCategory] = useState<Category>(initial?.category ?? 'other');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [materials, setMaterials] = useState(initial?.materials.join(', ') ?? '');
  const [mto, setMto] = useState(initial?.madeToOrder ?? false);
  const [qty, setQty] = useState(String(initial ? (initial.madeToOrder ? 1 : initial.stock) : 1));
  const [days, setDays] = useState(String(initial?.shipsWithinDays ?? 3));
  const [hasSizes, setHasSizes] = useState(!!initial?.sizes);
  const [sizes, setSizes] = useState(initial?.sizes?.options.join(', ') ?? '');
  const [sticker, setSticker] = useState<MakerSticker | 'none'>(initial?.makerSticker ?? 'none');
  const [batch, setBatch] = useState(String(initial?.batchSize ?? ''));
  const [collab, setCollab] = useState(initial?.collabMakerId ?? '');
  const [tried, setTried] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => { if (!initial && me) setCategory(me.categories[0] ?? 'other'); }, [me, initial]);
  if (!me) return <Loading />;
  const n = parseInt(qty, 10) || 0;
  const one = !mto && n === 1;
  const allowed = (k: MakerSticker | 'none') => k === 'none' || (k === 'one_of_one' ? one : k === 'made_to_order' ? mto : true);
  const chosen = allowed(sticker) ? sticker : 'none';
  const valid = title.trim() && euros(price) > 0 && images.length > 0 && (mto || n >= 1);

  const save = async (status: 'live' | 'draft') => {
    setTried(true);
    if (status === 'live' && !valid) { toast('Add a photo, a name and a price first'); return; }
    const p = await upsertProduct({
      id: initial?.id, title: title.trim() || 'Untitled piece', priceCents: euros(price), category, description: description.trim(),
      materials: materials.split(',').map((x) => x.trim()).filter(Boolean), images, madeToOrder: mto, stock: mto ? 0 : n,
      madeCount: mto ? 0 : Math.max(n, initial && !initial.madeToOrder ? initial.madeCount : n),
      shipsWithinDays: parseInt(days, 10) || 3, sizes: hasSizes && sizes.trim() ? { label: 'Size', options: sizes.split(',').map((x) => x.trim()).filter(Boolean) } : undefined,
      makerSticker: chosen === 'none' ? undefined : chosen, batchSize: chosen === 'small_batch' ? parseInt(batch, 10) || n : undefined,
      collabMakerId: chosen === 'made_in_collab' ? collab || undefined : undefined, status,
    });
    toast(status === 'live' ? `${p.title} is live` : 'Draft saved');
    router.push(me.status === 'live' ? '/studio/pieces' : '/studio/welcome');
  };

  const form = (
    <div className="u-stack">
      <div className="g u-card u-stack">
        <div className="row between"><span className="lbl">Photos</span><span className="m t-meta">{images.length} of up to 8 · drag or use ← → to reorder</span></div>
        <div className={s.photos}>
          {images.map((u, i) => (
            <span className="rel flex col gap-4 ai-center" key={u.slice(-24) + i}
              draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', String(i))} onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const from = Number(e.dataTransfer.getData('text/plain')); if (Number.isNaN(from) || from === i) return; const a = [...images]; const [x] = a.splice(from, 1); a.splice(i, 0, x); setImages(a); }}>
              <button type="button" className={s.photo} aria-label={i ? 'Make this the cover photo' : 'Cover photo'} onClick={() => setImages([u, ...images.filter((_, j) => j !== i)])}>
                <Img small src={u} alt="" className="u-cover" />{i === 0 ? <span className={`u-badge ${s.coverTag}`}>Cover</span> : null}
              </button>
              <button type="button" className={`gs ${s.x}`} aria-label="Remove photo" onClick={() => setImages(images.filter((_, j) => j !== i))}><Icon name="close" size={14} /></button>
              {images.length > 1 ? (
                <span className="flex gap-4">
                  <button type="button" className={`ic ${s.moveBtn}`} aria-label="Move photo left" disabled={!i} onClick={() => { const a = [...images]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; setImages(a); }}><Icon name="back" size={16} /></button>
                  <button type="button" className={`ic ${s.moveBtn}`} aria-label="Move photo right" disabled={i === images.length - 1} onClick={() => { const a = [...images]; [a[i + 1], a[i]] = [a[i], a[i + 1]]; setImages(a); }}><Icon name="chevron" size={16} /></button>
                </span>
              ) : null}
            </span>
          ))}
          {images.length < 8 ? <button type="button" className={`gs ${s.add}`} aria-label="Add photos" onClick={() => file.current?.click()}><Icon name="plus" size={24} /></button> : null}
          <input ref={file} type="file" accept="image/*" multiple hidden onChange={async (e) => { const fs = Array.from(e.target.files ?? []).slice(0, 8 - images.length); const urls = await Promise.all(fs.map(uploadImage)); setImages([...images, ...urls]); e.target.value = ''; }} />
        </div>
        <span className="m t-meta">Daylight, plain background. The first photo is what people see in Discover.</span>
        {tried && !images.length ? <span className="t-meta accent" role="alert">Add at least one photo</span> : null}
      </div>
      <div className="g u-card u-stack">
        <label className="fld"><span className="row between"><span className="lbl">Name</span><span className={`t-meta ${title.length >= 20 ? 'accent' : 'm'}`} aria-live="polite">{title.length}/20</span></span><input className="inp" value={title} maxLength={20} onChange={(e) => setTitle(e.target.value.slice(0, 20))} aria-invalid={tried && !title.trim()} placeholder="e.g. Speckled plates" /></label>
        <div className={s.two}>
          <label className="fld"><span className="lbl">Price (€)</span><input className="inp" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} aria-invalid={tried && euros(price) <= 0} placeholder="96" /></label>
          <label className="fld"><span className="lbl">Category</span><select className="inp" value={category} onChange={(e) => setCategory(e.target.value as Category)}>{CATS.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}</select></label>
        </div>
        <label className="fld"><span className="lbl">Description</span><textarea className="inp" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Size, material, how to care for it." /></label>
        <label className="fld"><span className="lbl">Materials</span><input className="inp" value={materials} onChange={(e) => setMaterials(e.target.value)} placeholder="Silver, Ceramic, Wool… (comma between)" /></label>
      </div>
      <div className="g u-card u-stack">
        <span className="lbl">How is it made?</span>
        <div className="chips"><button type="button" className="chip" aria-pressed={!mto} onClick={() => setMto(false)}>Ready to ship</button><button type="button" className="chip" aria-pressed={mto} onClick={() => setMto(true)}>Made to order</button></div>
        <div className={s.two}>
          {!mto ? <label className="fld"><span className="lbl">How many?</span><input className="inp" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ''))} /><span className="m t-meta">1 = one of a kind</span></label> : null}
          <label className="fld"><span className="lbl">{mto ? 'Ready within (days)' : 'Ships within (days)'}</span><input className="inp" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, ''))} /></label>
        </div>
        <div className="row"><span className="grow flex col gap-4"><span>Sizes</span><span className="m t-meta">For rings, clothing and anything with a fit</span></span><button type="button" role="switch" aria-checked={hasSizes} aria-label="Sizes" className="tg" onClick={() => setHasSizes(!hasSizes)}><i /></button></div>
        {hasSizes ? <input className="inp" value={sizes} onChange={(e) => setSizes(e.target.value)} placeholder="52, 54, 56, 58" aria-label="Sizes" /> : null}
      </div>
      <div className="g u-card u-stack">
        <div className="row between"><span className="lbl">Add a sticker</span><span className="m t-meta">optional · one per piece</span></div>
        <span className="m t-small">Shown on your photo in Discover. Pick one that’s true for this piece.</span>
        <div className={s.stickers}>
          {STICKERS.map((k) => (
            <button key={k} type="button" className={s.st} aria-pressed={chosen === k} disabled={!allowed(k)} onClick={() => setSticker(k)} title={!allowed(k) ? (k === 'one_of_one' ? 'Only when quantity is 1' : 'Only for made-to-order pieces') : undefined}>
              {k !== 'none' ? <Img src={stickerSrc(k, me.city)} alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : null}
              <span>{k === 'none' ? 'No sticker' : k === 'made_in_city' ? `Made in ${me.city}` : STICKER_LABEL[k]}</span>
            </button>
          ))}
        </div>
        {chosen === 'small_batch' ? <label className="fld"><span className="lbl">How many in this batch?</span><input className="inp" inputMode="numeric" value={batch} onChange={(e) => setBatch(e.target.value.replace(/\D/g, ''))} placeholder={String(n || 5)} /><span className="m t-meta">Shown as “only {batch || n || 5} made”.</span></label> : null}
        {chosen === 'made_in_collab' ? <label className="fld"><span className="lbl">Made with</span><select className="inp" value={collab} onChange={(e) => setCollab(e.target.value)}><option value="">Pick a maker</option>{(makers ?? []).filter((m) => m.id !== me.id).map((m) => <option key={m.id} value={m.id}>{m.name} · {m.city}</option>)}</select><span className="m t-meta">They get a note and can show the piece on their profile too.</span></label> : null}
        {sticker === 'one_of_one' && !one ? <span className="m t-meta">“1 of 1” is only for pieces with quantity 1, so it was removed.</span> : null}
      </div>
      {initial ? (
        confirmDel
          ? <div className="gs u-card row"><span className="grow">Delete {initial.title}? This can’t be undone.</span><button type="button" className="sec" onClick={() => setConfirmDel(false)}>Keep</button><button type="button" className="cta" onClick={async () => { await deleteProduct(initial.id); toast('Piece deleted'); router.push('/studio/pieces'); }}>Delete</button></div>
          : <button type="button" className="link m self-start" onClick={() => setConfirmDel(true)}>Delete this piece</button>
      ) : null}
    </div>
  );

  const stickerShown = chosen !== 'none' ? chosen : undefined;
  return (
    <>
      <Wash src={images[0] ?? me.coverUrl} />
      <main className="u-page has-bar">
        <div className="u-head"><BackButton href="/studio/pieces" /><span className="grow"><h1 className="hand">{initial ? 'Edit piece' : 'New piece'}</h1><span className="m sub">{initial?.status === 'live' ? 'Live' : 'Draft'}</span></span></div>
        <div className={s.editor}>
          {form}
          <aside className={s.preview} aria-label="Preview">
            <span className="lbl m">How it looks in Discover</span>
            <div className={`g ${s.phone}`}>
              {images[0] ? <Img src={images[0]} alt="" className={`u-cover ${'fill'}`} /> : null}
              {stickerShown ? <span className={s.prevStk}><Sticker k={stickerShown} city={me.city} width={92} /></span> : null}
              <div className={`g ${s.prevCard}`}>
                <div className="row between"><span className="hand t-16">{title || 'Your piece'}</span><b>{euros(price) ? formatEUR(euros(price)) : '–'}</b></div>
                <span className="m t-meta">{[one ? '1 of 1' : mto ? 'Made to order' : '', materials.split(',')[0]].filter(Boolean).join(' · ')}</span>
              </div>
            </div>
            {images[0] ? <span className="m t-meta">Keep your piece inside the frame.</span> : null}
          </aside>
        </div>
        <div className="g u-bar">
          {initial?.status === 'live' ? <Link href={`/p/${initial.id}`} className="sec">Preview</Link> : <button type="button" className="sec" onClick={() => save('draft')}>Save draft</button>}
          <button type="button" className="cta" onClick={() => save('live')}>{initial?.status === 'live' ? 'Save changes' : 'Publish piece'}</button>
        </div>
      </main>
    </>
  );
}
