'use client';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import type { Product } from '@/lib/types';
import { PRODUCT_EXTRAS, toggleSave } from '@/lib/data';
import { formatEUR } from '@/lib/format';
import { Bookmark } from './Icons';
import g from './Glass.module.css';
import s from './PieceCard.module.css';

/** One piece in a grid (Zalando-style, decided 2026-11-12): 4:5 photo, save button in glass,
 *  optional maker label bottom-left, name, one short line, price on its own line. */
export default function PieceCard({ p, from, onSaved, makerName, onSaveClick, extra }: {
  p: Product; from: string; onSaved?: (id: string, on: boolean) => void;
  /** Explore / Saved show the maker above the name instead of the material line. */
  makerName?: string;
  /** Saved opens the "Save to board" sheet instead of toggling. */
  onSaveClick?: () => void;
  extra?: ReactNode;
}) {
  const x = PRODUCT_EXTRAS[p.id];
  const sold = x?.status === 'sold' || p.stock === 0;
  const label = sold ? 'SOLD' : x?.label;
  const [savedState, setSaved] = useState(!!p.isSaved);
  const saved = onSaveClick ? true : savedState;
  const href = `/product/${p.id}?from=${encodeURIComponent(from)}`;
  return (
    <div className={s.card}>
      <div className={s.photo}>
        <Link href={href} className={s.link} aria-label={p.title}>
          <img src={p.images[0]} alt={p.title} className={sold ? s.soldImg : s.img} />
        </Link>
        <button
          type="button"
          className={`glass ${g.save}`}
          aria-label={saved ? `Saved: ${p.title}` : `Save ${p.title}`}
          aria-pressed={saved}
          onClick={async () => {
            if (onSaveClick) { onSaveClick(); return; }
            const on = await toggleSave(p.id); setSaved(on); onSaved?.(p.id, on);
          }}
        >
          <Bookmark fill={saved ? 'currentColor' : 'none'} />
        </button>
        {label && <span className={sold ? s.soldLabel : s.label}>{label}</span>}
      </div>
      <Link href={href} className={sold ? s.metaSold : s.meta}>
        {makerName && <span className={s.maker}>{makerName}</span>}
        <span className={s.name}>{p.title}</span>
        {!makerName && <span className={s.sub}>{p.materials[0]}</span>}
        <span className={`mono ${s.price}`}>{formatEUR(p.priceCents)}</span>
      </Link>
      {extra}
    </div>
  );
}
