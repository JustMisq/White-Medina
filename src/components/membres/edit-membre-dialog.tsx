"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Pencil } from "lucide-react";
import type { Membre, Rang, StatutMembre } from "@/types";
import { updateMembre } from "@/actions/membres";

const rangs: Rang[] = ["Gérant", "Bras Droit", "Grand", "Dealer", "Petite Frappe", "Nova", "Staff"];
const statuts: StatutMembre[] = ["actif", "inactif", "suspendu"];

export function EditMembreDialog({ membre }: { membre: Membre }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    pseudo: membre.pseudo,
    nom_code: membre.nom_code ?? "",
    telephone_ig: membre.telephone_ig ?? "",
    rang: membre.rang,
    statut: membre.statut,
    points: membre.points,
    date_recrutement: membre.date_recrutement.split("T")[0],
    notes: membre.notes ?? "",
  });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await updateMembre({ id: membre.id, ...form });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setOpen(false);
    router.refresh();
    setLoading(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier {membre.pseudo}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">

            <div className="space-y-2">
              <Label>Pseudo in-game</Label>
              <Input
                value={form.pseudo}
                onChange={(e) => setForm({ ...form, pseudo: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom de code <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
                <Input
                  placeholder="Ex: Fantôme, Le Vieux..."
                  value={form.nom_code}
                  onChange={(e) => setForm({ ...form, nom_code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Téléphone IG <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
                <Input
                  placeholder="(xxx)xxxx"
                  value={form.telephone_ig}
                  onChange={(e) => setForm({ ...form, telephone_ig: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rang</Label>
                <Select value={form.rang} onValueChange={(v) => setForm({ ...form, rang: v as Rang })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {rangs.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={form.statut} onValueChange={(v) => setForm({ ...form, statut: v as StatutMembre })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statuts.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Points</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.points}
                  onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Date de recrutement</Label>
                <Input
                  type="date"
                  value={form.date_recrutement}
                  onChange={(e) => setForm({ ...form, date_recrutement: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <Textarea
                placeholder="Infos supplémentaires..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive border border-destructive/20">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setOpen(false); setError(null); }}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
