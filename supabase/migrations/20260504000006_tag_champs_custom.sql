-- Champs personnalisés par tag (tableau de { nom, placeholder })
ALTER TABLE tags ADD COLUMN IF NOT EXISTS champs jsonb NOT NULL DEFAULT '[]';

-- Valeurs des champs custom pour chaque contact
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS champs_custom jsonb NOT NULL DEFAULT '{}';

-- Pré-remplir les tags LSPD et EMS avec des champs par défaut
UPDATE tags SET champs = '[{"nom":"Matricule","placeholder":"ex: 1234"},{"nom":"Division","placeholder":"ex: Patrouille"}]'::jsonb WHERE nom = 'LSPD';
UPDATE tags SET champs = '[{"nom":"Badge EMS","placeholder":"ex: E-042"},{"nom":"Grade","placeholder":"ex: Infirmier"}]'::jsonb WHERE nom = 'EMS';
