-- Lier les membres aux comptes auth
ALTER TABLE membres ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS membres_user_id_unique ON membres(user_id) WHERE user_id IS NOT NULL;

-- Fonction: crée un membre automatiquement à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.membres (pseudo, rang, statut, user_id, date_recrutement)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'pseudo', split_part(NEW.email, '@', 1)),
    'Nova',
    'actif',
    NEW.id,
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur inscription
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Backfill: crée un membre pour les users existants qui n'en ont pas
INSERT INTO public.membres (pseudo, rang, statut, user_id, date_recrutement)
SELECT
  split_part(email, '@', 1),
  'Nova',
  'actif',
  id,
  NOW()
FROM auth.users
WHERE id NOT IN (
  SELECT user_id FROM public.membres WHERE user_id IS NOT NULL
);
