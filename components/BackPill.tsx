'use client';
import { useRouter } from 'next/navigation';
import s from './Glass.module.css';

/** Glass "‹ Label" pill. Goes one step back in history when we came from inside the app,
 *  otherwise to `href` (e.g. someone opened a shared product link). */
export default function BackPill({ href, label }: { href: string; label: string }) {
  const router = useRouter();
  return (
    <a
      href={href}
      className={`glass ${s.pill}`}
      onClick={(e) => {
        e.preventDefault();
        const internal = typeof document !== 'undefined' && document.referrer.startsWith(window.location.origin);
        if (internal && window.history.length > 1) router.back();
        else router.push(href);
      }}
    >
      <span aria-hidden="true">‹</span> {label}
    </a>
  );
}
