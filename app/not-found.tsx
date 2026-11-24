import Link from 'next/link';
import Logo from '@/components/u/Logo';
import Wash from '@/components/u/Wash';

export default function NotFound() {
  return (
    <main className="u-page narrow" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      <Wash src="/img/studio-table.jpg" />
      <Logo height={80} />
      <h1 className="hand" style={{ fontSize: 26, margin: 0 }}>This page wandered off</h1>
      <p className="m" style={{ margin: 0 }}>The link may be old, or the piece found a home.</p>
      <div className="row" style={{ gap: 8 }}><Link href="/" className="cta">Discover makers</Link><Link href="/explore" className="sec gs">Explore</Link></div>
    </main>
  );
}
