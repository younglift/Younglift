// Line icons used across direction 07 (stroke = currentColor).
type P = { size?: number; filled?: boolean };
const s = (size = 18) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true });
export const Back = ({ size }: P) => <svg {...s(size)}><path d="M15 5l-7 7 7 7" /></svg>;
export const Chevron = ({ size }: P) => <svg {...s(size)}><path d="M9 5l7 7-7 7" /></svg>;
export const Close = ({ size }: P) => <svg {...s(size)}><path d="M6 6l12 12M18 6L6 18" /></svg>;
export const Bookmark = ({ size, filled }: P) => <svg {...s(size)} fill={filled ? 'currentColor' : 'none'}><path d="M6 3h12v18l-6-4.5L6 21z" /></svg>;
export const Search = ({ size }: P) => <svg {...s(size)}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>;
export const Send = ({ size }: P) => <svg {...s(size)}><path d="M4 12l16-8-6 16-2.5-6.5z" /></svg>;
export const Bag = ({ size }: P) => <svg {...s(size)}><path d="M5 8h14l-1 12H6z" /><path d="M9 8a3 3 0 016 0" /></svg>;
export const Chat = ({ size }: P) => <svg {...s(size)}><path d="M4 5h16v11H9l-5 4z" /></svg>;
export const Trash = ({ size }: P) => <svg {...s(size)}><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" /></svg>;
export const Camera = ({ size }: P) => <svg {...s(size)}><path d="M4 8h4l2-3h4l2 3h4v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>;
export const Clock = ({ size }: P) => <svg {...s(size)}><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></svg>;
export const Lock = ({ size }: P) => <svg {...s(size)}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>;
