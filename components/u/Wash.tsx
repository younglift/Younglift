'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { washSrc } from '@/lib/img';

/** Screen background: base colour + the screen's photo, heavily blurred (--u-wash-*). Our own photos use the
 *  pre-blurred /img/w/ copy (class 'baked', no CSS filter = no lag); uploads still get the CSS blur.
 *  When the photo changes it cross-fades (300ms) instead of flashing (FIXES 1.5). */
export default function Wash({ src }: { src?: string }) {
  const s = src ? washSrc(src) : undefined;
  const baked = (u?: string) => (u && u.startsWith('/img/w/') ? 'baked ' : '');
  const [layers, setLayers] = useState<{ a?: string; b?: string; top: 'a' | 'b' }>({ a: s, top: 'a' });
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setLayers((l) => {
      const cur = l.top === 'a' ? l.a : l.b;
      if (cur === s) return l;
      return l.top === 'a' ? { ...l, b: s, top: 'b' } : { ...l, a: s, top: 'a' };
    });
  }, [s]);
  // Rendered at the top of <body> (#u-wash-root), never inside the page: a transformed/animated ancestor
  // (.u-step-in) made position:fixed relative to that box, so the photo stopped short (FIXES 6.1).
  const [root, setRoot] = useState<HTMLElement | null>(null);
  useEffect(() => { setRoot(document.getElementById('u-wash-root')); }, []);
  const node = (
    <div className="u-wash" aria-hidden="true">
      {layers.a ? <img src={layers.a} alt="" loading="eager" decoding="async" className={baked(layers.a) + (layers.top === 'a' ? 'on' : '')} /> : null}
      {layers.b ? <img src={layers.b} alt="" loading="eager" decoding="async" className={baked(layers.b) + (layers.top === 'b' ? 'on' : '')} /> : null}
    </div>
  );
  return root ? createPortal(node, root) : null;
}
