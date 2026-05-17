import { createClient } from '@supabase/supabase-js';

// Server-side client with service role key — bypasses RLS, server only
export function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY)');
  }

  return createClient(url, key);
}
