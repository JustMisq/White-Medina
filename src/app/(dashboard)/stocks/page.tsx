import { createClient } from "@/lib/supabase/server";
import { getCanModifier } from "@/lib/supabase/permissions";
import type { StockDrogue, Munition, StockMatos, ProduitCategorie, ProduitType } from "@/types";
import { StocksClient } from "@/components/stocks/stocks-client";
import { Card, CardContent } from "@/components/ui/card";

export default async function StocksPage() {
  const supabase = await createClient();

  const [{ data: stocks }, { data: munitions }, { data: matos }, { data: categories }, { data: types }] = await Promise.all([
    supabase.from("stocks_drogue").select("*, categorie:produit_categories!categorie_id(nom,icone,couleur), type:produit_types!type_id(nom)").order("produit"),
    supabase.from("munitions").select("*").order("calibre"),
    supabase.from("stocks_matos").select("*").order("categorie").order("nom"),
    supabase.from("produit_categories").select("*").order("nom"),
    supabase.from("produit_types").select("*").order("nom"),
  ]);

  const stocksData = (stocks as StockDrogue[] | null) ?? [];
  const munitionsData = (munitions as Munition[] | null) ?? [];
  const matosData = (matos as StockMatos[] | null) ?? [];
  const categoriesData = (categories as ProduitCategorie[] | null) ?? [];
  const typesData = (types as ProduitType[] | null) ?? [];

  const valeurTotale = stocksData.reduce((acc, s) => acc + s.quantite_g * (s.prix_revente_g ?? 0), 0);
  const totalMunitions = munitionsData.reduce((acc, m) => acc + m.quantite, 0);
  const totalMatos = matosData.reduce((acc, m) => acc + m.quantite, 0);
  const canModifier = await getCanModifier("stocks");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Stocks illégaux</h1>
        <p className="text-muted-foreground">Drogue, munitions &amp; matos</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-400">
              {new Intl.NumberFormat("fr-FR").format(valeurTotale)}$
            </div>
            <p className="text-sm text-muted-foreground">Valeur drogue (revente /u)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stocksData.length}</div>
            <p className="text-sm text-muted-foreground">Produits en stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalMunitions.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Munitions totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalMatos.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Pièces de matos</p>
          </CardContent>
        </Card>
      </div>

      <StocksClient stocks={stocksData} munitions={munitionsData} matos={matosData} categories={categoriesData} types={typesData} canModifier={canModifier} />
    </div>
  );
}
