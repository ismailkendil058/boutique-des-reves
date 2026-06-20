-- Admin table for /admin access
-- Stores the admin password used to access the admin dashboard

CREATE TABLE IF NOT EXISTS admin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon) to read the admin password (needed for login check)
CREATE POLICY "Allow anon read admin password" ON admin
  FOR SELECT USING (true);

-- Insert a default admin password
INSERT INTO admin (password) VALUES ('admin');

-- Trigger for updated_at
CREATE TRIGGER set_timestamp_admin BEFORE INSERT OR UPDATE ON admin
  FOR EACH ROW EXECUTE FUNCTION set_timestamp();