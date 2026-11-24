'use client';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { getMaker, getMakerProducts } from '@/lib/data';
import { useData } from '@/lib/useData';
import { useIsDesktop } from '@/lib/useIsDesktop';
import { BackButton } from '@/components/u/Bits';
import MakerProfile from '@/components/u/MakerProfile';
import Loading from '@/components/u/Loading';
import Wash from '@/components/u/Wash';
import Img from '@/components/u/Img';

/** Her profile on its own page (links from pieces, Following, Home). Story opens as a full-screen photo + caption. */
export default function MakerPage() {
  const { slug } = useParams<{ slug: string }>();
  const q = useSearchParams();
  const router = useRouter();
  const [m] = useData(() => getMaker(slug), [slug]);
  const [products] = useData(async () => { const x = await getMaker(slug); return x ? getMakerProducts(x.id) : []; }, [slug]);
  const [story, setStory] = useState(false);
  if (m === null) return (<main className="u-page"><Wash /><BackButton /><span className="hand" style={{ fontSize: 22 }}>Maker not found</span><Link href="/" className="cta">Discover makers</Link></main>);
  if (!m || !products) return <Loading />;
  const tab = (q.get('tab') as 'reviews' | 'journal' | null) ?? 'works';
  return (
    <>
      <Wash src={m.portraitUrl} />
      <div className="mk-wrap" style={{ position: 'relative', zIndex: 1 }}>
        <MakerProfileResponsive m={m} products={products} tab={tab} onStory={() => setStory(true)} />
      </div>
      <span style={{ position: 'fixed', left: 14, top: 'calc(14px + env(safe-area-inset-top))', zIndex: 20 }} className="mk-back"><BackButton href="/" /></span>
      {story ? (
        <div role="dialog" aria-modal="true" aria-label={`${m.name}’s story`} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'var(--u-bg)' }}>
          <Img src={m.video?.posterUrl ?? m.portraitUrl} alt={`${m.name} at work`} className="u-cover" style={{ position: 'absolute', inset: 0 }} />
          {m.video?.hasCaptions ? <p style={{ position: 'absolute', left: 24, right: 24, bottom: 120, textAlign: 'center', margin: 0 }}><span style={{ background: 'var(--u-shade)', padding: '4px 10px', borderRadius: 8, fontSize: 18, lineHeight: 1.9, boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' }}>“{m.video.caption}”</span></p> : null}
          <button type="button" className="ic gs" aria-label="Close story" style={{ position: 'absolute', right: 16, top: 'calc(16px + env(safe-area-inset-top))' }} onClick={() => setStory(false)}>✕</button>
          <button type="button" className="cta" style={{ position: 'absolute', left: 16, right: 16, bottom: 'calc(24px + env(safe-area-inset-bottom))' }} onClick={() => { setStory(false); router.push(`/messages/${m.slug}`); }}>Message {m.name}</button>
        </div>
      ) : null}
      <style>{`@media (min-width:820px){.mk-wrap{padding:96px 24px 40px;max-width:1392px;margin:0 auto}.mk-back{display:none}.mk-phone{display:none}}@media (max-width:819px){.mk-desk{display:none}}`}</style>
    </>
  );
}

/** Only one layout is rendered (phone OR desktop), so photos load once (FIXES 1.1). */
function MakerProfileResponsive({ m, products, tab, onStory }: { m: NonNullable<Awaited<ReturnType<typeof getMaker>>>; products: Awaited<ReturnType<typeof getMakerProducts>>; tab: 'works' | 'journal' | 'reviews'; onStory: () => void }) {
  const desktop = useIsDesktop();
  if (desktop === undefined) return null;
  return <MakerProfile maker={m} products={products} initialTab={tab} onStory={onStory} desktop={desktop} />;
}
