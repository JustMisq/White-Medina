-- Table des points de la map (lieux avec clé d'accès et contenu)
create table if not exists points_map (
  id              uuid primary key default gen_random_uuid(),
  nom             text not null,
  description     text,
  coordonnees     text,                   -- ex: "X: 1234 / Y: 5678" ou référence de lieu
  type_cle        text not null default 'clé',   -- 'clé', 'code', 'badge', 'autre'
  valeur_cle      text,                   -- la valeur réelle de la clé / code
  contenu         text,                   -- description de ce qui est stocké/accessible
  image_url       text,                   -- photo du lieu
  territoire_id   uuid references territoires(id) on delete set null,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table points_map enable row level security;

create policy "authenticated full access on points_map"
  on points_map for all to authenticated using (true) with check (true);

-- Trigger updated_at
create trigger points_map_updated_at
  before update on points_map
  for each row execute function set_updated_at();

-- Bucket storage pour les images des points
INSERT INTO storage.buckets (id, name, public)
VALUES ('points-map', 'points-map', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read points-map' AND tablename = 'objects') THEN
  CREATE POLICY "Public read points-map" ON storage.objects FOR SELECT USING (bucket_id = 'points-map');
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth upload points-map' AND tablename = 'objects') THEN
  CREATE POLICY "Auth upload points-map" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'points-map');
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth delete points-map' AND tablename = 'objects') THEN
  CREATE POLICY "Auth delete points-map" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'points-map');
END IF; END $$;
