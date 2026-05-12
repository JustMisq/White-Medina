-- Migration: lier stocks_drogue aux produit_categories/types

-- 1. Permettre produit = NULL pour les nouvelles entrées
ALTER TABLE stocks_drogue ALTER COLUMN produit SET DEFAULT 'autre';

-- 2. Ajouter categorie_id et type_id
ALTER TABLE stocks_drogue
  ADD COLUMN IF NOT EXISTS categorie_id uuid REFERENCES produit_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS type_id uuid REFERENCES produit_types(id) ON DELETE SET NULL;

-- 3. Migrer les weed
UPDATE stocks_drogue sd
SET categorie_id = pc.id
FROM produit_categories pc
WHERE pc.nom = 'Weed'
AND sd.produit IN ('og_kush', 'purple_haze', 'white_widow', 'blue_dream');

UPDATE stocks_drogue sd
SET type_id = pt.id
FROM produit_types pt
JOIN produit_categories pc ON pc.id = pt.categorie_id AND pc.nom = 'Weed'
WHERE (sd.produit = 'og_kush'     AND pt.nom = 'OG Kush')
   OR (sd.produit = 'purple_haze' AND pt.nom = 'Purple Haze')
   OR (sd.produit = 'white_widow' AND pt.nom = 'White Widow')
   OR (sd.produit = 'blue_dream'  AND pt.nom = 'Blue Dream');

-- 4. Migrer les autres drogues
UPDATE stocks_drogue sd SET categorie_id = pc.id
FROM produit_categories pc WHERE pc.nom = 'Coke'  AND sd.produit = 'coke';

UPDATE stocks_drogue sd SET categorie_id = pc.id
FROM produit_categories pc WHERE pc.nom = 'Meth'  AND sd.produit = 'meth';

UPDATE stocks_drogue sd SET categorie_id = pc.id
FROM produit_categories pc WHERE pc.nom = 'Pills' AND sd.produit = 'pills';
