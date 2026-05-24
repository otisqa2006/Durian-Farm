import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL or Key is missing from environment variables.');
}

if (typeof window !== 'undefined') {
  throw new Error('FATAL: Supabase Admin client cannot be used on the client side! This leaks the Service Role Key.');
}

// Client có quyền cao nhất (Bypass RLS)
export const supabase = createClient(supabaseUrl, supabaseKey);
