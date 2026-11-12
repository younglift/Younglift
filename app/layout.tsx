import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
// Self-hosted fonts (no network at build time). next/font/google in Next 14 fails on Vercel
// with the current Google Fonts response, so Anton, Archivo and IBM Plex Mono come from Fontsource.
import '@fontsource/anton/400.css';
import '@fontsource/archivo/400.css';
import '@fontsource/archivo/500.css';
import '@fontsource/archivo/600.css';
import '@fontsource/archivo/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Young Lift',
  description: 'Meet young makers. Buy what they make by hand.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body>{children}</body>
    </html>
  );
}
