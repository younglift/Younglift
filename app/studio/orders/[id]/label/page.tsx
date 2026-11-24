'use client';
import { useParams } from 'next/navigation';
import { getMyMaker, getStudioOrder } from '@/lib/data';
import { useData } from '@/lib/useData';
import { BackButton } from '@/components/u/Bits';

/** Printable shipping label (test version until the carrier integration creates real labels). */
export default function Label() {
  const { id } = useParams<{ id: string }>();
  const [o] = useData(() => getStudioOrder(id), [id]);
  const [me] = useData(getMyMaker);
  if (!o || !me) return null;
  return (
    <main className="u-page narrow">
      <div className="row no-print"><BackButton href={`/studio/orders/${o.id}`} /><span style={{ flex: 1 }} /><button type="button" className="cta" onClick={() => window.print()}>Print</button></div>
      <div className="label-sheet" style={{ background: 'var(--u-cta)', color: 'var(--u-on-accent)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 14, fontSize: 15 }}>
        <b style={{ fontSize: 13, letterSpacing: 1 }}>TEST LABEL · NOT VALID FOR POSTING</b>
        <div><span style={{ fontSize: 12 }}>FROM</span><br /><b>{me.studio || me.name}</b><br />{me.city}</div>
        <div><span style={{ fontSize: 12 }}>TO</span><br /><b style={{ fontSize: 20 }}>{o.buyer.name}</b><br />{o.lockerAddress ?? `${o.buyer.city}`}</div>
        <div style={{ fontSize: 13 }}>Order #UL-{o.number} · {o.lines.reduce((a, l) => a + l.qty, 0)} item(s){o.gift?.wrap ? ' · GIFT' : ''}</div>
      </div>
      <span className="m no-print" style={{ fontSize: 13 }}>Real labels from Omniva, DPD and LP Express come with the carrier connection.</span>
      <style>{`@media print{.no-print,nav,aside{display:none !important}.u-wash{display:none}body{background:#fff}}`}</style>
    </main>
  );
}
