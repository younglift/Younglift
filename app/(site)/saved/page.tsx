'use client';
import { useMemo, useState } from 'react';
import { createBoard, deleteBoard, getBoards, getMakers, getSaved, removeFromBoard } from '@/lib/data';
import { plural } from '@/lib/format';
import { useData } from '@/lib/useData';
import { ProductCard } from '@/components/u/Bits';
import Loading from '@/components/u/Loading';
import Wash from '@/components/u/Wash';
import Img from '@/components/u/Img';
import Sheet from '@/components/u/Sheet';
import ss from './saved.module.css';
import Icon from '@/components/u/Icon';

/** 06 Saved + boards. */
export default function Saved() {
  const [saved] = useData(getSaved);
  const [boards] = useData(getBoards);
  const [makers] = useData(getMakers);
  const [open, setOpen] = useState<string>('all');
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const [show, setShow] = useState<'all' | 'available' | 'sold'>('all');
  const byId = useMemo(() => new Map((makers ?? []).map((m) => [m.id, m])), [makers]);
  if (!saved || !boards) return <Loading />;
  const board = boards.find((b) => b.id === open);
  const inBoard = board ? saved.filter((p) => board.productIds.includes(p.id)) : saved;
  const list = inBoard.filter((p) => show === 'all' || (show === 'sold') === p.sold);
  // Pinterest-style board: collage of the first photos (1 = full, 2 = halves, 3 = one big + two small, 4 = 2×2),
  // name and count under it, selected = butter outline drawn inside so nothing clips (FIXES 6.3).
  const tile = (key: string, title: string, ids: string[]) => {
    const imgs = ids.map((id) => saved.find((p) => p.id === id)?.images[0]).filter(Boolean).slice(0, 4) as string[];
    return (
      <button className={ss.board} key={key} type="button" onClick={() => setOpen(key)} aria-pressed={open === key}>
        <span className={`${ss.mosaic} ${ss['n' + Math.max(1, imgs.length)]}${open === key ? ' ' + ss.on : ''}`}>
          {imgs.length ? imgs.map((u, i) => <span className={ss.cell} key={i}><Img small src={u} alt="" className="u-cover" /></span>) : <span className={ss.cell} />}
        </span>
        <span className={ss.name}>{title}</span><span className={`m ${ss.count}`}>{plural(ids.length, 'piece')}</span>
      </button>
    );
  };
  return (
    <>
      <Wash src={list[0]?.images[0] ?? '/img/plates.jpg'} />
      <main className="u-page">
        <div className="u-head"><span><h1 className="hand">Saved</h1><span className="m sub">{plural(saved.length, 'piece')} · {plural(boards.length, 'board')}</span></span></div>
        <div className={`snap-x bleed gap-12 ${ss.boards}`}>
          {tile('all', 'All saved', saved.map((p) => p.id))}
          {boards.map((b) => tile(b.id, b.name, b.productIds))}
          <button type="button" onClick={() => setNaming(true)} className={ss.board}><span className={`${ss.mosaic} ${ss.newBoard}`}><Icon name="plus" size={26} /></span><span className={ss.name}>New board</span><span className={`m ${ss.count}`}>&nbsp;</span></button>
        </div>
        <div className="row between gap-12">
          <span><span className="hand t-18">{board?.name ?? 'All saved'}</span> <span className="m t-small">{plural(list.length, 'piece')}</span></span>
          <span className="row gap-12">
            {board ? <button type="button" className="link m t-small" onClick={async () => { await deleteBoard(board.id); setOpen('all'); }}>Delete board</button> : null}
            <span className="desk-only"><span className="chips">{(['all', 'available', 'sold'] as const).map((k) => <button key={k} type="button" className="chip" aria-pressed={show === k} onClick={() => setShow(k)}>{k === 'all' ? 'All' : k === 'sold' ? 'Sold' : 'Available'}</button>)}</span></span>
          </span>
        </div>
        {list.length ? (
          <div className={`u-grid ${ss.grid}`}>{list.map((p) => (
            <div className="rel" key={p.id}>
              <ProductCard p={p} maker={byId.get(p.makerId)} />
              {board ? <button type="button" className="link m t-meta mt-4" onClick={() => removeFromBoard(board.id, p.id)}>Remove from board</button> : null}
            </div>
          ))}</div>
        ) : <div className="g u-card m">{board ? 'Nothing on this board yet. Save a piece, then “Add to board”.' : 'Tap the bookmark on any piece to save it here.'}</div>}
      </main>
      {naming ? (
        <Sheet title="New board" onClose={() => { setNaming(false); setName(''); }}>
          <form className="u-stack gap-12" onSubmit={async (e) => { e.preventDefault(); if (!name.trim()) return; const b = await createBoard(name); setName(''); setNaming(false); setOpen(b.id); }}>
            <label className="fld"><span className="lbl">Board name</span><input className="inp" autoFocus placeholder="e.g. Gift ideas" value={name} onChange={(e) => setName(e.target.value)} /></label>
            <button type="submit" className="cta" disabled={!name.trim()}>Create board</button>
          </form>
        </Sheet>
      ) : null}
    </>
  );
}
