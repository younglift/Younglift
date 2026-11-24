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

export const metadata: Metadata = {
  title: 'Uplift',
  description: 'A community of upcoming makers. Buy what they make by hand.',
  icons: { icon: '/brand/uplift-logo-black.svg' },
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
      <body className="u-body">{children}<Toaster /></body>
    </html>
  );
}
