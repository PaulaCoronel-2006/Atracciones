import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Las variables SUPABASE_URL y SUPABASE_ANON_KEY son requeridas');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

export default supabase;
