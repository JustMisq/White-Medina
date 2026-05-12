-- Supprimer la contrainte CHECK sur produit pour permettre les nouvelles valeurs
-- (produit est maintenant un champ legacy, la vraie info est dans categorie_id/type_id)

DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'stocks_drogue'::regclass
    AND contype = 'c'
    AND conname LIKE '%produit%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE stocks_drogue DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;
