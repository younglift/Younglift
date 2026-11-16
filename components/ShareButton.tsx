'use client';
import { useState } from 'react';
import { Share } from './Icons';
import g from './Glass.module.css';

/** Glass share button: the phone's share sheet when available, otherwise copies the link. */
export default function ShareButton({ title, label }: { title: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={`glass ${g.round}`}
      aria-label={copied ? 'Link copied' : label}
      title={copied ? 'Link copied' : undefined}
      onClick={async () => {
        const url = window.location.href;
        try {
          if (navigator.share) { await navigator.share({ title, url }); return; }
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch { /* cancelled or not allowed */ }
      }}
    >
      {copied ? <span style={{ fontSize: 11, fontWeight: 700 }}>✓</span> : <Share />}
    </button>
  );
}
