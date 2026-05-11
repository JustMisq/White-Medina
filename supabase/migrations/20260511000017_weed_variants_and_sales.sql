-- Migration: weed variants, prix_graine, et table de ventes weed

-- 1. Mettre à jour la contrainte CHECK sur stocks_drogue pour accepter les variétés de weed
ALTER TABLE stocks_drogue DROP CONSTRAINT IF EXISTS stocks_drogue_produit_check;

-- Renommer l'ancienne entrée "herbe" en "og_kush" AVANT d'ajouter la nouvelle contrainte
UPDATE stocks_drogue SET produit = 'og_kush' WHERE produit = 'herbe';

ALTER TABLE stocks_drogue ADD CONSTRAINT stocks_drogue_produit_check
  CHECK (produit IN ('og_kush', 'purple_haze', 'white_widow', 'blue_dream', 'coke', 'meth', 'pills', 'autre'));

-- 2. Ajouter la colonne prix_graine (uniquement pertinent pour og_kush)
ALTER TABLE stocks_drogue ADD COLUMN IF NOT EXISTS prix_graine numeric DEFAULT NULL;

-- 3. Créer la table de ventes de weed
CREATE TABLE IF NOT EXISTS ventes_weed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variete text NOT NULL CHECK (variete IN ('og_kush', 'purple_haze', 'white_widow', 'blue_dream')),
  quantite_g numeric NOT NULL CHECK (quantite_g > 0),
  prix_vente_g numeric NOT NULL CHECK (prix_vente_g >= 0),
  vendeur_id uuid REFERENCES membres(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ventes_weed ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth full access ventes_weed' AND tablename = 'ventes_weed') THEN
    CREATE POLICY "Auth full access ventes_weed" ON ventes_weed FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;
