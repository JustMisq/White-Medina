import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingDown, TrendingUp, Banknote, Skull } from "lucide-react";
import type { CategorieTransaction, Membre, Transaction } from "@/types";
import { createClient } from "@/lib/supabase/server";
import { AddTransactionDialog } from "@/components/tresorerie/add-transaction-dialog";

const categorieColors: Record<CategorieTransaction, string> = {
  deal:     "bg-green-500/10 text-green-600 border-green-500/20",
  braquage: "bg-red-500/10 text-red-500 border-red-500/20",
  amende:   "bg-orange-500/10 text-orange-600 border-orange-500/20",
  achat:    "bg-blue-500/10 text-blue-600 border-blue-500/20",
  salaire:  "bg-purple-500/10 text-purple-600 border-purple-500/20",
  autre:    "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

function formatMontant(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.abs(n)) + "$";
}

export default async function TresorerePage() {
  const supabase = await createClient();

  const now = new Date();
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [{ data: transactions }, { data: membres }, { data: soldePropre }, { data: soldeSale }] = await Promise.all([
    supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.from("membres").select("id, pseudo"),
    supabase.from("solde_propre").select("solde").single(),
    supabase.from("solde_sale").select("solde").single(),
  ]);

  const solde = ((soldePropre as { solde: number } | null)?.solde ?? 0) + ((soldeSale as { solde: number } | null)?.solde ?? 0);
  const soldePropVal = (soldePropre as { solde: number } | null)?.solde ?? 0;
  const soldeSaleVal = (soldeSale as { solde: number } | null)?.solde ?? 0;
  const txs = (transactions as Transaction[] | null) ?? [];
  const membresMap = new Map((membres as Pick<Membre, "id" | "pseudo">[] | null)?.map((m) => [m.id, m.pseudo]) ?? []);

  const entreesMois = txs
    .filter((t) => t.montant > 0 && t.created_at >= debutMois)
    .reduce((acc, t) => acc + t.montant, 0);
  const sortiesMois = txs
    .filter((t) => t.montant < 0 && t.created_at >= debutMois)
    .reduce((acc, t) => acc + t.montant, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trésorerie</h1>
          <p className="text-muted-foreground">Gestion des finances du gang</p>
        </div>
        <AddTransactionDialog membres={(membres as Membre[]) ?? []} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Banknote className="h-4 w-4 text-sky-400" />
              Caisse propre
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${soldePropVal >= 0 ? "text-sky-400" : "text-red-500"}`}>
              {soldePropVal >= 0 ? "+" : "-"}{formatMontant(soldePropVal)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Skull className="h-4 w-4 text-amber-400" />
              Caisse sale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${soldeSaleVal >= 0 ? "text-amber-400" : "text-red-500"}`}>
              {soldeSaleVal >= 0 ? "+" : "-"}{formatMontant(soldeSaleVal)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-green-500">
              <TrendingUp className="h-4 w-4" />
              Entrées ce mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {entreesMois > 0 ? `+${formatMontant(entreesMois)}` : "0$"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-red-500">
              <TrendingDown className="h-4 w-4" />
              Sorties ce mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {sortiesMois < 0 ? `-${formatMontant(sortiesMois)}` : "0$"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique des transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Membre</TableHead>
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {txs.length > 0 ? (
                txs.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {new Date(t.created_at).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell>{t.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={categorieColors[t.categorie]}>
                        {t.categorie}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={t.type_argent === "propre"
                          ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"}
                      >
                        {t.type_argent === "propre" ? "💸 propre" : "💰 sale"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {t.membre_id ? (membresMap.get(t.membre_id) ?? "—") : "—"}
                    </TableCell>
                    <TableCell className={`text-right font-mono font-semibold ${t.montant >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {t.montant >= 0 ? "+" : "-"}{formatMontant(t.montant)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    Aucune transaction enregistrée — clique sur &quot;Nouvelle transaction&quot;
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
