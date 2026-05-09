"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Users } from "lucide-react";
import type { Membre, Operation, StatutOperation } from "@/types";
import { EditOperationDialog } from "@/components/operations/edit-operation-dialog";

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

function formatMontant(n: number | null | undefined): string | null {
  if (n == null) return null;
  return new Intl.NumberFormat("fr-FR").format(n) + "$";
}

interface OperationsClientProps {
  ops: Operation[];
  membres: Membre[];
  canModifier?: boolean;
}

export function OperationsClient({ ops, membres, canModifier = true }: OperationsClientProps) {
  const [editingOp, setEditingOp] = useState<Operation | null>(null);

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ops.map((op) => (
          <Card
            key={op.id}
            className={`flex flex-col transition-colors ${canModifier ? "cursor-pointer hover:border-border/80" : ""}`}
            onClick={canModifier ? () => setEditingOp(op) : undefined}
          >
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
                  Butin estimé : {formatMontant(op.butin)}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {editingOp && canModifier && (
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
