'use client';
import { useCallback, useRef, useState } from 'react';
import { useLockBody } from '@/lib/useLockBody';
import { Close } from './Icons';

/** Bottom sheet (phone) / centred window (desktop): slides in, scrim fades, Esc, scrim tap or swipe down closes (QUALITY 2.4). */
export default function Sheet({ title, onClose, children, footer, left, right }: { title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; left?: React.ReactNode; right?: React.ReactNode }) {
  const [leaving, setLeaving] = useState(false);
  const [drag, setDrag] = useState(0);
  const y0 = useRef<number | null>(null);
  const close = useCallback(() => {
    if (leaving) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { onClose(); return; }
    setLeaving(true); setTimeout(onClose, 200);
  }, [leaving, onClose]);
  useLockBody(true, close);
  return (
    <>
      <div className={`u-scrim ${leaving ? 'leaving' : ''}`} onClick={close} />
      <div role="dialog" aria-modal="true" aria-label={title} className={`u-sheet g ${leaving ? 'leaving' : ''}`}
        style={drag ? { transform: `translateY(${drag}px)`, animation: 'none' } : undefined}>
        <div className="u-sheet-head"
          onTouchStart={(e) => { y0.current = e.touches[0].clientY; }}
          onTouchMove={(e) => { if (y0.current != null) setDrag(Math.max(0, e.touches[0].clientY - y0.current)); }}
          onTouchEnd={() => { if (drag > 80) close(); setDrag(0); y0.current = null; }}>
          <span className="u-grab" aria-hidden="true" />
          <div className="row" style={{ justifyContent: 'space-between' }}>
            {left ?? <span className="hand u-sheet-title">{title}</span>}
            {left ? <span className="hand u-sheet-title">{title}</span> : null}
            {right ?? <button type="button" className="ic" aria-label="Close" onClick={close}><Close /></button>}
          </div>
        </div>
        <div className="body">{children}</div>
        {footer}
      </div>
    </>
  );
}
