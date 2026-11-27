// One way to put an icon in a button, chip or circle (FIXES 6.10): SVG, centred, never a text glyph
// (✕ › ↓ ★ + … sit off-centre because of their side bearings).
import * as I from './Icons';

const MAP = { 'chevron-down': I.ChevronDown, close: I.Close, back: I.Back, chevron: I.Chevron, 'arrow-down': I.ArrowDown, 'arrow-up': I.ArrowUp, play: I.Play, pause: I.Pause, star: I.Star, check: I.Check, plus: I.Plus, minus: I.Minus, bag: I.Bag, save: I.Bookmark, search: I.Search, message: I.Chat, home: I.Home, user: I.User } as const;
export type IconName = keyof typeof MAP;

export default function Icon({ name, size = 18, filled }: { name: IconName; size?: number; filled?: boolean }) {
  const C = MAP[name];
  return <C size={size} filled={filled} />;
}
