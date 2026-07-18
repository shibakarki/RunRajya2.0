import { createClient } from '@supabase/supabase-js';

// Retrieve values from your root .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials missing. Check your root .env configuration.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);