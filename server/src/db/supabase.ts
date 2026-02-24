/**
 * Supabase client initialization
 */
import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

export const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Initialize admin client for server operations
export const supabaseAdmin = createClient(config.SUPABASE_URL, config.SUPABASE_KEY, {
  auth: {
    persistSession: false,
  },
});
