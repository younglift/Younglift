import Link from 'next/link';
import Logo from '@/components/u/Logo';
import Wash from '@/components/u/Wash';
import s from './welcome.module.css';
import Img from '@/components/u/Img';

const MAKERS = [
  { slug: 'inez', name: 'Inez', where: 'Vilnius · Jewellery', img: '/img/earrings.jpg', face: '/img/inez.jpg' },
  { slug: 'mara', name: 'Mara', where: 'Berlin · Ceramics', img: '/img/plates.jpg', face: '/img/mara.jpg' },
  { slug: 'ula', name: 'Ula', where: 'Hamburg · Crochet', img: '/img/crochet-bag.jpg', face: '/img/crochet-duo.jpg' },
];

/** 01 Home: first visit. */
export default function Welcome() {
  return (
    <>
      <Wash src="/img/studio-table.jpg" />
      <div className={s.photo} aria-hidden="true"><Img src="/img/studio-table.jpg" alt="" eager /></div>
      <div className={s.logo}><Logo height={92} /></div>
      <header className={s.deskHead}>
        <Logo height={30} wordmark /><span className={s.grow} />
        <Link href="/account" className="sec">Sign in</Link>
        <Link href="/sell" className="sec gs">Sell on Uplift</Link>
      </header>
      <main className={s.home}>
        <div className={s.text}>
          <h1 className="hand">A community of upcoming makers</h1>
          <p className="m">Handmade jewellery, ceramics, crochet and more from the Baltics, Poland and Germany. Bought straight from the people who make it.</p>
        </div>
        <div className={s.actions}>
          <Link href="/welcome/taste" className="cta">Start exploring</Link>
          <Link href="/sell" className="sec gs">I make things</Link>
        </div>
        <div className={s.makers}>
          {MAKERS.map((m) => (
            <Link key={m.slug} href={`/m/${m.slug}`} className="g">
              <Img src={m.img} alt="" />
              <span className={s.who}><Img small src={m.face} alt="" className="u-avatar" /><span className="hand">{m.name}</span></span>
              <span className="m">{m.where}</span>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
