// Small helper types for the data contract (docs/ai/SHARED.md).
import type { BagLine, Category, Taste } from '@/lib/types';

export type Me = { id: string; name: string; taste: Taste; role: 'buyer' | 'maker' | 'admin' };
export type Bag = BagLine[];
export type { Category };
