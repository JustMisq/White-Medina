import { createClient } from "@/lib/supabase/server";
import { getCanModifier } from "@/lib/supabase/permissions";
import type { Vente, ProduitCategorie, ProduitType, Membre, StockDrogue } from "@/types";
import { VentesClient } from "@/components/ventes/ventes-client";

export default async function VentesPage() {
  const supabase = await createClient();

  const [
    { data: ventes },
    { data: categories },
    { data: types },
    { data: membres },
    { data: stocks },
  ] = await Promise.all([
    supabase
      .from("ventes")
      .select(
        "*, categorie:produit_categories!categorie_id(nom,icone,couleur), type:produit_types!type_id(nom), vendeur:membres!vendeur_id(pseudo)"
      )
      .order("created_at", { ascending: false }),
    supabase.from("produit_categories").select("*").order("nom"),
    supabase.from("produit_types").select("*").order("nom"),
    supabase
      .from("membres")
      .select("id, pseudo")
      .eq("statut", "actif")
      .order("pseudo"),
    supabase
      .from("stocks_drogue")
      .select("*, categorie:produit_categories!categorie_id(nom,icone,couleur), type:produit_types!type_id(nom)")
      .order("produit"),
  ]);

  const ventesData = (ventes as Vente[] | null) ?? [];
  const categoriesData = (categories as ProduitCategorie[] | null) ?? [];
  const typesData = (types as ProduitType[] | null) ?? [];
  const membresData = (membres as Pick<Membre, "id" | "pseudo">[] | null) ?? [];
  const stocksData = (stocks as StockDrogue[] | null) ?? [];

  const canModifier = await getCanModifier("ventes");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ventes</h1>
        <p className="text-muted-foreground">
          Historique des ventes illégales — toutes catégories
        </p>
      </div>

      <VentesClient
        ventes={ventesData}
        categories={categoriesData}
        types={typesData}
        membres={membresData}
        stocks={stocksData}
        canModifier={canModifier}
      />
    </div>
  );
}
