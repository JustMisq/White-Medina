-- Membres : nom de code (pseudo IG) et téléphone IG
ALTER TABLE membres
  ADD COLUMN IF NOT EXISTS nom_code text,
  ADD COLUMN IF NOT EXISTS telephone_ig text;

-- Contacts / Identités : téléphone IG (optionnel)
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS telephone_ig text;
