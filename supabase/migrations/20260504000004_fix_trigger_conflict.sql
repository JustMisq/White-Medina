-- Fix: remplace ON CONFLICT (user_id) DO NOTHING par ON CONFLICT DO NOTHING
-- Le partial index WHERE user_id IS NOT NULL n'est pas compatible avec ON CONFLICT (column)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.membres (pseudo, rang, statut, points, date_recrutement, notes, user_id)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'pseudo', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'rang', 'Nova')::rang,
    COALESCE(NEW.raw_user_meta_data->>'statut', 'actif')::statut_membre,
    COALESCE((NEW.raw_user_meta_data->>'points')::integer, 0),
    COALESCE((NEW.raw_user_meta_data->>'date_recrutement')::date, CURRENT_DATE),
    NEW.raw_user_meta_data->>'notes',
    NEW.id
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
