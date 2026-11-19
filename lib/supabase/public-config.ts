/**
 * Browser-safe Supabase configuration.
 *
 * Next.js inlines `process.env.NEXT_PUBLIC_X` only where it is written out literally. Passing the whole
 * `process.env` object would see nothing in the browser, so the two public variables are named explicitly.
 */
import { getSupabaseConfig, type SupabaseConfig } from './config';

export const publicConfig = (): SupabaseConfig =>
  getSupabaseConfig({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
