
import { createClient } from '@supabase/supabase-js';

// Access environment variables (Vite prefix)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a single supabase client for interacting with your database
// We check if keys exist to prevent crashing on missing env, strictly logging a warning
const isConfigured = supabaseUrl && supabaseAnonKey;

if (!isConfigured) {
    console.warn("Supabase is not configured. Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.");
}

export const supabase = isConfigured
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
