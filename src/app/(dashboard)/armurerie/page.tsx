import { createClient } from "@/lib/supabase/server";
import type { Arme, Membre } from "@/types";
import { ArmesClient } from "@/components/armurerie/armes-client";
import { Card, CardContent } from "@/components/ui/card";

export default async function ArmureriePage() {
  const supabase = await createClient();

  const [{ data: armes }, { data: membres }] = await Promise.all([
    supabase.from("armes").select("*").order("created_at", { ascending: false }),
    supabase.from("membres").select("id, pseudo").eq("statut", "actif").neq("rang", "Staff"),
  ]);

  const armesData = (armes as Arme[] | null) ?? [];
  const membresData = (membres as Membre[] | null) ?? [];

  const total = armesData.length;
  const bonEtat = armesData.filter(a => a.etat === "bon").length;
  const seriesEffacees = armesData.filter(a => a.serie_efface).length;
  const nonAssignees = armesData.filter(a => !a.membre_id).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Armurerie</h1>
        <p className="text-muted-foreground">Inventaire des armes du gang</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-sm text-muted-foreground">Total armes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-400">{bonEtat}</div>
            <p className="text-sm text-muted-foreground">En bon état</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-400">{seriesEffacees}</div>
            <p className="text-sm text-muted-foreground">Séries effacées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-muted-foreground">{nonAssignees}</div>
            <p className="text-sm text-muted-foreground">Non assignées</p>
          </CardContent>
        </Card>
      </div>

      <ArmesClient armes={armesData} membres={membresData} />
    </div>
  );
}
