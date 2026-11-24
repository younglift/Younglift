'use client';
import type { Product } from '@/lib/types';
import s from './explore.module.css';

export type F = { materials: string[]; price: string[]; avail: string[]; country: string[] };
export const EMPTY: F = { materials: [], price: [], avail: [], country: [] };
const PRICE: [string, (c: number) => boolean][] = [['Under 50€', (c) => c < 5000], ['50–150€', (c) => c >= 5000 && c <= 15000], ['Over 150€', (c) => c > 15000]];
const AVAIL: [string, (p: Product) => boolean][] = [['Ready to ship', (p) => !p.madeToOrder && !p.sold], ['Made to order', (p) => p.madeToOrder], ['1 of 1 only', (p) => p.oneOfAKind]];
const COUNTRY: Record<string, string> = { LT: 'Lithuania', LV: 'Latvia', EE: 'Estonia', PL: 'Poland', DE: 'Germany' };

export function applyFilters(list: Product[], f: F, countryOf: (p: Product) => string) {
  return list.filter((p) =>
    (!f.materials.length || p.materials.some((m) => f.materials.includes(m))) &&
    (!f.price.length || PRICE.some(([l, t]) => f.price.includes(l) && t(p.priceCents))) &&
    (!f.avail.length || AVAIL.some(([l, t]) => f.avail.includes(l) && t(p))) &&
    (!f.country.length || f.country.includes(countryOf(p))));
}
export const activeCount = (f: F) => f.materials.length + f.price.length + f.avail.length + f.country.length;

/** Filter options come from the pieces actually shown; options with 0 pieces are hidden. */
export default function Filters({ list, f, set, countryOf }: { list: Product[]; f: F; set: (f: F) => void; countryOf: (p: Product) => string }) {
  const mats = Array.from(new Set(list.flatMap((p) => p.materials))).sort();
  const countries = Array.from(new Set(list.map(countryOf)));
  const group = (title: string, key: keyof F, opts: { label: string; count: number; value?: string }[]) => {
    const shown = opts.filter((o) => o.count > 0 || f[key].includes(o.value ?? o.label));
    if (!shown.length) return null;
    return (
      <fieldset className={s.fs}>
        <legend className="lbl">{title}</legend>
        {shown.map((o) => {
          const v = o.value ?? o.label; const on = f[key].includes(v);
          return (
            <label key={v} className={s.opt}>
              <input type="checkbox" className="sr" checked={on} onChange={() => set({ ...f, [key]: on ? f[key].filter((x) => x !== v) : [...f[key], v] })} />
              <span className={`chk ${on ? 'on' : ''}`} aria-hidden="true">{on ? '✓' : ''}</span><span>{o.label}</span><span className="m">{o.count}</span>
            </label>
          );
        })}
      </fieldset>
    );
  };
  return (
    <>
      {group('Material', 'materials', mats.map((m) => ({ label: m, count: list.filter((p) => p.materials.includes(m)).length })))}
      {group('Price', 'price', PRICE.map(([l, t]) => ({ label: l, count: list.filter((p) => t(p.priceCents)).length })))}
      {group('Availability', 'avail', AVAIL.map(([l, t]) => ({ label: l, count: list.filter(t).length })))}
      {countries.length > 1 ? group('Maker from', 'country', countries.map((c) => ({ label: COUNTRY[c] ?? c, value: c, count: list.filter((p) => countryOf(p) === c).length }))) : null}
    </>
  );
}
