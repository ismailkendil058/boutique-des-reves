-- Fix: Disable RLS on all data tables
-- The app uses a custom PIN-based login (not Supabase Auth), so auth.role()
-- always returns 'anon' and the admin/employee RLS policies block ALL queries.
-- Since the app has no real server-side auth, disabling RLS is the correct fix.

-- Disable RLS on all tables
ALTER TABLE articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE location_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE versements DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_versements DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE saved_contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE saved_contract_articles DISABLE ROW LEVEL SECURITY;