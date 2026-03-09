import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';

let supabaseClient = null;

export const initSupabase = () => {
  try {
    supabaseClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    logger.info('Supabase client initialized');
    return supabaseClient;
  } catch (error) {
    logger.error(`Supabase initialization failed: ${error.message}`);
    process.exit(1);
  }
};

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    initSupabase();
  }
  return supabaseClient;
};
