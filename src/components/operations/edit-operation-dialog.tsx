"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Membre, Operation, StatutOperation } from "@/types";

const statuts: StatutOperation[] = ["prévu", "en_cours", "terminé", "annulé"];

interface EditOperationDialogProps {
  operation: Operation;
  membres: Membre[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditOperationDialog({ operation, membres, open, onOpenChange }: EditOperationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedMembres, setSelectedMembres] = useState<string[]>(operation.participants ?? []);
  const [form, setForm] = useState({
    titre: operation.titre,
    description: operation.description ?? "",
    statut: operation.statut,
    date_prevue: operation.date_prevue ? operation.date_prevue.slice(0, 16) : "",
    butin: operation.butin != null ? String(operation.butin) : "",
    notes: operation.notes ?? "",
  });
  const router = useRouter();
  const supabase = createClient();

  const toggleMembre = (id: string) => {
    setSelectedMembres((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleOpenChange = (v: boolean) => {
    onOpenChange(v);
    if (!v) {
      // Reset to current operation values
      setForm({
        titre: operation.titre,
        description: operation.description ?? "",
        statut: operation.statut,
        date_prevue: operation.date_prevue ? operation.date_prevue.slice(0, 16) : "",
        butin: operation.butin != null ? String(operation.butin) : "",
        notes: operation.notes ?? "",
      });
      setSelectedMembres(operation.participants ?? []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("operations")
      .update({
        titre: form.titre,
        description: form.description || null,
        statut: form.statut,
        date_prevue: form.date_prevue || null,
        butin: form.butin ? parseInt(form.butin) : null,
        participants: selectedMembres,
        notes: form.notes || null,
      })
      .eq("id", operation.id);

    if (!error) {
      onOpenChange(false);
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier {operation.titre}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Titre</Label>
            <Input
              placeholder="Ex: Braquage Fleeca, Run de stuff..."
              value={form.titre}
              onChange={(e) => setForm({ ...form, titre: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select
                value={form.statut}
                onValueChange={(v) => setForm({ ...form, statut: v as StatutOperation })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuts.map((s) => (
                    <SelectItem key={s} value={s} label={s.replace("_", " ")}>
                      {s.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date prévue <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <Input
                type="datetime-local"
                value={form.date_prevue}
                onChange={(e) => setForm({ ...form, date_prevue: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
            <Textarea
              placeholder="Plan, objectifs, infos importantes..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Participants</Label>
            <div className="flex flex-wrap gap-2 rounded-md border border-border p-2 min-h-[44px]">
              {membres.map((m) => {
                const selected = selectedMembres.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMembre(m.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium border transition-all ${
                      selected
                        ? "bg-primary/20 text-primary border-primary/30"
                        : "text-muted-foreground border-border hover:border-muted-foreground"
                    }`}
                  >
                    {m.pseudo}
                  </button>
                );
              })}
              {membres.length === 0 && (
                <span className="text-xs text-muted-foreground p-1">Aucun membre enregistré</span>
              )}
            </div>
            {selectedMembres.length > 0 && (
              <p className="text-xs text-muted-foreground">{selectedMembres.length} participant(s) sélectionné(s)</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Butin estimé ($) <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={form.butin}
              onChange={(e) => setForm({ ...form, butin: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
