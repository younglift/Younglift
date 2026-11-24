'use client';
import Link from 'next/link';
import { getMyMaker } from '@/lib/data';
import { useData } from '@/lib/useData';
import Loading from '@/components/u/Loading';
import Wash from '@/components/u/Wash';
import StudioNav from './StudioNav';
import s from './studio.module.css';

/** Studio (maker side): bottom nav on phone, left menu on desktop. Only for accepted makers. */
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  const [me] = useData(getMyMaker);
  if (me === undefined) return <Loading />;
  if (me === null) return (
    <main className="u-page narrow"><Wash src="/img/mara-wheel.jpg" />
      <h1 className="hand t-26 m0">No studio yet</h1>
      <p className="m">Studio opens once we’ve accepted your application.</p>
      <Link href="/sell" className="cta">Sell on Uplift</Link>
    </main>
  );
  return (<><StudioNav /><div className={s.main}>{children}</div></>);
}
