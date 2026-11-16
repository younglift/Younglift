/** "10:41" today, "MON" this week, "12 NOV" older. */
export function chatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  if (now.getTime() - d.getTime() < 6 * 864e5) return d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase();
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase();
}

/** "Tue, Nov 17" in `days` days, skipping nothing (rough estimate until makers set ship days). */
export function dayIn(days: number): string {
  const d = new Date(Date.now() + days * 864e5);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
