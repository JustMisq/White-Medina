-- Migration: système de ventes génériques (remplace ventes_weed)

-- 1. Table des catégories de produits vendus
CREATE TABLE IF NOT EXISTS produit_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  icone text NOT NULL DEFAULT '📦',
  couleur text NOT NULL DEFAULT 'gray',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE produit_categories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Auth full access produit_categories' AND tablename = 'produit_categories'
  ) THEN
    CREATE POLICY "Auth full access produit_categories" ON produit_categories
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 2. Table des sous-types par catégorie (ex: OG Kush, Purple Haze pour Weed)
CREATE TABLE IF NOT EXISTS produit_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categorie_id uuid NOT NULL REFERENCES produit_categories(id) ON DELETE CASCADE,
  nom text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(categorie_id, nom)
);

ALTER TABLE produit_types ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Auth full access produit_types' AND tablename = 'produit_types'
  ) THEN
    CREATE POLICY "Auth full access produit_types" ON produit_types
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 3. Table de ventes génériques (remplace ventes_weed)
CREATE TABLE IF NOT EXISTS ventes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categorie_id uuid NOT NULL REFERENCES produit_categories(id) ON DELETE RESTRICT,
  type_id uuid REFERENCES produit_types(id) ON DELETE SET NULL,
  quantite numeric NOT NULL CHECK (quantite > 0),
  unite text NOT NULL DEFAULT 'u',
  prix_unitaire numeric NOT NULL CHECK (prix_unitaire >= 0),
  total_recu numeric NOT NULL DEFAULT 0 CHECK (total_recu >= 0),
  montant_vole numeric DEFAULT NULL CHECK (montant_vole IS NULL OR montant_vole >= 0),
  vendeur_id uuid REFERENCES membres(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ventes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Auth full access ventes' AND tablename = 'ventes'
  ) THEN
    CREATE POLICY "Auth full access ventes" ON ventes
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 4. Données initiales — catégories de produits
INSERT INTO produit_categories (nom, icone, couleur) VALUES
  ('Weed',  '🌿', 'green'),
  ('Coke',  '🤍', 'white'),
  ('Meth',  '⚗️', 'blue'),
  ('Pills', '💊', 'purple'),
  ('Armes', '🔫', 'red'),
  ('Matos', '📦', 'orange'),
  ('Autre', '📋', 'gray');

-- 5. Sous-types Weed (OG Kush, Purple Haze, White Widow, Blue Dream)
INSERT INTO produit_types (categorie_id, nom)
SELECT pc.id, t.nom
FROM produit_categories pc
CROSS JOIN (VALUES ('OG Kush'), ('Purple Haze'), ('White Widow'), ('Blue Dream')) AS t(nom)
WHERE pc.nom = 'Weed'
ON CONFLICT (categorie_id, nom) DO NOTHING;

-- 6. Migration des ventes_weed existantes vers la nouvelle table
INSERT INTO ventes (categorie_id, type_id, quantite, unite, prix_unitaire, total_recu, vendeur_id, notes, created_at)
SELECT
  pc.id,
  pt.id,
  vw.quantite_g,
  'g',
  vw.prix_vente_g,
  vw.quantite_g * vw.prix_vente_g,
  vw.vendeur_id,
  vw.notes,
  vw.created_at
FROM ventes_weed vw
JOIN produit_categories pc ON pc.nom = 'Weed'
LEFT JOIN produit_types pt ON pt.categorie_id = pc.id AND pt.nom = CASE vw.variete
  WHEN 'og_kush'     THEN 'OG Kush'
  WHEN 'purple_haze' THEN 'Purple Haze'
  WHEN 'white_widow' THEN 'White Widow'
  WHEN 'blue_dream'  THEN 'Blue Dream'
  ELSE NULL
END;
