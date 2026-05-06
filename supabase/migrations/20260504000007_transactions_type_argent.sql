-- Ajouter le type d'argent aux transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS type_argent text NOT NULL DEFAULT 'propre' CHECK (type_argent IN ('propre', 'sale'));

-- Mettre à jour la vue existante (garde la rétrocompat)
DROP VIEW IF EXISTS solde_tresorerie;
CREATE VIEW solde_tresorerie AS
  SELECT COALESCE(SUM(montant), 0) AS solde FROM transactions;

-- Nouvelle vue : solde propre
CREATE OR REPLACE VIEW solde_propre AS
  SELECT COALESCE(SUM(montant), 0) AS solde FROM transactions WHERE type_argent = 'propre';

-- Nouvelle vue : solde sale
CREATE OR REPLACE VIEW solde_sale AS
  SELECT COALESCE(SUM(montant), 0) AS solde FROM transactions WHERE type_argent = 'sale';
