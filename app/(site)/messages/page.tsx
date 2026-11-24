'use client';
import Link from 'next/link';
import { getThreads, getUnreadCount } from '@/lib/data';
import { useData } from '@/lib/useData';
import Wash from '@/components/u/Wash';
import Inbox from './Inbox';

/** 06 Messages: one thread per maker. */
export default function Messages() {
  const [unread] = useData(getUnreadCount);
  const [threads] = useData(getThreads);
  return (
    <>
      <Wash src={threads?.[0]?.maker.portraitUrl ?? '/img/inez.jpg'} />
      <main className="u-page narrow">
        <div className="u-head"><span><h1 className="hand">Messages</h1><span className="m sub">{unread ? `${unread} new` : 'All read'}</span></span></div>
        <Inbox />
        <Link href="/following" className="gs u-card row" style={{ justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span style={{ fontWeight: 600 }}>Custom requests</span><span className="m" style={{ fontSize: 13 }}>Ask a maker to make something just for you. Open a maker and tap “Ask for a custom piece”.</span></span><span>›</span>
        </Link>
      </main>
    </>
  );
}
