import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client using SSR-compatible browser client
// NOTE: Relax typing to `any` while schema definitions catch up to code usage.
export const supabase = createBrowserClient<any>(supabaseUrl, supabaseAnonKey);

// For server-side operations with service role (use in API routes only)
export const createServerClient = () => {
  const { createClient } = require('@supabase/supabase-js');
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient<any>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
