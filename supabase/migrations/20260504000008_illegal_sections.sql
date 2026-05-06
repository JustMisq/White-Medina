-- Armurerie
CREATE TABLE IF NOT EXISTS armes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_arme text NOT NULL,
  modele text,
  calibre text,
  etat text NOT NULL DEFAULT 'bon' CHECK (etat IN ('bon', 'usé', 'hors_service')),
  serie_efface boolean NOT NULL DEFAULT false,
  provenance text NOT NULL DEFAULT 'autre' CHECK (provenance IN ('volé', 'acheté', 'récupéré', 'autre')),
  membre_id uuid REFERENCES membres(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Stocks de munitions (calibre unique)
CREATE TABLE IF NOT EXISTS munitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calibre text NOT NULL UNIQUE,
  quantite integer NOT NULL DEFAULT 0 CHECK (quantite >= 0),
  updated_at timestamptz DEFAULT now()
);

-- Stocks de drogue (produit unique)
CREATE TABLE IF NOT EXISTS stocks_drogue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produit text NOT NULL UNIQUE CHECK (produit IN ('herbe', 'coke', 'meth', 'pills', 'autre')),
  quantite_g numeric NOT NULL DEFAULT 0 CHECK (quantite_g >= 0),
  prix_achat_g numeric DEFAULT 0,
  prix_revente_g numeric DEFAULT 0,
  notes text,
  updated_at timestamptz DEFAULT now()
);

-- Business (façades légales)
CREATE TABLE IF NOT EXISTS business (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  type_business text NOT NULL DEFAULT 'autre' CHECK (type_business IN ('laverie', 'resto', 'garage', 'bar', 'salon', 'autre')),
  revenu_mensuel numeric NOT NULL DEFAULT 0,
  gerant_id uuid REFERENCES membres(id) ON DELETE SET NULL,
  niveau_suspicion integer NOT NULL DEFAULT 1 CHECK (niveau_suspicion BETWEEN 1 AND 5),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Chaleur policière (heat events)
CREATE TABLE IF NOT EXISTS heat_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  impact integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Territoires
CREATE TABLE IF NOT EXISTS territoires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  statut text NOT NULL DEFAULT 'stable' CHECK (statut IN ('stable', 'contesté', 'perdu')),
  revenu_mensuel numeric NOT NULL DEFAULT 0,
  faction_rivale text,
  image_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS policies (authenticated users have full access to all illegal tables)
ALTER TABLE armes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth full access armes' AND tablename = 'armes') THEN CREATE POLICY "Auth full access armes" ON armes FOR ALL TO authenticated USING (true) WITH CHECK (true); END IF; END $$;

ALTER TABLE munitions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth full access munitions' AND tablename = 'munitions') THEN CREATE POLICY "Auth full access munitions" ON munitions FOR ALL TO authenticated USING (true) WITH CHECK (true); END IF; END $$;

ALTER TABLE stocks_drogue ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth full access stocks_drogue' AND tablename = 'stocks_drogue') THEN CREATE POLICY "Auth full access stocks_drogue" ON stocks_drogue FOR ALL TO authenticated USING (true) WITH CHECK (true); END IF; END $$;

ALTER TABLE business ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth full access business' AND tablename = 'business') THEN CREATE POLICY "Auth full access business" ON business FOR ALL TO authenticated USING (true) WITH CHECK (true); END IF; END $$;

ALTER TABLE heat_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth full access heat_events' AND tablename = 'heat_events') THEN CREATE POLICY "Auth full access heat_events" ON heat_events FOR ALL TO authenticated USING (true) WITH CHECK (true); END IF; END $$;

ALTER TABLE territoires ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth full access territoires' AND tablename = 'territoires') THEN CREATE POLICY "Auth full access territoires" ON territoires FOR ALL TO authenticated USING (true) WITH CHECK (true); END IF; END $$;

-- Storage : bucket pour les images de territoires
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
