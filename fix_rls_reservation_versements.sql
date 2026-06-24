-- Fix: Allow anonymous inserts/reads on reservation_versements
-- Run this in your Supabase SQL Editor

-- Option 1: Simply disable RLS on reservation_versements (recommended, matches other tables)
ALTER TABLE reservation_versements DISABLE ROW LEVEL SECURITY;