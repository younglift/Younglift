'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getMyProduct } from '@/lib/data';
import { useData } from '@/lib/useData';
import Wash from '@/components/u/Wash';
import Editor from '../Editor';

export default function EditPiece() {
  const { id } = useParams<{ id: string }>();
  const [p] = useData(() => getMyProduct(id), [id]);
  if (p === undefined) return <Wash />;
  if (p === null) return <main className="u-page"><Wash /><span className="hand">Piece not found</span><Link href="/studio/pieces" className="cta">Your pieces</Link></main>;
  return <Editor key={p.id} initial={p} />;
}
