import { createClient } from '@supabase/supabase-js';

import { TypedSupabaseClient } from './types';

let client: TypedSupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  if (client) {
    return client;
  }

  client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  return client;
}
