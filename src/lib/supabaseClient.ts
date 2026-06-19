import { createClient } from '@supabase/supabase-js';

// Supabase project URL and anon public key (provided by the user)
const SUPABASE_URL = 'https://ksyypmkipkqrcjvvgkpz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzeXlwbWtpcGtxcmNqdnZna3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4ODEwOTEsImV4cCI6MjA5NzQ1NzA5MX0.pnvsU7LU77GJ_nJayqqOpE0GSo7iNUOQFa03N6QhxPM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
