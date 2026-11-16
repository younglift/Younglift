'use client';
// Small per-device UI memory (not business data): first-visit flags and where the feed was.
// Wrapped in try/catch because storage can be blocked.

export function getFlag(key: string): boolean {
  try { return window.localStorage.getItem(`yl-ui-${key}`) === '1'; } catch { return false; }
}
export function setFlag(key: string) {
  try { window.localStorage.setItem(`yl-ui-${key}`, '1'); } catch { /* ignore */ }
}
export function getSession<T>(key: string, fallback: T): T {
  try {
    const raw = window.sessionStorage.getItem(`yl-ui-${key}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}
export function setSession(key: string, value: unknown) {
  try { window.sessionStorage.setItem(`yl-ui-${key}`, JSON.stringify(value)); } catch { /* ignore */ }
}

/** Where "back" goes and what it says ("‹ Discover", "‹ Mara"). Pages pass ?from=… in links. */
export function backTarget(from: string | null, makerName?: (slug: string) => string | undefined): { href: string; label: string } {
  if (!from || from === 'discover') return { href: '/', label: 'Discover' };
  if (from.startsWith('maker:')) {
    const slug = from.slice(6);
    return { href: `/maker/${slug}`, label: makerName?.(slug) ?? 'Back' };
  }
  if (from.startsWith('product:')) return { href: `/product/${from.slice(8)}`, label: 'Back' };
  const map: Record<string, { href: string; label: string }> = {
    explore: { href: '/explore', label: 'Explore' },
    following: { href: '/following', label: 'Following' },
    saved: { href: '/saved', label: 'Saved' },
    bag: { href: '/bag', label: 'Bag' },
    messages: { href: '/messages', label: 'Messages' },
    profile: { href: '/profile', label: 'Profile' },
  };
  return map[from] ?? { href: '/', label: 'Discover' };
}
