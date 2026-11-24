'use client';
import { useEffect, useState } from 'react';

const Q = '(min-width: 820px)';
/** true on desktop (≥ 820px). undefined until mounted, so pages render only one layout (phone OR desktop), never both. */
export function useIsDesktop(): boolean | undefined {
  const [v, setV] = useState<boolean>();
  useEffect(() => {
    const mq = window.matchMedia(Q); const on = () => setV(mq.matches); on();
    mq.addEventListener('change', on); return () => mq.removeEventListener('change', on);
  }, []);
  return v;
}
