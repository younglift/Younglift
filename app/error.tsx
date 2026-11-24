'use client';
import Link from 'next/link';
import Wash from '@/components/u/Wash';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="u-page narrow" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      <Wash src="/img/studio-table.jpg" />
      <h1 className="hand" style={{ fontSize: 26, margin: 0 }}>Something went wrong</h1>
      <p className="m" style={{ margin: 0 }}>It’s on us. Try again, and if it keeps happening, let us know.</p>
      <div className="row" style={{ gap: 8 }}><button type="button" className="cta" onClick={reset}>Try again</button><Link href="/" className="sec gs">Home</Link></div>
    </main>
  );
}
