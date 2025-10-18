import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { createClient } from '@supabase/supabase-js';

import { Database } from './database.types';

export function getSupabaseServerClient(cookieStore: ReadonlyRequestCookies) {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    // {
    //   cookies: {
    //     getAll() {
    //       return cookieStore.getAll();
    //     },
    //     setAll(cookiesToSet) {
    //       cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
    //     },
    //   },
    // },
  );
}
