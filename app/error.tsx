'use client';
import Link from 'next/link';
import Wash from '@/components/u/Wash';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="u-page narrow jc-center ai-center tc">
      <Wash src="/img/studio-table.jpg" />
      <h1 className="hand t-26 m0">Something went wrong</h1>
      <p className="m m0">It’s on us. Try again, and if it keeps happening, let us know.</p>
      <div className="row gap-8"><button type="button" className="cta" onClick={reset}>Try again</button><Link href="/" className="sec gs">Home</Link></div>
    </main>
  );
}
