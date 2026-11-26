'use client';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { getMaker, getMakerProducts } from '@/lib/data';
import { useData } from '@/lib/useData';
import { useIsDesktop } from '@/lib/useIsDesktop';
import { useLockBody } from '@/lib/useLockBody';
import { BackButton } from '@/components/u/Bits';
import MakerProfile from '@/components/u/MakerProfile';
import Loading from '@/components/u/Loading';
import Wash from '@/components/u/Wash';
import Img from '@/components/u/Img';
import mk from './maker.module.css';
import Icon from '@/components/u/Icon';

/** The maker's profile on its own page (links from pieces, Following, Home). Story opens as a full-screen photo + caption. */
export default function MakerPage() {
  const { slug } = useParams<{ slug: string }>();
  const q = useSearchParams();
  const router = useRouter();
  const [m] = useData(() => getMaker(slug), [slug]);
  const [products] = useData(async () => { const x = await getMaker(slug); return x ? getMakerProducts(x.id) : []; }, [slug]);
  const [story, setStory] = useState(false);
  useLockBody(story, () => setStory(false));
  if (m === null) return (<main className="u-page"><Wash /><BackButton /><span className="hand t-22">Maker not found</span><Link href="/" className="cta">Discover makers</Link></main>);
  if (!m || !products) return <Loading />;
  const tab = (q.get('tab') as 'reviews' | 'journal' | null) ?? 'works';
  return (
    <>
      <Wash src={m.portraitUrl} />
      <div className={`mk-wrap ${mk.wrap}`}>
        <MakerProfileResponsive m={m} products={products} tab={tab} onStory={() => setStory(true)} />
      </div>
      <span className={`mk-back ${mk.back}`}><BackButton href="/" /></span>
      {story ? (
        <div className={mk.story} role="dialog" aria-modal="true" aria-label={`${m.name}’s story`}>
          <Img src={m.video?.posterUrl ?? m.portraitUrl} alt={`${m.name} at work`} className={`u-cover ${'fill'}`} />
          {m.video?.hasCaptions ? <p className={mk.storyCap}><span className={'u-cap ' + mk.capBig}>“{m.video.caption}”</span></p> : null}
          <button type="button" className={`ic gs ${mk.storyClose}`} aria-label="Close story" onClick={() => setStory(false)}><Icon name="close" /></button>
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
