/** Euro price with the sign right after the number (JOURNEY 2026-11-12): 9500 -> "95€", 4999 -> "49,99€", 21680 -> "216,80€". */
export function formatEUR(cents: number, opts: { cents?: boolean } = {}): string {
  const whole = cents % 100 === 0 && !opts.cents;
  const value = (cents / 100).toLocaleString('lt-LT', { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2, useGrouping: true }).replace(/\s/g, ' ');
  return `${value}€`;
}
/** Always with cents, for totals: 9990 -> "99,90€". */
export const formatEURExact = (cents: number) => formatEUR(cents, { cents: true });

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const dayName = (iso: string) => DAYS[new Date(iso).getDay()];
export const shortDate = (iso: string) => { const d = new Date(iso); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };
export const longDate = (iso: string) => { const d = new Date(iso); return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`; };
export const monthName = (iso: string) => ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][new Date(iso).getMonth()];
export const clock = (iso: string) => { const d = new Date(iso); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
/** "2h", "Yesterday", "Mon", "2 Nov" */
export function ago(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60e3) return 'now';
  if (ms < 3600e3) return `${Math.floor(ms / 60e3)}m`;
  if (ms < 864e5) return `${Math.floor(ms / 3600e3)}h`;
  if (ms < 2 * 864e5) return 'Yesterday';
  if (ms < 6 * 864e5) return dayName(iso);
  return shortDate(iso);
}
/** "Ships tomorrow", "Ships Monday", "Ready in 2 weeks" */
export function shipsLine(p: { madeToOrder: boolean; shipsWithinDays: number }) {
  const d = p.shipsWithinDays;
  if (p.madeToOrder) return d >= 14 && d % 7 === 0 ? `Ready in ${d / 7} weeks` : `Ready in ${d} days`;
  if (d <= 1) return 'Ships tomorrow';
  const day = new Date(Date.now() + d * 864e5);
  return `Ships ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day.getDay()]}`;
}
export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
export const mmss = (ms: number) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

/** FIXES 12.4: never hard-code she/her. Use the maker's name; this is for the rare sentence that needs a pronoun.
    pronoun(m) → she / he / they; pronoun(m, 'obj') → her / him / them; pronoun(m, 'pos') → her / his / their. */
const PRONOUNS = { she: { subj: 'she', obj: 'her', pos: 'her' }, he: { subj: 'he', obj: 'him', pos: 'his' }, they: { subj: 'they', obj: 'them', pos: 'their' } } as const;
export const pronoun = (m: { pronouns?: 'she' | 'he' | 'they' }, form: 'subj' | 'obj' | 'pos' = 'subj') => PRONOUNS[m.pronouns ?? 'they'][form];
