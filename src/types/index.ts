export type Rang =
  | "Gérant"
  | "Bras Droit"
  | "Grand"
  | "Dealer"
  | "Petite Frappe"
  | "Nova"
  | "Staff";

export type StatutMembre = "actif" | "inactif" | "suspendu";

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
  nom_code?: string;
  telephone_ig?: string;
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
  telephone_ig?: string;
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
export type ProduitWeed = "og_kush" | "purple_haze" | "white_widow" | "blue_dream";
export type ProduitDrogue = ProduitWeed | "coke" | "meth" | "pills" | "autre";

export interface StockDrogue {
  id: string;
  produit: ProduitDrogue;
  quantite_g: number;
  prix_achat_g?: number;
  prix_revente_g?: number;
  prix_graine?: number;
  notes?: string;
  updated_at: string;
}

export interface VenteWeed {
  id: string;
  variete: ProduitWeed;
  quantite_g: number;
  prix_vente_g: number;
  vendeur_id?: string;
  notes?: string;
  created_at: string;
  membre?: { pseudo: string };
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

// ─── Permissions ────────────────────────────────────────────────────────────
export type Section =
  | "dashboard"
  | "membres"
  | "contacts"
  | "plaques"
  | "tresorerie"
  | "operations"
  | "armurerie"
  | "stocks"
  | "business"
  | "territoires"
  | "points";

export const ALL_SECTIONS: Section[] = [
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
];

export const RANGS_GERES: Rang[] = [
  "Bras Droit",
  "Grand",
  "Dealer",
  "Petite Frappe",
  "Nova",
];

export type PermissionsMap = Partial<Record<Section, { peut_voir: boolean; peut_modifier: boolean }>>;

// ─── Logs ───────────────────────────────────────────────────────────────────
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

// ─── Plaques ─────────────────────────────────────────────────────────────────
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

// ─── Points map ──────────────────────────────────────────────────────────────
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
