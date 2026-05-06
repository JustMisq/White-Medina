"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Users, Search } from "lucide-react";
import type { Membre, Operation, StatutOperation } from "@/types";
import { EditOperationDialog } from "@/components/operations/edit-operation-dialog";

const statutColors: Record<StatutOperation, string> = {
  prévu:    "bg-blue-500/10 text-blue-400 border-blue-500/20",
  en_cours: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  terminé:  "bg-green-500/10 text-green-400 border-green-500/20",
  annulé:   "bg-red-500/10 text-red-400 border-red-500/20",
};

const statutBar: Record<StatutOperation, string> = {
  prévu:    "bg-blue-500",
  en_cours: "bg-yellow-500",
  terminé:  "bg-green-500",
  annulé:   "bg-red-500",
};

const statutLabel: Record<StatutOperation, string> = {
  prévu:    "Prévu",
  en_cours: "En cours",
  terminé:  "Terminé",
  annulé:   "Annulé",
};

const STATUTS: StatutOperation[] = ["prévu", "en_cours", "terminé", "annulé"];

function formatMontant(n: number | null | undefined): string | null {
  if (n == null) return null;
  return new Intl.NumberFormat("fr-FR").format(n) + "$";
}

interface OperationsClientProps {
  ops: Operation[];
  membres: Membre[];
}

export function OperationsClient({ ops, membres }: OperationsClientProps) {
  const [editingOp, setEditingOp] = useState<Operation | null>(null);
  const [filterStatut, setFilterStatut] = useState<StatutOperation | null>(null);
  const [search, setSearch] = useState("");

  const visible = ops.filter((op) => {
    const matchStatut = filterStatut === null || op.statut === filterStatut;
    const q = search.toLowerCase();
    const matchSearch = q === "" || op.titre.toLowerCase().includes(q) || (op.description ?? "").toLowerCase().includes(q);
    return matchStatut && matchSearch;
  });

  if (ops.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex h-40 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Aucune opération planifiée — clique sur &quot;Nouvelle opération&quot;
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Filters */}
      <div className="space-y-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Rechercher une opération…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUTS.map((s) => {
            const active = filterStatut === s;
            return (
              <button
                key={s}
                onClick={() => setFilterStatut(active ? null : s)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  active ? statutColors[s] : "text-muted-foreground border-border hover:border-muted-foreground"
                }`}
              >
                {statutLabel[s]}{active && " ✕"}
              </button>
            );
          })}
          {(filterStatut || search) && (
            <span className="self-center text-xs text-muted-foreground">{visible.length} / {ops.length} opération{ops.length > 1 ? "s" : ""}</span>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground py-10 text-sm">Aucune opération ne correspond aux filtres.</div>
        ) : visible.map((op) => (
          <Card
            key={op.id}
            className="flex flex-col cursor-pointer hover:shadow-sm transition-all overflow-hidden"
            onClick={() => setEditingOp(op)}
          >
            <div className={`h-0.5 w-full ${statutBar[op.statut]}`} />
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base leading-snug">{op.titre}</CardTitle>
                <Badge variant="outline" className={`shrink-0 ${statutColors[op.statut]}`}>
                  {statutLabel[op.statut]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 flex-1">
              {op.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{op.description}</p>
              )}
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                {op.date_prevue && (
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {new Date(op.date_prevue).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                )}
                {op.participants && op.participants.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    {op.participants.length} participant{op.participants.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {formatMontant(op.butin) && (
                <p className="text-sm font-medium text-green-500">
                  Butin estimé : {formatMontant(op.butin)}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {editingOp && (
        <EditOperationDialog
          operation={editingOp}
          membres={membres}
          open={editingOp !== null}
          onOpenChange={(v) => { if (!v) setEditingOp(null); }}
        />
      )}
    </>
  );
}
