-- ============================================================
-- Correction rangs + tags modulables
-- ============================================================

-- 1. Corriger les rangs
alter table membres drop column rang;
drop type rang;

create type rang as enum (
  'Gérant', 'Bras Droit', 'Grand', 'Dealer', 'Petite Frappe', 'Nova'
);

alter table membres add column rang rang not null default 'Nova';

-- 2. Rendre les tags modulables (text[] au lieu d'enum)
alter table contacts drop column tags;
drop type tag_contact;
alter table contacts add column tags text[] not null default '{}';

-- 3. Table de configuration des tags
create table tags (
  id         uuid primary key default gen_random_uuid(),
  nom        text not null unique,
  couleur    text not null default '#6b7280',
  created_at timestamptz not null default now()
);

-- Tags par défaut
insert into tags (nom, couleur) values
  ('allié',       '#22c55e'),
  ('ennemi',      '#ef4444'),
  ('neutre',      '#6b7280'),
  ('fournisseur', '#3b82f6'),
  ('acheteur',    '#a855f7'),
  ('informateur', '#eab308'),
  ('danger',      '#f97316'),
  ('LSPD',        '#1d4ed8'),
  ('EMS',         '#dc2626');

-- RLS tags
alter table tags enable row level security;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authentifié – lecture tags' AND tablename = 'tags') THEN
  CREATE POLICY "Authentifié – lecture tags" ON tags FOR SELECT TO authenticated USING (true);
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authentifié – écriture tags' AND tablename = 'tags') THEN
  CREATE POLICY "Authentifié – écriture tags" ON tags FOR ALL TO authenticated USING (true) WITH CHECK (true);
END IF; END $$;
