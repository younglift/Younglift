import type { Metadata, Viewport } from 'next';
// Self-hosted fonts (no network at build time). next/font/google in Next 14 fails on Vercel
// with the current Google Fonts response, so fonts come from Fontsource.
// Direction 07: Rock Salt (hand) + Inter (UI). Old fonts go when the last old screen does.
import '@fontsource/rock-salt/400.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import './globals.css';
import './u.css';
import Toaster from '@/components/u/Toast';

const DESCRIPTION = 'A community of upcoming makers. Handmade jewellery, ceramics, crochet and more, bought straight from the people who make it.';
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://younglift-delta.vercel.app'),
  title: { default: 'Uplift · A community of upcoming makers', template: '%s · Uplift' },
  description: DESCRIPTION,
  icons: { icon: '/brand/uplift-logo-black.svg', apple: '/brand/uplift-logo-cream-bg.svg' },
  openGraph: { type: 'website', siteName: 'Uplift', title: 'Uplift · A community of upcoming makers', description: DESCRIPTION, images: [{ url: '/img/studio-table.jpg', alt: 'A maker’s studio table' }] },
  twitter: { card: 'summary_large_image', title: 'Uplift', description: DESCRIPTION, images: ['/img/studio-table.jpg'] },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#665e58',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="u-body"><div id="u-wash-root" />{children}<Toaster /></body>
    </html>
  );
}
