import type { Metadata, Viewport } from 'next';
import { Anton, Archivo, IBM_Plex_Mono } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import './globals.css';

const anton = Anton({ subsets: ['latin', 'latin-ext'], weight: '400', variable: '--font-anton', display: 'swap' });
const archivo = Archivo({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600', '700'], variable: '--font-archivo', display: 'swap' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600'], variable: '--font-plex-mono', display: 'swap' });

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
    <html lang="en" className={`${anton.variable} ${archivo.variable} ${plexMono.variable} ${GeistSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
