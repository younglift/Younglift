'use client';
import { useCallback, useEffect, useState } from 'react';

type T = { text: string; action?: { label: string; run: () => void } } | null;
let push: (t: T) => void = () => {};
/** Show a short message at the bottom ("Added to your bag", "Removed · Undo"). */
export function toast(text: string, action?: { label: string; run: () => void }) { push({ text, action }); }

export default function Toaster() {
  const [t, setT] = useState<T>(null);
  const show = useCallback((x: T) => setT(x), []);
  useEffect(() => { push = show; }, [show]);
  useEffect(() => { if (!t) return; const id = setTimeout(() => setT(null), 3200); return () => clearTimeout(id); }, [t]);
  if (!t) return null;
  return (
    <div className="u-toast g" role="status" aria-live="polite">
      <span>{t.text}</span>
      {t.action ? <button type="button" className="link" onClick={() => { t.action!.run(); setT(null); }}>{t.action.label}</button> : null}
    </div>
  );
}
