import { createClient } from "@/lib/supabase/server";
import { getCanModifier } from "@/lib/supabase/permissions";
import type { Business, Membre } from "@/types";
import { BusinessClient } from "@/components/business/business-client";
import { Card, CardContent } from "@/components/ui/card";

export default async function BusinessPage() {
  const supabase = await createClient();

  const [{ data: business }, { data: membres }] = await Promise.all([
    supabase.from("business").select("*").order("created_at", { ascending: false }),
    supabase.from("membres").select("id, pseudo").eq("statut", "actif").neq("rang", "Staff"),
  ]);

  const businessData = (business as Business[] | null) ?? [];
  const membresData = (membres as Membre[] | null) ?? [];
  const canModifier = await getCanModifier("business");

  const revenusTotal = businessData.reduce((acc, b) => acc + b.revenu_mensuel, 0);
  const suspicionMoy = businessData.length > 0
    ? businessData.reduce((acc, b) => acc + b.niveau_suspicion, 0) / businessData.length
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Business</h1>
        <p className="text-muted-foreground">Façades légales et sources de revenus propres</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{businessData.length}</div>
            <p className="text-sm text-muted-foreground">Business actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-400">
              +{new Intl.NumberFormat("fr-FR").format(revenusTotal)}$
            </div>
            <p className="text-sm text-muted-foreground">Revenus mensuels</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className={`text-2xl font-bold ${suspicionMoy >= 4 ? "text-red-400" : suspicionMoy >= 3 ? "text-orange-400" : "text-green-400"}`}>
              {businessData.length > 0 ? suspicionMoy.toFixed(1) : "—"} / 5
            </div>
            <p className="text-sm text-muted-foreground">Suspicion moyenne</p>
          </CardContent>
        </Card>
      </div>

      <BusinessClient business={businessData} membres={membresData} canModifier={canModifier} />
    </div>
  );
}
