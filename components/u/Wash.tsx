'use client';
import { useEffect, useRef, useState } from 'react';
import { washSrc } from '@/lib/img';

/** Screen background: base colour + the screen's photo (64px copy), heavily blurred (--u-wash-*).
 *  When the photo changes it cross-fades (300ms) instead of flashing (FIXES 1.5). */
export default function Wash({ src }: { src?: string }) {
  const s = src ? washSrc(src) : undefined;
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
  return (
    <div className="u-wash" aria-hidden="true">
      {layers.a ? <img src={layers.a} alt="" loading="eager" decoding="async" className={layers.top === 'a' ? 'on' : ''} /> : null}
      {layers.b ? <img src={layers.b} alt="" loading="eager" decoding="async" className={layers.top === 'b' ? 'on' : ''} /> : null}
    </div>
  );
}
