-- Migration: Create notes table for tracking article unavailability notes
-- This table stores admin notes when marking articles as "Indisponible"/"En entretien"

CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  article_name TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger for automatic timestamp updates
CREATE TRIGGER set_timestamp_notes BEFORE INSERT OR UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION set_timestamp();

-- Index for fast look-ups by article and date
CREATE INDEX idx_notes_article_id ON notes(article_id);
CREATE INDEX idx_notes_date ON notes(date);

-- RLS Policies
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Admin: full access (insert, select, delete)
CREATE POLICY admin_full_access ON notes
  USING (auth.role() = 'admin')
  WITH CHECK (auth.role() = 'admin');

-- Employee: read only
CREATE POLICY employee_read ON notes
  FOR SELECT
  USING (auth.role() = 'employee');