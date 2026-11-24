'use client';
import Link from 'next/link';
import { getThreads, isActive } from '@/lib/data';
import { ago } from '@/lib/format';
import { useData } from '@/lib/useData';
import s from './messages.module.css';
import Img from '@/components/u/Img';

export default function Inbox({ current }: { current?: string }) {
  const [threads] = useData(getThreads);
  if (!threads) return null;
  if (!threads.length) return <div className="g u-card m">No messages yet. Ask a maker anything from her profile or a piece.</div>;
  return (
    <div className={`g ${s.list}`}>
      {threads.map((t) => (
        <Link key={t.maker.id} href={`/messages/${t.maker.slug}`} aria-current={current === t.maker.slug ? 'page' : undefined} className={t.unread ? s.unread : ''}>
          <span className={s.av}><Img small src={t.maker.portraitUrl} alt="" className="u-avatar" />{isActive(t.maker) ? <span className={s.on} aria-label="Active now" /> : null}</span>
          <span className={s.txt}><span className={s.top}><span className="hand">{t.maker.name}</span><span className="m">{ago(t.last.at)}</span></span><span className={s.last}>{t.last.fromMe ? 'You: ' : ''}{t.last.imageUrl && !t.last.text ? 'Photo' : t.last.text}</span></span>
          {t.unread ? <span className={s.pip} aria-label="Unread" /> : null}
        </Link>
      ))}
    </div>
  );
}
