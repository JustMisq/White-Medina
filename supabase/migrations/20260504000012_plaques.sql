-- Table des plaques d'immatriculation
create table if not exists plaques (
  id            uuid primary key default gen_random_uuid(),
  numero        text not null,                        -- ex: "AB-123-CD"
  marque        text,                                 -- ex: "BMW"
  modele        text,                                 -- ex: "M3"
  couleur       text,                                 -- ex: "Noir"
  type_vehicule text not null default 'voiture',      -- 'voiture', 'moto', 'camion', 'quad', 'autre'
  statut        text not null default 'légale',       -- 'légale', 'volée', 'fausse', 'inconnue'
  contact_id    uuid references contacts(id) on delete set null,
  image_url     text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table plaques enable row level security;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated full access on plaques' AND tablename = 'plaques') THEN
  CREATE POLICY "authenticated full access on plaques" ON plaques FOR ALL TO authenticated USING (true) WITH CHECK (true);
END IF; END $$;

create trigger plaques_updated_at
  before update on plaques
  for each row execute function set_updated_at();

-- Bucket storage pour les images des plaques / véhicules
INSERT INTO storage.buckets (id, name, public)
VALUES ('plaques', 'plaques', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read plaques' AND tablename = 'objects') THEN
  CREATE POLICY "Public read plaques" ON storage.objects FOR SELECT USING (bucket_id = 'plaques');
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth upload plaques' AND tablename = 'objects') THEN
  CREATE POLICY "Auth upload plaques" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'plaques');
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth delete plaques' AND tablename = 'objects') THEN
  CREATE POLICY "Auth delete plaques" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'plaques');
END IF; END $$;
