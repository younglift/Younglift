'use client';
import { getBag } from '@/lib/data';
import { useData } from '@/lib/useData';
import BagView from '@/components/u/BagView';
import Wash from '@/components/u/Wash';

/** 07 Bag: buy from each maker, or pay for all. */
export default function BagPage() {
  const [bag] = useData(getBag);
  const photo = bag?.groups[0]?.lines[0]?.product.images[0] ?? '/img/crochet-bag.jpg';
  return (
    <>
      <Wash src={photo} />
      <main className="u-page narrow" style={{ paddingBottom: 'calc(170px + env(safe-area-inset-bottom))' }}>
        <div className="u-head"><span><h1 className="hand">Bag</h1>{bag?.groups.length ? <span className="m sub">Each maker ships their own parcel</span> : null}</span></div>
        <BagView />
      </main>
    </>
  );
}
