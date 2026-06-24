-- Supabase PostgreSQL schema for Reve Collection Manager
-- Generated based on frontend TypeScript interfaces

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE category_enum AS ENUM ('Tenues', 'Accessoires');
CREATE TYPE article_status_enum AS ENUM ('Disponible', 'Loué', 'En entretien');
CREATE TYPE location_status_enum AS ENUM ('En cours', 'À venir', 'Rendue', 'En retard');
CREATE TYPE occasion_enum AS ENUM ('Mariage', 'Fiançailles', 'Cérémonie', 'Anniversaire', 'Autre');
CREATE TYPE versement_type_enum AS ENUM ('Versement', 'Solde', 'Caution');
CREATE TYPE role_enum AS ENUM ('admin', 'employee');

-- Helper function for timestamps
CREATE OR REPLACE FUNCTION set_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Articles
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category category_enum NOT NULL,
  size TEXT,
  color TEXT,
  price NUMERIC NOT NULL,
  caution NUMERIC NOT NULL,
  status article_status_enum NOT NULL,
  condition TEXT,
  notes TEXT,
  photo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  mesures TEXT,
  created_at DATE NOT NULL,
  created_at_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Employees (application‑level, not Supabase auth users)
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  pin TEXT NOT NULL,
  worker TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Locations
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  pickup_date DATE NOT NULL,
  return_date DATE NOT NULL,
  actual_return_date DATE,
  occasion occasion_enum NOT NULL,
  total NUMERIC NOT NULL,
  caution NUMERIC NOT NULL,
  caution_returned BOOLEAN DEFAULT FALSE,
  status location_status_enum NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Junction table for location ↔ article (allows custom price per article)
CREATE TABLE location_articles (
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE RESTRICT,
  custom_price NUMERIC,
  PRIMARY KEY (location_id, article_id)
);

-- Versements (payments) linked to a location
CREATE TABLE versements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  type versement_type_enum NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reservations
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  pickup_date DATE NOT NULL,
  return_date DATE NOT NULL,
  occasion occasion_enum NOT NULL,
  total NUMERIC NOT NULL,
  caution NUMERIC NOT NULL,
  versement NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at DATE NOT NULL,
  created_at_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Versements (payments) linked to a reservation
CREATE TABLE reservation_versements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL DEFAULT 'Versement',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Junction table for reservation ↔ article (allows custom price per article)
CREATE TABLE reservation_articles (
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE RESTRICT,
  custom_price NUMERIC,
  PRIMARY KEY (reservation_id, article_id)
);

-- Saved contracts (historical snapshot of a location)
CREATE TABLE saved_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  pickup_date DATE NOT NULL,
  return_date DATE NOT NULL,
  total NUMERIC NOT NULL,
  caution NUMERIC NOT NULL,
  verse NUMERIC NOT NULL,
  reste NUMERIC NOT NULL,
  notes TEXT,
  saved_at DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Articles stored inside a saved contract (denormalised snapshot)
CREATE TABLE saved_contract_articles (
  saved_contract_id UUID NOT NULL REFERENCES saved_contracts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  PRIMARY KEY (saved_contract_id, name)
);

-- Triggers for automatic timestamps
CREATE TRIGGER set_timestamp_articles BEFORE INSERT OR UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION set_timestamp();
CREATE TRIGGER set_timestamp_clients BEFORE INSERT OR UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION set_timestamp();
CREATE TRIGGER set_timestamp_employees BEFORE INSERT OR UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION set_timestamp();
CREATE TRIGGER set_timestamp_locations BEFORE INSERT OR UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION set_timestamp();
CREATE TRIGGER set_timestamp_versements BEFORE INSERT OR UPDATE ON versements FOR EACH ROW EXECUTE FUNCTION set_timestamp();
CREATE TRIGGER set_timestamp_reservations BEFORE INSERT OR UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION set_timestamp();
CREATE TRIGGER set_timestamp_reservation_versements BEFORE INSERT OR UPDATE ON reservation_versements FOR EACH ROW EXECUTE FUNCTION set_timestamp();
CREATE TRIGGER set_timestamp_saved_contracts BEFORE INSERT OR UPDATE ON saved_contracts FOR EACH ROW EXECUTE FUNCTION set_timestamp();

-- Indexes for fast look‑ups
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_locations_client_id ON locations(client_id);
CREATE INDEX idx_locations_status ON locations(status);
CREATE INDEX idx_versements_location_id ON versements(location_id);
CREATE INDEX idx_reservations_client_id ON reservations(client_id);
CREATE INDEX idx_location_articles_article_id ON location_articles(article_id);
CREATE INDEX idx_reservation_articles_article_id ON reservation_articles(article_id);
CREATE INDEX idx_reservation_versements_reservation_id ON reservation_versements(reservation_id);

-- RLS Policies (role based)
-- Enable row level security
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE versements ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_versements ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_contract_articles ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY admin_full_access ON articles USING (auth.role() = 'admin') WITH CHECK (auth.role() = 'admin');
CREATE POLICY admin_full_access ON clients USING (auth.role() = 'admin') WITH CHECK (auth.role() = 'admin');
CREATE POLICY admin_full_access ON employees USING (auth.role() = 'admin') WITH CHECK (auth.role() = 'admin');
CREATE POLICY admin_full_access ON locations USING (auth.role() = 'admin') WITH CHECK (auth.role() = 'admin');
CREATE POLICY admin_full_access ON location_articles USING (auth.role() = 'admin') WITH CHECK (auth.role() = 'admin');
CREATE POLICY admin_full_access ON versements USING (auth.role() = 'admin') WITH CHECK (auth.role() = 'admin');
CREATE POLICY admin_full_access ON reservations USING (auth.role() = 'admin') WITH CHECK (auth.role() = 'admin');
CREATE POLICY admin_full_access ON reservation_versements USING (auth.role() = 'admin') WITH CHECK (auth.role() = 'admin');
CREATE POLICY admin_full_access ON reservation_articles USING (auth.role() = 'admin') WITH CHECK (auth.role() = 'admin');
CREATE POLICY admin_full_access ON saved_contracts USING (auth.role() = 'admin') WITH CHECK (auth.role() = 'admin');
CREATE POLICY admin_full_access ON saved_contract_articles USING (auth.role() = 'admin') WITH CHECK (auth.role() = 'admin');

-- Employee: read‑only access
CREATE POLICY employee_read ON articles FOR SELECT USING (auth.role() = 'employee');
CREATE POLICY employee_read ON clients FOR SELECT USING (auth.role() = 'employee');
CREATE POLICY employee_read ON employees FOR SELECT USING (auth.role() = 'employee');
CREATE POLICY employee_read ON locations FOR SELECT USING (auth.role() = 'employee');
CREATE POLICY employee_read ON location_articles FOR SELECT USING (auth.role() = 'employee');
CREATE POLICY employee_read ON versements FOR SELECT USING (auth.role() = 'employee');
CREATE POLICY employee_read ON reservations FOR SELECT USING (auth.role() = 'employee');
CREATE POLICY employee_read ON reservation_versements FOR SELECT USING (auth.role() = 'employee');
CREATE POLICY employee_read ON reservation_articles FOR SELECT USING (auth.role() = 'employee');
CREATE POLICY employee_read ON saved_contracts FOR SELECT USING (auth.role() = 'employee');
CREATE POLICY employee_read ON saved_contract_articles FOR SELECT USING (auth.role() = 'employee');

-- Storage bucket for article photos (optional, created via Supabase UI or CLI)
-- The bucket name will be "article_photos". Permissions can be set to allow public read or authenticated upload.

-- End of schema
