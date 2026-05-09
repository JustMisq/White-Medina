-- Ajouter le rang "Staff" : accès lecture seule sur toutes les sections

-- 1. Ajouter 'Staff' à l'enum rang
ALTER TYPE rang ADD VALUE IF NOT EXISTS 'Staff';

-- 2. Insertion des permissions par défaut pour Staff (tout voir, rien modifier)
-- Utilisé comme fallback si le hook usePermissions ne court-circuite pas.
INSERT INTO permissions_rang (rang, section, peut_voir, peut_modifier)
VALUES
  ('Staff', 'dashboard',   true, false),
  ('Staff', 'membres',     true, false),
  ('Staff', 'contacts',    true, false),
  ('Staff', 'plaques',     true, false),
  ('Staff', 'tresorerie',  true, false),
  ('Staff', 'operations',  true, false),
  ('Staff', 'armurerie',   true, false),
  ('Staff', 'stocks',      true, false),
  ('Staff', 'business',    true, false),
  ('Staff', 'territoires', true, false),
  ('Staff', 'points',      true, false)
ON CONFLICT (rang, section) DO NOTHING;
