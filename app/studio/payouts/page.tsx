'use client';
import { connectPayouts, getPayouts, getStudioProducts } from '@/lib/data';
import { formatEURExact } from '@/lib/format';
import { useData } from '@/lib/useData';
import { BackButton } from '@/components/u/Bits';
import { toast } from '@/components/u/Toast';
import Loading from '@/components/u/Loading';
import Wash from '@/components/u/Wash';

const FEE = 0.1; // example only: the final fee is decided before launch

/** B7 Get paid (Stripe Connect Express). */
export default function Payouts() {
  const [st] = useData(getPayouts);
  const [pieces] = useData(getStudioProducts);
  if (!st) return <Loading />;
  const ex = pieces?.find((p) => p.status === 'live') ?? { title: 'Speckled plates', priceCents: 9600 };
  const fee = Math.round(ex.priceCents * FEE);
  const on = st === 'connected';
  return (
    <>
      <Wash src="/img/dish.jpg" />
      <main className="u-page narrow has-bar">
        <div className="u-head" style={{ alignItems: 'flex-start' }}><BackButton href="/studio" /><span><h1 className="hand">Get paid</h1><span className="m sub" style={{ lineHeight: 1.5 }}>Buyers pay us, and we send the money to your bank account.</span></span></div>
        <div className="g u-card u-stack">
          <div className="row"><span className="chk on" style={{ width: 40, height: 40, borderRadius: 12, fontSize: 18 }}>€</span><span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}><span style={{ fontWeight: 600 }}>Payouts with Stripe</span><span className="m" style={{ fontSize: 13 }}>Secure. Used by millions of small shops.</span></span><span className="gs" style={{ borderRadius: 999, padding: '5px 10px', fontSize: 12, fontWeight: 600 }}>{on ? 'Connected' : 'Not connected'}</span></div>
          <hr className="hr" />
          {on ? <span style={{ fontSize: 14 }}>You’re set. Money for each order is sent after you mark it as shipped.</span> : (
            <>
              <span className="lbl">You’ll need</span>
              {['An ID or passport', 'Your bank account (IBAN)', 'Your tax number, if you have a business'].map((t) => <span key={t} className="row" style={{ fontSize: 14 }}><span style={{ color: 'var(--u-accent)' }}>✓</span>{t}</span>)}
              <span className="m" style={{ fontSize: 13 }}>Takes about 5 minutes. You’ll come right back here.</span>
            </>
          )}
        </div>
        <div className="g u-card u-stack">
          <span className="lbl">How the money works</span>
          <span className="m" style={{ fontSize: 12 }}>Example with a 10% fee. Final fee is set before launch.</span>
          <div className="u-stack" style={{ gap: 8, fontSize: 14 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}><span>{ex.title}</span><span className="num">{formatEURExact(ex.priceCents)}</span></div>
            <div className="row m" style={{ justifyContent: 'space-between' }}><span>Uplift fee (10%)</span><span className="num">− {formatEURExact(fee)}</span></div>
            <div className="row m" style={{ justifyContent: 'space-between' }}><span>Gift wrap</span><span>100% yours</span></div>
            <hr className="hr" />
            <div className="row" style={{ justifyContent: 'space-between', fontWeight: 600 }}><span>You get</span><span className="num">{formatEURExact(ex.priceCents - fee)} + gift wrap</span></div>
          </div>
          <span className="m" style={{ fontSize: 13 }}>Buyers pay shipping on top. No monthly fee, nothing to pay if you don’t sell.</span>
        </div>
        <div className="g u-bar">
          {on ? <span className="m" style={{ flex: 1, textAlign: 'center' }}>Payouts connected</span>
            : <button type="button" className="cta" onClick={async () => { await connectPayouts(); toast('Connected (test mode: real Stripe comes next)'); }}>Connect with Stripe</button>}
        </div>
      </main>
    </>
  );
}
