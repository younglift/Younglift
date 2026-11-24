'use client';
import { useState } from 'react';
import { thumb } from '@/lib/img';

type Props = React.ImgHTMLAttributes<HTMLImageElement> & { src: string; small?: boolean; eager?: boolean };
/** Every photo goes through this: lazy by default, small copy for thumbs/avatars, falls back to the original if the small copy is missing. */
export default function Img({ src, small, eager, alt = '', ...rest }: Props) {
  const [orig, setOrig] = useState(false);
  const s = small && !orig ? thumb(src) : src;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={s} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" {...(eager ? { fetchPriority: 'high' as const } : {})} onError={small && !orig ? () => setOrig(true) : undefined} {...rest} />;
}
