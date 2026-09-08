import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://bxpjxnxcbetlbuulbuus.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_jXGBfl77a42sF6diLx1vOQ_ULzdx9Do';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.warn('Supabase credentials not fully configured. Using fallback configuration.');
    }
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return supabaseInstance;
}

export const supabase = getSupabaseClient();
