export type Rang =
  | "Gérant"
  | "Bras Droit"
  | "Grand"
  | "Dealer"
  | "Petite Frappe"
  | "Nova";

export type StatutMembre = "actif" | "inactif" | "suspendu";

// ─── Permissions ─────────────────────────────────────────────────────────────
export const ALL_SECTIONS = [
  "dashboard",
  "membres",
  "contacts",
  "plaques",
  "tresorerie",
  "operations",
  "armurerie",
  "stocks",
  "business",
  "territoires",
  "points",
] as const;

export type Section = (typeof ALL_SECTIONS)[number];

export interface SectionPermission {
  peut_voir: boolean;
  peut_modifier: boolean;
}

export type PermissionsMap = Partial<Record<Section, SectionPermission>>;

export const RANGS_GERES: Rang[] = [
  "Bras Droit",
  "Grand",
  "Dealer",
  "Petite Frappe",
  "Nova",
];

export interface TagChamp {
  nom: string;
  placeholder: string;
}

export interface Tag {
  id: string;
  nom: string;
  couleur: string;
  champs: TagChamp[];
  created_at: string;
}

export type StatutOperation = "prévu" | "en_cours" | "terminé" | "annulé";

export type CategorieTransaction =
  | "deal"
  | "braquage"
  | "amende"
  | "achat"
  | "salaire"
  | "autre";

export interface Membre {
  id: string;
  pseudo: string;
  rang: Rang;
  statut: StatutMembre;
  points: number;
  avatar_url?: string;
  date_recrutement: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  pseudo: string;
  faction?: string;
  tags: string[];
  images: string[];
  champs_custom: Record<string, Record<string, string>>;
  fiabilite: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  montant: number;
  categorie: CategorieTransaction;
  description: string;
  type_argent: "propre" | "sale";
  membre_id?: string;
  operation_id?: string;
  created_at: string;
}

export interface Operation {
  id: string;
  titre: string;
  description?: string;
  statut: StatutOperation;
  date_prevue?: string;
  butin?: number | null;
  participants: string[]; // membre ids
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ─── Armurerie ─────────────────────────────────────────────────────────────
export type EtatArme = "bon" | "usé" | "hors_service";
export type ProvenanceArme = "volé" | "acheté" | "récupéré" | "autre";

export interface Arme {
  id: string;
  type_arme: string;
  modele?: string;
  calibre?: string;
  etat: EtatArme;
  serie_efface: boolean;
  provenance: ProvenanceArme;
  membre_id?: string;
  notes?: string;
  created_at: string;
}

export interface Munition {
  id: string;
  calibre: string;
  quantite: number;
  updated_at: string;
}

// ─── Stocks illégaux ────────────────────────────────────────────────────────
export type ProduitDrogue = "herbe" | "coke" | "meth" | "pills" | "autre";

export interface StockDrogue {
  id: string;
  produit: ProduitDrogue;
  quantite_g: number;
  prix_achat_g?: number;
  prix_revente_g?: number;
  notes?: string;
  updated_at: string;
}

export interface StockMatos {
  id: string;
  nom: string;
  categorie: string;
  quantite: number;
  unite: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ─── Business ──────────────────────────────────────────────────────────────
export type TypeBusiness = "laverie" | "resto" | "garage" | "bar" | "salon" | "autre";

export interface Business {
  id: string;
  nom: string;
  type_business: TypeBusiness;
  revenu_mensuel: number;
  gerant_id?: string;
  niveau_suspicion: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ─── Heat ───────────────────────────────────────────────────────────────────
export interface HeatEvent {
  id: string;
  description: string;
  impact: number;
  created_at: string;
}

// ─── Territoires ────────────────────────────────────────────────────────────
export type StatutTerritoire = "stable" | "contesté" | "perdu";

export interface Territoire {
  id: string;
  nom: string;
  statut: StatutTerritoire;
  revenu_mensuel: number;
  faction_rivale?: string;
  image_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ─── Points de la Map ────────────────────────────────────────────────────────
export type TypeCle = "clé" | "code" | "badge" | "autre";

export interface PointMap {
  id: string;
  nom: string;
  description?: string;
  coordonnees?: string;
  type_cle: TypeCle;
  valeur_cle?: string;
  contenu?: string;
  image_url?: string;
  territoire_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ─── Plaques d'immatriculation ───────────────────────────────────────────────
export type TypeVehicule = "voiture" | "moto" | "camion" | "quad" | "autre";
export type StatutPlaque = "légale" | "volée" | "fausse" | "inconnue";

export interface Plaque {
  id: string;
  numero: string;
  marque?: string;
  modele?: string;
  couleur?: string;
  type_vehicule: TypeVehicule;
  statut: StatutPlaque;
  contact_id?: string;
  image_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ─── Logs ────────────────────────────────────────────────────────────────────
export interface Log {
  id: string;
  action: string;
  section: string;
  description: string;
  auteur_id?: string;
  auteur_pseudo?: string;
  meta: Record<string, unknown>;
  created_at: string;
}
