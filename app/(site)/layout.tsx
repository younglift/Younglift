import '@fontsource/caveat/600.css';
import s from './site.module.css';

// Phone-first: the app is one phone-width column, centred on desktop (desktop layout comes later).
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <div className={s.app}>{children}</div>;
}
