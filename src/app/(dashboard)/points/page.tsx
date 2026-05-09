import { createClient } from "@/lib/supabase/server";
import { getCanModifier } from "@/lib/supabase/permissions";
import type { PointMap, Territoire } from "@/types";
import { PointsMapClient } from "@/components/points/points-map-client";
import { Card, CardContent } from "@/components/ui/card";

export default async function PointsMapPage() {
  const supabase = await createClient();

  const [{ data: points }, { data: territoires }] = await Promise.all([
    supabase.from("points_map").select("*").order("created_at", { ascending: false }),
    supabase.from("territoires").select("id, nom").order("nom"),
  ]);

  const pointsData = (points as PointMap[] | null) ?? [];
  const territoiresData = (territoires as Pick<Territoire, "id" | "nom">[] | null) ?? [];
  const canModifier = await getCanModifier("points");

  const totalPoints = pointsData.length;
  const avecCle = pointsData.filter((p) => p.valeur_cle).length;
  const avecContenu = pointsData.filter((p) => p.contenu).length;
  const liesTerritoire = pointsData.filter((p) => p.territoire_id).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Points de la Map</h1>
        <p className="text-muted-foreground">Lieux sécurisés, caches et accès clé</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalPoints}</div>
            <p className="text-sm text-muted-foreground">Points enregistrés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-400">{avecCle}</div>
            <p className="text-sm text-muted-foreground">Avec clé / code</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-400">{avecContenu}</div>
            <p className="text-sm text-muted-foreground">Avec contenu listé</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-400">{liesTerritoire}</div>
            <p className="text-sm text-muted-foreground">Liés à un territoire</p>
          </CardContent>
        </Card>
      </div>

      <PointsMapClient points={pointsData} territoires={territoiresData} canModifier={canModifier} />
    </div>
  );
}
