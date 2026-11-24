'use client';
import { useParams } from 'next/navigation';
import type { Category } from '@/lib/types';
import { CATEGORY_LABEL } from '@/lib/data';
import Results from '../Results';

export default function CategoryPage() {
  const { category } = useParams<{ category: Category }>();
  return <Results key={category} title={CATEGORY_LABEL[category] ?? 'Explore'} category={category} />;
}
