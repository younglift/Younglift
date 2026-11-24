'use client';
import { useMemo, useState } from 'react';
import { createBoard, deleteBoard, getBoards, getMakers, getSaved, removeFromBoard } from '@/lib/data';
import { plural } from '@/lib/format';
import { useData } from '@/lib/useData';
import { ProductCard } from '@/components/u/Bits';
import Loading from '@/components/u/Loading';
import Wash from '@/components/u/Wash';
import Img from '@/components/u/Img';

/** 06 Saved + boards. */
export default function Saved() {
  const [saved] = useData(getSaved);
  const [boards] = useData(getBoards);
  const [makers] = useData(getMakers);
  const [open, setOpen] = useState<string>('all');
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const byId = useMemo(() => new Map((makers ?? []).map((m) => [m.id, m])), [makers]);
  if (!saved || !boards) return <Loading />;
  const board = boards.find((b) => b.id === open);
  const list = board ? saved.filter((p) => board.productIds.includes(p.id)) : saved;
  const tile = (key: string, title: string, ids: string[]) => {
    const imgs = ids.map((id) => saved.find((p) => p.id === id)?.images[0]).filter(Boolean).slice(0, 4) as string[];
    return (
      <button key={key} type="button" onClick={() => setOpen(key)} aria-pressed={open === key} style={{ padding: 0, border: 0, background: 'none', color: 'var(--u-ink)', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6, width: 132, flexShrink: 0 }}>
        <span className="gs" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, borderRadius: 18, overflow: 'hidden', aspectRatio: '1', outline: open === key ? '2px solid var(--u-accent)' : 'none', outlineOffset: 2 }}>
          {[0, 1, 2, 3].map((i) => <span key={i} style={{ display: 'block', minHeight: 0 }}>{imgs[i] ? <Img small src={imgs[i]} alt="" className="u-cover" /> : null}</span>)}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{title}</span><span className="m" style={{ fontSize: 12, marginTop: -4 }}>{plural(ids.length, 'piece')}</span>
      </button>
    );
  };
  return (
    <>
      <Wash src={list[0]?.images[0] ?? '/img/plates.jpg'} />
      <main className="u-page">
        <div className="u-head"><span><h1 className="hand">Saved</h1><span className="m sub">{plural(saved.length, 'piece')} · {plural(boards.length, 'board')}</span></span></div>
        <div className="snap-x bleed" style={{ gap: 12 }}>
          {tile('all', 'All saved', saved.map((p) => p.id))}
          {boards.map((b) => tile(b.id, b.name, b.productIds))}
          {naming ? (
            <form onSubmit={async (e) => { e.preventDefault(); if (!name.trim()) return; const b = await createBoard(name); setName(''); setNaming(false); setOpen(b.id); }} style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 180, flexShrink: 0 }}>
              <input className="inp" autoFocus placeholder="Board name" value={name} onChange={(e) => setName(e.target.value)} aria-label="Board name" />
              <div className="row" style={{ gap: 6 }}><button type="submit" className="cta" style={{ flex: 1, padding: 0 }} disabled={!name.trim()}>Create</button><button type="button" className="sec" onClick={() => setNaming(false)}>Cancel</button></div>
            </form>
          ) : (
            <button type="button" onClick={() => setNaming(true)} className="gs" style={{ width: 132, aspectRatio: '1', borderRadius: 18, color: 'var(--u-ink)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, flexShrink: 0, borderStyle: 'dashed' }}><span style={{ fontSize: 26 }}>+</span><span style={{ fontSize: 13 }}>New board</span></button>
          )}
        </div>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span><span className="hand" style={{ fontSize: 18 }}>{board?.name ?? 'All saved'}</span> <span className="m" style={{ fontSize: 13 }}>{plural(list.length, 'piece')}</span></span>
          {board ? <button type="button" className="link m" style={{ fontSize: 13 }} onClick={async () => { await deleteBoard(board.id); setOpen('all'); }}>Delete board</button> : null}
        </div>
        {list.length ? (
          <div className="u-grid">{list.map((p) => (
            <div key={p.id} style={{ position: 'relative' }}>
              <ProductCard p={p} maker={byId.get(p.makerId)} />
              {board ? <button type="button" className="link m" style={{ fontSize: 12, marginTop: 4 }} onClick={() => removeFromBoard(board.id, p.id)}>Remove from board</button> : null}
            </div>
          ))}</div>
        ) : <div className="g u-card m">{board ? 'Nothing on this board yet. Save a piece, then “Add to board”.' : 'Tap the bookmark on any piece to save it here.'}</div>}
      </main>
    </>
  );
}
