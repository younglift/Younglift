import AppNav from '@/components/u/Nav';

/** Buyer pages: bottom nav on phone, glass top bar on desktop (from 820px). */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (<>{children}<AppNav /></>);
}
