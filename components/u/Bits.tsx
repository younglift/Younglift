'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Maker, Product } from '@/lib/types';
import { addToBag, addToBoard, createBoard, getBoards, toggleFollow, toggleSave, type AddResult } from '@/lib/data';
import { formatEUR } from '@/lib/format';
import { useData } from '@/lib/useData';
import { Back, Bookmark, Close } from './Icons';
import Sheet from './Sheet';
import { toast } from './Toast';
import { openBag } from './Nav';
import Img from '@/components/u/Img';
import Icon from '@/components/u/Icon';

const isDesktop = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 820px)').matches;

/** Add to bag with the real rules (holds, sizes); tells the buyer what happened. */
export function useAddToBag() {
  const router = useRouter();
  return async (p: Pick<Product, 'id' | 'title'>, variant?: Record<string, string>): Promise<AddResult> => {
    const r = await addToBag({ productId: p.id, qty: 1, variant });
    if (r.ok) toast(`${p.title} is in your bag`, { label: 'View bag', run: () => (isDesktop() ? openBag() : router.push('/bag')) });
    else if (r.reason === 'held') toast('In someone’s bag right now. It may come back in a few minutes.');
    else if (r.reason === 'size') toast('Pick a size first');
    else if (r.reason === 'sold') toast('Sorry, this one just sold');
    return r;
  };
}

/** Bookmark button. Saving offers "Add to board". */
export function SaveButton({ p, className = 'ic gs', size = 18, onBoard }: { p: Pick<Product, 'id' | 'title' | 'isSaved'>; className?: string; size?: number; onBoard?: () => void }) {
  const [boardFor, setBoardFor] = useState<string | null>(null);
  return (
    <>
      <button type="button" className={className} aria-pressed={!!p.isSaved} aria-label={`${p.isSaved ? 'Unsave' : 'Save'} ${p.title}`}
        onClick={async (e) => {
          e.preventDefault(); e.stopPropagation();
          const on = await toggleSave(p.id);
          toast(on ? 'Saved' : 'Removed from saved', on ? { label: 'Add to board', run: () => (onBoard ? onBoard() : setBoardFor(p.id)) } : undefined);
        }}>
        <span key={String(!!p.isSaved)} className={p.isSaved ? 'u-pop' : undefined} style={{ color: p.isSaved ? 'var(--u-accent)' : 'var(--u-ink)', display: 'flex' }}><Bookmark size={size} filled={!!p.isSaved} /></span>
      </button>
      {boardFor ? <BoardSheet productId={boardFor} onClose={() => setBoardFor(null)} /> : null}
    </>
  );
}

export function BoardSheet({ productId, onClose }: { productId: string; onClose: () => void }) {
  const [boards] = useData(getBoards);
  const [name, setName] = useState('');
  return (
    <Sheet title="Add to board" onClose={onClose}>

          {(boards ?? []).map((b) => (
            <button key={b.id} type="button" className="sec gs" style={{ justifyContent: 'space-between' }} onClick={async () => { await addToBoard(b.id, productId); toast(`Added to ${b.name}`); onClose(); }}>
              <span>{b.name}</span><span className="m">{b.productIds.includes(productId) ? 'Added ✓' : `${b.productIds.length}`}</span>
            </button>
          ))}
          <form className="row" onSubmit={async (e) => { e.preventDefault(); if (!name.trim()) return; const b = await createBoard(name); await addToBoard(b.id, productId); toast(`Added to ${b.name}`); onClose(); }}>
            <input className="inp" placeholder="New board, e.g. For my sister" value={name} onChange={(e) => setName(e.target.value)} aria-label="New board name" />
            <button type="submit" className="cta" disabled={!name.trim()}>Create</button>
          </form>
    </Sheet>
  );
}

/** Grid tile: photo with save button, maker, title, price. */
export function ProductCard({ p, maker, showMaker = true }: { p: Product; maker?: { name: string; city?: string }; showMaker?: boolean }) {
  return (
    <div className="u-grid-item">
      <Link href={`/p/${p.id}`} className="ph" aria-label={`${p.title}, ${formatEUR(p.priceCents)}`}>
        <Img src={p.images[0]} alt="" className="u-cover" />
        {p.sold ? <span className="u-badge dark">Sold</span> : p.oneOfAKind ? <span className="u-badge">1 of 1</span> : null}
      </Link>
      <span className="save"><SaveButton p={p} className="ic gs" size={16} /></span>
      <Link className="flex col gap-4" href={`/p/${p.id}`}>
        {showMaker && maker ? <span className="m t-meta">{maker.name}{maker.city ? <span className="desk-only"> · {maker.city}</span> : null}</span> : null}
        <span className="t">{p.title}</span>
        <span className="p num">{formatEUR(p.priceCents)}</span>
      </Link>
    </div>
  );
}

/** Round back button (history back, or a fallback page). */
export function BackButton({ href = '/', label = 'Back', text, className = 'ic gs' }: { href?: string; label?: string; text?: string; className?: string }) {
  const router = useRouter();
  return (
    <button type="button" aria-label={label} className={className} style={text ? { width: 'auto', padding: '0 14px 0 8px', gap: 4 } : undefined}
      onClick={() => (window.history.length > 1 ? router.back() : router.push(href))}>
      <Back />{text ? <span style={{ font: '600 14px var(--u-ui)' }}>{text}</span> : null}
    </button>
  );
}

/** Stars input / display. */
export function Stars({ value, onPick, size = 22 }: { value: number; onPick?: (n: number) => void; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2, color: 'var(--u-accent)', fontSize: size }}>
      {[1, 2, 3, 4, 5].map((n) => onPick
        ? <button key={n} type="button" aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => onPick(n)} className="star-btn"><span className="flex"><Icon name="star" size={size} filled={n <= value} /></span></button>
        : <span key={n} aria-hidden="true" className="flex"><Icon name="star" size={size} filled={n <= value} /></span>)}
    </span>
  );
}

/** Follow / Following (FIXES 10.5): optimistic, only the label cross-fades (150ms). Fixed width = the width of
    "Following" (both labels sit in one grid cell), so nothing next to it moves. Never reorders or reloads a screen. */
export function FollowButton({ m, className }: { m: Maker; className: string }) {
  const [on, setOn] = useState(!!m.isFollowing);
  useEffect(() => { setOn(!!m.isFollowing); }, [m.isFollowing]);
  return (
    <button type="button" className={`${className} u-follow`} aria-pressed={on} aria-label={on ? `Following ${m.name}` : `Follow ${m.name}`}
      onClick={() => { setOn(!on); toggleFollow(m.id); }}>
      <span className="u-follow-l" aria-hidden={on}>Follow</span><span className="u-follow-l" aria-hidden={!on}>Following</span>
    </button>
  );
}
