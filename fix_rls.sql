/* --------------------------------------------------------------
   1️⃣  Make sure the bucket exists and is public (idempotent)
   -------------------------------------------------------------- */
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images','product-images', true)
ON CONFLICT (id) DO UPDATE SET
    name   = EXCLUDED.name,
    public = EXCLUDED.public;

/* --------------------------------------------------------------
   2️⃣  Enable RLS on the storage tables (required for policies)
   -------------------------------------------------------------- */
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

/* --------------------------------------------------------------
   3️⃣  INSERT policy – allow **any** client (including anonymous) to upload
   -------------------------------------------------------------- */
DROP POLICY IF EXISTS allow_anonymous_insert ON storage.objects;
CREATE POLICY allow_anonymous_insert ON storage.objects
  FOR INSERT
  USING (true)                                   -- no auth check
  WITH CHECK (bucket_id = 'product-images');   -- restrict to our bucket only;

/* --------------------------------------------------------------
   4️⃣  SELECT policy – allow anyone to read the uploaded files
   -------------------------------------------------------------- */
DROP POLICY IF EXISTS allow_anonymous_select ON storage.objects;
CREATE POLICY allow_anonymous_select ON storage.objects
  FOR SELECT
  USING (true);    -- open read access

/* --------------------------------------------------------------
   5️⃣  (Optional) clean‑up any old restrictive policies
   -------------------------------------------------------------- */
-- Uncomment if you want to drop them:
-- DROP POLICY IF EXISTS objects_insert_auth ON storage.objects;
-- DROP POLICY IF EXISTS objects_select_auth ON storage.objects;
-- DROP POLICY IF EXISTS bucket_admin       ON storage.buckets;
