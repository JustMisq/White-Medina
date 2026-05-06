import { createClient } from "@/lib/supabase/server";
import type { Territoire } from "@/types";
import { TerritoiresClient } from "@/components/territoires/territoires-client";
import { Card, CardContent } from "@/components/ui/card";

export default async function TerritoiresPage() {
  const supabase = await createClient();

  const { data: territoires } = await supabase
    .from("territoires")
    .select("*")
    .order("created_at", { ascending: false });

  const data = (territoires as Territoire[] | null) ?? [];

  const stable = data.filter(t => t.statut === "stable").length;
  const conteste = data.filter(t => t.statut === "contesté").length;
  const perdu = data.filter(t => t.statut === "perdu").length;
  const revenusActifs = data
    .filter(t => t.statut !== "perdu")
    .reduce((acc, t) => acc + t.revenu_mensuel, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Territoires</h1>
        <p className="text-muted-foreground">Zones contrôlées et sous tension</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-400">{stable}</div>
            <p className="text-sm text-muted-foreground">Stables</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-400">{conteste}</div>
            <p className="text-sm text-muted-foreground">Contestés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-400">{perdu}</div>
            <p className="text-sm text-muted-foreground">Perdus</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-400">
              +{new Intl.NumberFormat("fr-FR").format(revenusActifs)}$
            </div>
            <p className="text-sm text-muted-foreground">Revenus actifs</p>
          </CardContent>
        </Card>
      </div>

      <TerritoiresClient territoires={data} />
    </div>
  );
}
