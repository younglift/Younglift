'use client';
import { useEffect } from 'react';

/** While a sheet, drawer or window is open, the page behind does not scroll (QUALITY 2.5). Esc calls onEsc. */
export function useLockBody(open: boolean, onEsc?: () => void) {
  useEffect(() => {
    if (!open) return;
    const b = document.body; const prev = b.style.overflow; b.style.overflow = 'hidden';
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onEsc?.(); };
    window.addEventListener('keydown', k);
    return () => { b.style.overflow = prev; window.removeEventListener('keydown', k); };
  }, [open, onEsc]);
}
