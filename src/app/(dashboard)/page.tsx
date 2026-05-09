import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Wallet, Swords, BookUser, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Operation, StatutOperation, Transaction, HeatEvent } from "@/types";
import { HeatWidget } from "@/components/dashboard/heat-widget";

const statutColors: Record<StatutOperation, string> = {
  prévu:    "bg-blue-500/10 text-blue-600 border-blue-500/20",
  en_cours: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  terminé:  "bg-green-500/10 text-green-600 border-green-500/20",
  annulé:   "bg-red-500/10 text-red-500 border-red-500/20",
};

const statutLabel: Record<StatutOperation, string> = {
  prévu: "Prévu", en_cours: "En cours", terminé: "Terminé", annulé: "Annulé",
};

function formatMontant(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.abs(n)) + "$";
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { count: membresActifs },
    { data: soldeDirect },
    { count: opsActives },
    { count: contactsCount },
    { data: prochainesOps },
    { data: recentesTxs },
    { data: heatEventsRaw },
  ] = await Promise.all([
    supabase.from("membres").select("id", { count: "exact", head: true }).eq("statut", "actif").neq("rang", "Staff"),
    supabase.from("solde_tresorerie").select("solde").single(),
    supabase.from("operations").select("id", { count: "exact", head: true }).in("statut", ["prévu", "en_cours"]),
    supabase.from("contacts").select("id", { count: "exact", head: true }),
    supabase.from("operations").select("*").in("statut", ["prévu", "en_cours"]).order("date_prevue").limit(5),
    supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(5),
    supabase.from("heat_events").select("*").order("created_at", { ascending: false }).limit(20),
  ]);

  const solde = (soldeDirect as { solde: number } | null)?.solde ?? 0;
  const ops = (prochainesOps as Operation[] | null) ?? [];
  const txs = (recentesTxs as Transaction[] | null) ?? [];
  const heatEvents = (heatEventsRaw as HeatEvent[] | null) ?? [];
  const rawHeat = heatEvents.reduce((acc, ev) => acc + ev.impact, 0);
  const heatLevel = Math.max(0, Math.min(100, rawHeat));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Vue d&apos;ensemble de White Medina</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Membres actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{membresActifs ?? 0}</div>
            <p className="text-xs text-muted-foreground">dans le gang</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Trésorerie</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${solde < 0 ? "text-red-500" : ""}`}>
              {solde >= 0 ? "+" : "-"}{formatMontant(solde)}
            </div>
            <p className="text-xs text-muted-foreground">solde actuel</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Opérations</CardTitle>
            <Swords className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{opsActives ?? 0}</div>
            <p className="text-xs text-muted-foreground">en cours ou prévues</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Contacts</CardTitle>
            <BookUser className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contactsCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">dans la base intel</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <HeatWidget initialHeat={heatLevel} recentEvents={heatEvents} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prochaines opérations</CardTitle>
          </CardHeader>
          <CardContent>
            {ops.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune opération planifiée.</p>
            ) : (
              <div className="space-y-3">
                {ops.map((op) => (
                  <div key={op.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{op.titre}</p>
                      {op.date_prevue && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <CalendarDays className="h-3 w-3" />
                          {new Date(op.date_prevue).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className={`shrink-0 text-xs ${statutColors[op.statut]}`}>
                      {statutLabel[op.statut]}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            {txs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune activité récente.</p>
            ) : (
              <div className="space-y-3">
                {txs.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm truncate">{t.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <span className={`font-mono text-sm font-semibold shrink-0 ${t.montant >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {t.montant >= 0 ? "+" : "-"}{formatMontant(t.montant)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
