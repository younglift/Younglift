'use client';
import { useState } from 'react';
import type { MakerSticker, UpliftSticker } from '@/lib/types';

/** File for each sticker key in public/stickers/. Matas can redraw a PNG under the same name; no code change. */
const FILE: Record<MakerSticker | UpliftSticker, string> = {
  one_of_one: '1of1', handmade: 'handmade', small_batch: 'small-batch', made_in_city: 'made-in-{city}',
  made_in_collab: 'made-in-collab', made_to_order: 'made-to-order',
  new_maker: 'new-maker', just_dropped: 'just-dropped', last_one_left: 'last-one-left',
  back_in_stock: 'back-in-stock', in_progress: 'in-progress', picked_for_you: 'picked-for-you',
};
export const STICKER_LABEL: Record<MakerSticker | UpliftSticker, string> = {
  one_of_one: '1 of 1', handmade: 'Handmade', small_batch: 'Small batch', made_in_city: 'Made in', made_in_collab: 'Collab',
  made_to_order: 'Made to order', new_maker: 'New maker', just_dropped: 'Just dropped', last_one_left: 'Last one',
  back_in_stock: 'Back in stock', in_progress: 'In progress', picked_for_you: 'Picked for you',
};
const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-');
export function stickerSrc(k: MakerSticker | UpliftSticker, city?: string) {
  return `/stickers/${FILE[k].replace('{city}', slug(city ?? ''))}.png`;
}

type Props = { k: MakerSticker | UpliftSticker; city?: string; width?: number; tilt?: number; className?: string; style?: React.CSSProperties };
/** A sticker image. If a city has no "Made in …" file yet, nothing is shown (instead of a broken image). */
export default function Sticker({ k, city, width = 110, tilt = -8, className, style }: Props) {
  const [broken, setBroken] = useState(false);
  if (broken) return null;
  const label = k === 'made_in_city' ? `Made in ${city}` : STICKER_LABEL[k];
  return (
    <img src={stickerSrc(k, city)} alt={label} className={className} onError={() => setBroken(true)}
      style={{ width, height: 'auto', display: 'block', transform: `rotate(${tilt}deg)`, filter: 'var(--u-sticker-shadow)', pointerEvents: 'none', ...style }} />
  );
}
