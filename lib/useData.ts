'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { subscribe } from '@/lib/data';

/** Load data from '@/lib/data' and reload whenever any data changes (bag, saves, follows…). */
export function useData<T>(load: () => Promise<T>, deps: unknown[] = []): [T | undefined, () => void] {
  const [value, setValue] = useState<T>();
  const ref = useRef(load); ref.current = load;
  const run = useCallback(() => { let live = true; ref.current().then((v) => { if (live) setValue(v); }); return () => { live = false; }; }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { const stop = run(); const un = subscribe(() => { ref.current().then(setValue); }); return () => { stop(); un(); }; }, deps);
  return [value, run];
}

/** Re-render every second (hold timers, "ships in 3h 12m"). */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}
