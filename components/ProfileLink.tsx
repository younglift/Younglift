'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getMe } from '@/lib/data';
import s from './ProfileLink.module.css';

/** Small round avatar in page headers that opens Profile (Matas's proposal, A12). */
export default function ProfileLink() {
  const [initial, setInitial] = useState('');
  useEffect(() => { getMe().then((me) => setInitial(me?.name.charAt(0).toUpperCase() ?? '')); }, []);
  return <Link href="/profile" aria-label="Profile" className={s.avatar}>{initial}</Link>;
}
