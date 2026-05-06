-- ============================================================
-- Système de permissions par rang
-- ============================================================

CREATE TABLE IF NOT EXISTS permissions_rang (
  rang          text NOT NULL,
  section       text NOT NULL,
  peut_voir     boolean NOT NULL DEFAULT false,
  peut_modifier boolean NOT NULL DEFAULT false,
  PRIMARY KEY (rang, section)
);

ALTER TABLE permissions_rang ENABLE ROW LEVEL SECURITY;

-- Lecture : tous les authentifiés
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE policyname = 'authenticated read permissions' AND tablename = 'permissions_rang'
) THEN
  CREATE POLICY "authenticated read permissions" ON permissions_rang
    FOR SELECT TO authenticated USING (true);
END IF; END $$;

-- Écriture : Gérant uniquement (contrôlé côté app via server action)
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE policyname = 'gerant write permissions' AND tablename = 'permissions_rang'
) THEN
  CREATE POLICY "gerant write permissions" ON permissions_rang
    FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM membres
        WHERE membres.user_id = auth.uid()
          AND membres.rang = 'Gérant'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM membres
        WHERE membres.user_id = auth.uid()
          AND membres.rang = 'Gérant'
      )
    );
END IF; END $$;

-- ============================================================
-- Permissions par défaut
-- sections : dashboard, membres, contacts, plaques, tresorerie,
--            operations, armurerie, stocks, business, territoires, points
-- ============================================================

INSERT INTO permissions_rang (rang, section, peut_voir, peut_modifier) VALUES
-- Bras Droit : accès total
('Bras Droit', 'dashboard',   true,  true),
('Bras Droit', 'membres',     true,  true),
('Bras Droit', 'contacts',    true,  true),
('Bras Droit', 'plaques',     true,  true),
('Bras Droit', 'tresorerie',  true,  true),
('Bras Droit', 'operations',  true,  true),
('Bras Droit', 'armurerie',   true,  true),
('Bras Droit', 'stocks',      true,  true),
('Bras Droit', 'business',    true,  true),
('Bras Droit', 'territoires', true,  true),
('Bras Droit', 'points',      true,  true),

-- Grand : accès large, modification limitée sur certaines sections sensibles
('Grand', 'dashboard',   true,  true),
('Grand', 'membres',     true,  false),
('Grand', 'contacts',    true,  true),
('Grand', 'plaques',     true,  true),
('Grand', 'tresorerie',  true,  false),
('Grand', 'operations',  true,  true),
('Grand', 'armurerie',   true,  true),
('Grand', 'stocks',      true,  true),
('Grand', 'business',    true,  false),
('Grand', 'territoires', true,  false),
('Grand', 'points',      true,  true),

-- Dealer : section illégales + terrain
('Dealer', 'dashboard',   true,  false),
('Dealer', 'membres',     true,  false),
('Dealer', 'contacts',    true,  true),
('Dealer', 'plaques',     true,  true),
('Dealer', 'tresorerie',  false, false),
('Dealer', 'operations',  true,  false),
('Dealer', 'armurerie',   true,  false),
('Dealer', 'stocks',      true,  true),
('Dealer', 'business',    false, false),
('Dealer', 'territoires', false, false),
('Dealer', 'points',      false, false),

-- Petite Frappe : accès basique
('Petite Frappe', 'dashboard',   true,  false),
('Petite Frappe', 'membres',     true,  false),
('Petite Frappe', 'contacts',    true,  true),
('Petite Frappe', 'plaques',     true,  true),
('Petite Frappe', 'tresorerie',  false, false),
('Petite Frappe', 'operations',  true,  false),
('Petite Frappe', 'armurerie',   false, false),
('Petite Frappe', 'stocks',      true,  false),
('Petite Frappe', 'business',    false, false),
('Petite Frappe', 'territoires', false, false),
('Petite Frappe', 'points',      false, false),

-- Nova : accès minimal (nouvelles recrues)
('Nova', 'dashboard',   true,  false),
('Nova', 'membres',     true,  false),
('Nova', 'contacts',    true,  false),
('Nova', 'plaques',     true,  false),
('Nova', 'tresorerie',  false, false),
('Nova', 'operations',  false, false),
('Nova', 'armurerie',   false, false),
('Nova', 'stocks',      false, false),
('Nova', 'business',    false, false),
('Nova', 'territoires', false, false),
('Nova', 'points',      false, false)

ON CONFLICT (rang, section) DO NOTHING;

-- ============================================================
-- Compte administrateur de test
-- Email    : admin@whitemedina.test
-- Password : TestAdmin123!
-- Rang     : Gérant
-- ============================================================

DO $$
DECLARE
  admin_id uuid;
BEGIN
  -- Vérifier si le compte existe déjà
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@whitemedina.test';

  IF admin_id IS NULL THEN
    admin_id := gen_random_uuid();

    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      role,
      aud,
      raw_user_meta_data,
      is_super_admin,
      confirmation_token,
      recovery_token
    ) VALUES (
      admin_id,
      '00000000-0000-0000-0000-000000000000',
      'admin@whitemedina.test',
      extensions.crypt('TestAdmin123!', extensions.gen_salt('bf')),
      now(),
      now(),
      now(),
      'authenticated',
      'authenticated',
      '{"pseudo": "AdminTest", "rang": "Gérant"}'::jsonb,
      false,
      '',
      ''
    );

    -- Le trigger handle_new_user crée le membre avec rang Gérant via raw_user_meta_data
    -- Mise à jour de sécurité au cas où le trigger n'aurait pas lu le rang
    UPDATE membres SET rang = 'Gérant' WHERE user_id = admin_id AND rang = 'Nova';
  END IF;
END $$;
