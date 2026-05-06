-- Ajouter la colonne image_url à territoires
ALTER TABLE territoires ADD COLUMN IF NOT EXISTS image_url text;

-- Bucket de stockage pour les images de territoires
INSERT INTO storage.buckets (id, name, public)
VALUES ('territoires', 'territoires', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read territoires' AND tablename = 'objects') THEN
  CREATE POLICY "Public read territoires" ON storage.objects FOR SELECT USING (bucket_id = 'territoires');
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth upload territoires' AND tablename = 'objects') THEN
  CREATE POLICY "Auth upload territoires" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'territoires');
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth delete territoires' AND tablename = 'objects') THEN
  CREATE POLICY "Auth delete territoires" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'territoires');
END IF; END $$;
