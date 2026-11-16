'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Board, Maker, Product } from '@/lib/types';
import { addToBoard, createBoard, getBoards, PRODUCT_EXTRAS, removeFromBoard, search, toggleSave } from '@/lib/data';
import BottomNav from '@/components/BottomNav';
import ProfileLink from '@/components/ProfileLink';
import PieceCard from '@/components/PieceCard';
import pc from '@/components/PieceCard.module.css';
import s from './saved.module.css';

// A7 · Saved + boards (docs/design/screens/Saved.dc.html). Pieces only (makers live in Following).
// Tapping the filled save icon opens "Save to board"; removing shows Undo.

export default function Saved() {
  const [products, setProducts] = useState<Product[]>([]);
  const [makers, setMakers] = useState<Record<string, Maker>>({});
  const [boards, setBoards] = useState<Board[]>([]);
  const [sel, setSel] = useState<string>('all');
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const [sheet, setSheet] = useState<Product | null>(null);
  const [toast, setToast] = useState<{ text: string; id: string; boards: string[] } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const load = useCallback(async () => {
    const [res, b] = await Promise.all([search(''), getBoards()]);
    setProducts(res.products);
    setMakers(Object.fromEntries(res.makers.map((m) => [m.id, m])));
    setBoards(b);
  }, []);
  useEffect(() => { load(); }, [load]);

  const saved = products.filter((p) => p.isSaved);
  const byId = Object.fromEntries(products.map((p) => [p.id, p]));
  const live = (ids: string[]) => ids.filter((id) => byId[id]?.isSaved);
  const all = { id: 'all', name: 'All saved', productIds: saved.map((p) => p.id) };
  const list = [all, ...boards.map((b) => ({ ...b, productIds: live(b.productIds) }))];
  const cur = list.find((b) => b.id === sel) ?? all;
  const pieces = cur.productIds.map((id) => byId[id]).filter(Boolean);
  const plural = (n: number) => `${n} ${n === 1 ? 'PIECE' : 'PIECES'}`;

  async function newBoard() {
    const n = name.trim();
    if (!n) return;
    const b = await createBoard(n);
    setNaming(false); setName('');
    await load();
    setSel(b.id);
  }

  async function unsave(p: Product) {
    const inBoards = boards.filter((b) => b.productIds.includes(p.id)).map((b) => b.id);
    await toggleSave(p.id);
    setSheet(null);
    await load();
    clearTimeout(timer.current);
    setToast({ text: 'Removed from saved', id: p.id, boards: inBoards });
    timer.current = setTimeout(() => setToast(null), 4000);
  }
  async function undo() {
    if (!toast) return;
    await toggleSave(toast.id);
    for (const b of toast.boards) await addToBoard(b, toast.id);
    setToast(null);
    load();
  }

  return (
    <main className={s.screen}>
      <div className={s.head}>
        <div className={s.titleRow}><h1 className={s.h1}>SAVED</h1><ProfileLink /></div>
        <p className={s.summary}>{saved.length} pieces · {boards.length} boards</p>
      </div>

      <div className={`noscroll ${s.boards}`}>
        {list.map((b) => {
          const ids = b.productIds;
          return (
            <button key={b.id} type="button" aria-pressed={sel === b.id} className={s.board} onClick={() => setSel(b.id)}>
              <span className={sel === b.id ? s.collageOn : s.collage}>
                {[0, 1, 2, 3].map((i) => (
                  <span key={i}>{ids[i] && byId[ids[i]] && <img src={byId[ids[i]].images[0]} alt="" />}</span>
                ))}
              </span>
              <span className={s.boardText}><span className={s.boardName}>{b.name}</span><span className={`mono ${s.boardCount}`}>{plural(ids.length)}</span></span>
            </button>
          );
        })}
        <button type="button" className={s.newBoard} onClick={() => setNaming(true)}><span aria-hidden="true">+</span>New board</button>
      </div>

      {naming && (
        <form className={s.naming} onSubmit={(e) => { e.preventDefault(); newBoard(); }}>
          <label htmlFor="yl-newboard">Name your board</label>
          <input id="yl-newboard" autoFocus value={name} maxLength={40} placeholder="e.g. For my mum’s birthday" onChange={(e) => setName(e.target.value)} />
          <div className={s.namingRow}>
            <button type="submit" className={s.create} disabled={!name.trim()}>CREATE</button>
            <button type="button" className={s.cancel} onClick={() => { setNaming(false); setName(''); }}>Cancel</button>
          </div>
        </form>
      )}

      <div className={s.boardHead}>
        <h2>{cur.name.toUpperCase()}</h2>
        <span className="mono">{plural(pieces.length)}</span>
      </div>
      {pieces.length === 0 && (
        <div className={s.empty}>
          <span>Nothing here yet</span>
          <span>{sel === 'all' ? 'Tap the save icon on any piece.' : 'Tap the save icon on any piece and choose this board.'}</span>
          {sel === 'all' && <Link href="/" className={s.emptyBtn}>DISCOVER MAKERS</Link>}
        </div>
      )}
      <div className={`${pc.grid} ${s.grid}`}>
        {pieces.map((p) => {
          const sold = PRODUCT_EXTRAS[p.id]?.status === 'sold' || p.stock === 0;
          const m = makers[p.makerId];
          return (
            <PieceCard
              key={p.id}
              p={p}
              from="saved"
              makerName={m?.name}
              onSaveClick={() => setSheet(p)}
              extra={sold && m ? <Link href={`/messages/${m.slug}?tab=request&product=${p.id}&from=saved`} className={s.similar}>Ask for something similar</Link> : null}
            />
          );
        })}
      </div>

      {toast && (
        <div className={`glass ${s.toast}`} role="status">
          <span>{toast.text}</span>
          <button type="button" onClick={undo}>Undo</button>
        </div>
      )}

      {sheet && (
        <>
          <button type="button" aria-label="Close" className={s.scrim} onClick={() => setSheet(null)} />
          <div role="dialog" aria-modal="true" aria-label="Save to board" className={s.sheet}>
            <span aria-hidden="true" className={s.grab} />
            <div className={s.sheetHead}><span>Save to board</span><button type="button" aria-label="Close" onClick={() => setSheet(null)}>✕</button></div>
            <div className={s.sheetPiece}><img src={sheet.images[0]} alt="" /><span>{sheet.title}</span></div>
            {boards.map((b) => {
              const on = b.productIds.includes(sheet.id);
              return (
                <button key={b.id} type="button" role="checkbox" aria-checked={on} className={s.sheetOpt}
                  onClick={async () => { if (on) await removeFromBoard(b.id, sheet.id); else await addToBoard(b.id, sheet.id); load(); }}>
                  <span aria-hidden="true" className={on ? s.boxOn : s.box}>{on ? '✓' : ''}</span>{b.name}
                </button>
              );
            })}
            <button type="button" className={s.remove} onClick={() => unsave(sheet)}>Remove from saved</button>
          </div>
        </>
      )}
      <div className={s.navSpace} />
      <BottomNav />
    </main>
  );
}
