import { Badge } from "@/components/ui/badge";
import type { Membre, Operation, StatutOperation } from "@/types";
import { createClient } from "@/lib/supabase/server";
import { AddOperationDialog } from "@/components/operations/add-operation-dialog";
import { OperationsClient } from "@/components/operations/operations-client";

const statutColors: Record<StatutOperation, string> = {
  prévu:    "bg-blue-500/10 text-blue-600 border-blue-500/20",
  en_cours: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  terminé:  "bg-green-500/10 text-green-600 border-green-500/20",
  annulé:   "bg-red-500/10 text-red-500 border-red-500/20",
};

const statutLabel: Record<StatutOperation, string> = {
  prévu:    "Prévu",
  en_cours: "En cours",
  terminé:  "Terminé",
  annulé:   "Annulé",
};

export default async function OperationsPage() {
  const supabase = await createClient();
  const [{ data: operations }, { data: membres }] = await Promise.all([
    supabase.from("operations").select("*").order("date_prevue", { ascending: true }),
    supabase.from("membres").select("id, pseudo").neq("rang", "Staff"),
  ]);

  const ops = (operations as Operation[] | null) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Opérations</h1>
          <p className="text-muted-foreground">
            {ops.length} opération{ops.length > 1 ? "s" : ""} enregistrée{ops.length > 1 ? "s" : ""}
          </p>
        </div>
        <AddOperationDialog membres={(membres as Membre[]) ?? []} />
      </div>

      {/* Filtres statut */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(statutColors) as StatutOperation[]).map((s) => {
          const count = ops.filter((o) => o.statut === s).length;
          return (
            <Badge key={s} variant="outline" className={statutColors[s]}>
              {statutLabel[s]} {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
            </Badge>
          );
        })}
      </div>

      <OperationsClient ops={ops} membres={(membres as Membre[]) ?? []} />
    </div>
  );
}
