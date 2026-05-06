-- Ajouter le champ images aux contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS images text[] NOT NULL DEFAULT '{}';

-- Créer le bucket storage pour les images des identités
INSERT INTO storage.buckets (id, name, public)
VALUES ('identites', 'identites', true)
ON CONFLICT (id) DO NOTHING;

-- Politique RLS : lecture publique
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Lecture publique identites' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Lecture publique identites"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'identites');
  END IF;
END $$;

-- Politique RLS : upload pour les authentifiés
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Upload authentifié identites' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Upload authentifié identites"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'identites');
  END IF;
END $$;

-- Politique RLS : suppression pour les authentifiés
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Suppression authentifié identites' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Suppression authentifié identites"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'identites');
  END IF;
END $$;
