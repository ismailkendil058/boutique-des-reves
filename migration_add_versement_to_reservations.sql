-- Migration: Add versement column and reservation_versements table
-- Run this in your Supabase SQL Editor

-- 1. Add versement column to reservations table
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS versement NUMERIC NOT NULL DEFAULT 0;

-- 2. Create reservation_versements table for tracking payment history
CREATE TABLE IF NOT EXISTS reservation_versements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL DEFAULT 'Versement',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Add trigger for updated_at
CREATE TRIGGER set_timestamp_reservation_versements
  BEFORE INSERT OR UPDATE ON reservation_versements
  FOR EACH ROW EXECUTE FUNCTION set_timestamp();

-- 4. Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_reservation_versements_reservation_id
  ON reservation_versements(reservation_id);

-- 5. Enable RLS
ALTER TABLE reservation_versements ENABLE ROW LEVEL SECURITY;

-- 6. Add RLS policies
CREATE POLICY admin_full_access ON reservation_versements
  USING (auth.role() = 'admin') WITH CHECK (auth.role() = 'admin');

CREATE POLICY employee_read ON reservation_versements
  FOR SELECT USING (auth.role() = 'employee');