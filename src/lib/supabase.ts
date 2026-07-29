import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://tnuxyfvhwmyiwmzwlozz.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRudXh5ZnZod215aXdtendsb3p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwNjgyNjMsImV4cCI6MjEwMDY4NDI2M30.uS80XMw_K4msZ8Sk-yvTxNI930fwnPpabMLCB6rIiGo';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
