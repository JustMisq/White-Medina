import type { Membre, Rang, StatutMembre } from "@/types";
import { createClient } from "@/lib/supabase/server";
import { AddMembreDialog } from "@/components/membres/add-membre-dialog";
import { EditMembreDialog } from "@/components/membres/edit-membre-dialog";

const RANG_ORDER: Rang[] = ["Gérant", "Bras Droit", "Grand", "Dealer", "Petite Frappe", "Nova"];

const rangStyle: Record<Rang, { bar: string; badge: string; label: string }> = {
  "Gérant":        { bar: "bg-red-600",    badge: "bg-red-600/10 text-red-500 border-red-600/20",       label: "Gérant" },
  "Bras Droit":    { bar: "bg-red-400",    badge: "bg-red-400/10 text-red-400 border-red-400/20",       label: "Bras Droit" },
  "Grand":         { bar: "bg-orange-500", badge: "bg-orange-500/10 text-orange-400 border-orange-500/20", label: "Grand" },
  "Dealer":        { bar: "bg-yellow-500", badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", label: "Dealer" },
  "Petite Frappe": { bar: "bg-blue-500",   badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",    label: "Petite Frappe" },
  "Nova":          { bar: "bg-zinc-500",   badge: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",    label: "Nova" },
  "Staff":         { bar: "bg-zinc-600",   badge: "bg-zinc-600/10 text-zinc-400 border-zinc-600/20",    label: "Staff" },
};

const statutStyle: Record<StatutMembre, string> = {
  actif:     "bg-green-500/10 text-green-500 border-green-500/20",
  inactif:   "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  suspendu:  "bg-red-500/10 text-red-400 border-red-500/20",
};

export default async function MembresPage() {
  const supabase = await createClient();

  // Fetch membres + current user permissions
  const [{ data: membres }, { data: { user } }] = await Promise.all([
    supabase.from("membres").select("*").neq("rang", "Staff").order("rang").order("pseudo"),
    supabase.auth.getUser(),
  ]);

  let canModifier = false;
  if (user) {
    const { data: moi } = await supabase
      .from("membres")
      .select("rang")
      .eq("user_id", user.id)
      .single();

    if (moi?.rang === "Gérant") {
      canModifier = true;
    } else if (moi?.rang) {
      const { data: perm } = await supabase
        .from("permissions_rang")
        .select("peut_modifier")
        .eq("rang", moi.rang)
        .eq("section", "membres")
        .single();
      canModifier = perm?.peut_modifier ?? false;
    }
  }

  const list = (membres ?? []) as Membre[];

  // Stats
  const total = list.length;
  const actifs = list.filter((m) => m.statut === "actif").length;
  const inactifs = list.filter((m) => m.statut === "inactif").length;
  const suspendus = list.filter((m) => m.statut === "suspendu").length;

  // Group by rang (in order)
  const grouped = RANG_ORDER.map((r) => ({
    rang: r,
    membres: list.filter((m) => m.rang === r),
  })).filter((g) => g.membres.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Membres</h1>
          <p className="text-muted-foreground">
            {total} membre{total > 1 ? "s" : ""} enregistré{total > 1 ? "s" : ""}
          </p>
        </div>
        {canModifier && <AddMembreDialog />}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Actifs</p>
          <p className="text-2xl font-bold text-green-500">{actifs}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Inactifs</p>
          <p className="text-2xl font-bold text-zinc-400">{inactifs}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Suspendus</p>
          <p className="text-2xl font-bold text-red-400">{suspendus}</p>
        </div>
      </div>

      {/* Grouped by rang */}
      {grouped.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-16 text-center text-muted-foreground text-sm">
          Aucun membre enregistré — {canModifier ? 'clique sur "Ajouter un membre"' : "contacte un Gérant"}
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ rang, membres: group }) => {
            const style = rangStyle[rang];
            return (
              <div key={rang} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Rang header */}
                <div className={`h-0.5 w-full ${style.bar}`} />
                <div className="px-4 py-2.5 flex items-center gap-2 border-b border-border bg-muted/30">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${style.badge}`}>
                    {rang}
                  </span>
                  <span className="text-xs text-muted-foreground">{group.length} membre{group.length > 1 ? "s" : ""}</span>
                </div>

                {/* Members list */}
                <div className="divide-y divide-border/50">
                  {group.map((m) => (
                    <div key={m.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors">
                      {/* Avatar initiale */}
                      <div className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${style.bar} text-white`}>
                        {m.pseudo.charAt(0).toUpperCase()}
                      </div>

                      {/* Pseudo + date */}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{m.pseudo}</p>
                        <p className="text-xs text-muted-foreground">
                          Recruté le {new Date(m.date_recrutement).toLocaleDateString("fr-FR")}
                        </p>
                      </div>

                      {/* Points */}
                      <div className="text-right shrink-0">
                        <p className="text-sm font-mono font-semibold">{m.points}</p>
                        <p className="text-[10px] text-muted-foreground">pts</p>
                      </div>

                      {/* Statut */}
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium border ${statutStyle[m.statut]}`}>
                        {m.statut}
                      </span>

                      {/* Actions */}
                      {canModifier && <EditMembreDialog membre={m} />}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
