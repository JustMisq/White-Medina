-- Table pour le matos divers (matos Fleeka, superette, clés, etc.)
create table if not exists stocks_matos (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  categorie text not null,
  quantite integer not null default 0,
  unite text not null default 'unités',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table stocks_matos enable row level security;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated full access on stocks_matos' AND tablename = 'stocks_matos') THEN
  CREATE POLICY "authenticated full access on stocks_matos" ON stocks_matos FOR ALL TO authenticated USING (true) WITH CHECK (true);
END IF; END $$;
