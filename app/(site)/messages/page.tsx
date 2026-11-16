'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getThreads, type ChatMessage } from '@/lib/data';
import type { Maker } from '@/lib/types';
import BottomNav from '@/components/BottomNav';
import { chatTime } from '@/lib/time';
import s from './messages.module.css';

// A9 · Messages list (docs/design/screens/Messages.dc.html). Reached from Profile and maker / product pages.

export default function Messages() {
  const [threads, setThreads] = useState<{ maker: Maker; last: ChatMessage }[] | null>(null);
  useEffect(() => { getThreads().then(setThreads); }, []);
  return (
    <main className={s.screen}>
      <div className={s.head}>
        <Link href="/profile" className={s.back}>‹ Profile</Link>
        <h1 className={s.h1}>MESSAGES</h1>
      </div>
      {threads && threads.length === 0 && (
        <div className={s.empty}>
          <span>No messages yet</span>
          <span>Ask a maker about a piece, a size or a custom idea. Their answers show up here.</span>
          <Link href="/" className={s.emptyBtn}>DISCOVER MAKERS</Link>
        </div>
      )}
      {threads?.map(({ maker: m, last }) => (
        <Link key={m.id} href={`/messages/${m.slug}?from=messages`} className={s.thread}>
          <img src={m.portraitUrl} alt="" />
          <span className={s.threadText}>
            <span className={s.threadTop}><span>{m.name}</span><span className="mono">{chatTime(last.at)}</span></span>
            <span className={s.preview}>{last.me ? 'You: ' : ''}{last.text}</span>
          </span>
        </Link>
      ))}
      <div className={s.navSpace} />
      <BottomNav active="none" />
    </main>
  );
}
