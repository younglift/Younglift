// The only data entry point for UI code: import from '@/lib/data'.
// Today: mock backend (./mock) with the real rules. Later the same functions read from Supabase.
export * from './mock';
export type { BagView, AddResult, CheckoutInput, CheckoutResult } from './mock';
