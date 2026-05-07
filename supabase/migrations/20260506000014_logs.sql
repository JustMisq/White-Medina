-- ============================================================
-- Système de logs d'actions
-- ============================================================

CREATE TABLE IF NOT EXISTS logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action      text NOT NULL,           -- ex: 'membre.create', 'transaction.delete'
  section     text NOT NULL,           -- ex: 'membres', 'tresorerie'
  description text NOT NULL,           -- ex: 'Ajout du membre Scarface (Dealer)'
  auteur_id   uuid REFERENCES membres(id) ON DELETE SET NULL,
  auteur_pseudo text,                  -- snapshot du pseudo au moment de l'action
  meta        jsonb DEFAULT '{}',      -- données supplémentaires (id cible, etc.)
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Lecture : Gérant et Bras Droit uniquement
CREATE POLICY "gerant bras_droit read logs" ON logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM membres
      WHERE membres.user_id = auth.uid()
        AND membres.rang IN ('Gérant', 'Bras Droit')
    )
  );

-- Insertion : tous les authentifiés (les actions serveur gèrent l'insertion)
CREATE POLICY "authenticated insert logs" ON logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Aucune mise à jour ni suppression (logs immuables)

CREATE INDEX IF NOT EXISTS logs_section_idx    ON logs (section);
CREATE INDEX IF NOT EXISTS logs_auteur_id_idx  ON logs (auteur_id);
CREATE INDEX IF NOT EXISTS logs_created_at_idx ON logs (created_at DESC);
