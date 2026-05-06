-- ============================================================
-- White Medina – Schéma complet
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

create type rang as enum (
  'Boss', 'Underboss', 'Consigliere', 'Capo', 'Soldat', 'Associé', 'Prospect'
);

create type statut_membre as enum ('actif', 'inactif', 'suspendu');

create type tag_contact as enum (
  'allié', 'ennemi', 'neutre', 'fournisseur', 'acheteur', 'informateur', 'danger'
);

create type statut_operation as enum ('prévu', 'en_cours', 'terminé', 'annulé');

create type categorie_transaction as enum (
  'deal', 'braquage', 'amende', 'achat', 'salaire', 'autre'
);

-- ============================================================
-- MEMBRES
-- ============================================================

create table membres (
  id            uuid primary key default gen_random_uuid(),
  pseudo        text not null,
  rang          rang not null default 'Prospect',
  statut        statut_membre not null default 'actif',
  points        integer not null default 0,
  avatar_url    text,
  date_recrutement date not null default current_date,
  notes         text,
  user_id       uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- CONTACTS & INTEL
-- ============================================================

create table contacts (
  id          uuid primary key default gen_random_uuid(),
  pseudo      text not null,
  faction     text,
  tags        tag_contact[] not null default '{}',
  fiabilite   smallint not null default 3 check (fiabilite between 1 and 5),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- OPÉRATIONS
-- ============================================================

create table operations (
  id           uuid primary key default gen_random_uuid(),
  titre        text not null,
  description  text,
  statut       statut_operation not null default 'prévu',
  date_prevue  timestamptz,
  butin        bigint,
  participants uuid[] not null default '{}',
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- TRÉSORERIE
-- ============================================================

create table transactions (
  id           uuid primary key default gen_random_uuid(),
  montant      bigint not null,
  categorie    categorie_transaction not null default 'autre',
  description  text not null,
  membre_id    uuid references membres(id) on delete set null,
  operation_id uuid references operations(id) on delete set null,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- VUE : solde trésorerie
-- ============================================================

create view solde_tresorerie as
select coalesce(sum(montant), 0) as solde
from transactions;

-- ============================================================
-- TRIGGERS : updated_at automatique
-- ============================================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger membres_updated_at
  before update on membres
  for each row execute function set_updated_at();

create trigger contacts_updated_at
  before update on contacts
  for each row execute function set_updated_at();

create trigger operations_updated_at
  before update on operations
  for each row execute function set_updated_at();

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

alter table membres     enable row level security;
alter table contacts    enable row level security;
alter table operations  enable row level security;
alter table transactions enable row level security;

-- Seuls les utilisateurs connectés peuvent tout voir/modifier
create policy "Authentifié – lecture membres"
  on membres for select to authenticated using (true);

create policy "Authentifié – écriture membres"
  on membres for all to authenticated using (true) with check (true);

create policy "Authentifié – lecture contacts"
  on contacts for select to authenticated using (true);

create policy "Authentifié – écriture contacts"
  on contacts for all to authenticated using (true) with check (true);

create policy "Authentifié – lecture operations"
  on operations for select to authenticated using (true);

create policy "Authentifié – écriture operations"
  on operations for all to authenticated using (true) with check (true);

create policy "Authentifié – lecture transactions"
  on transactions for select to authenticated using (true);

create policy "Authentifié – écriture transactions"
  on transactions for all to authenticated using (true) with check (true);
