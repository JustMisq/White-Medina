"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { UserPlus } from "lucide-react";
import type { Rang, StatutMembre } from "@/types";
import { createMembre } from "@/actions/membres";

const rangs: Rang[] = ["Gérant", "Bras Droit", "Grand", "Dealer", "Petite Frappe", "Nova"];
const statuts: StatutMembre[] = ["actif", "inactif", "suspendu"];

const defaultForm = {
  pseudo: "",
  email: "",
  password: "",
  rang: "Nova" as Rang,
  statut: "actif" as StatutMembre,
  points: 0,
  date_recrutement: new Date().toISOString().split("T")[0],
  notes: "",
};

export function AddMembreDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await createMembre(form);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setOpen(false);
    setForm(defaultForm);
    router.refresh();
    setLoading(false);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus className="mr-2 h-4 w-4" />
        Ajouter un membre
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau membre</DialogTitle>
            <DialogDescription>
              Crée un compte pour ce membre. Il pourra se connecter avec ces identifiants.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">

            {/* Identifiants du compte */}
            <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Compte</p>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="membre@exemple.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label>Mot de passe temporaire</Label>
                <Input
                  type="password"
                  placeholder="Min. 6 caractères"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Infos membre */}
            <div className="space-y-2">
              <Label>Pseudo in-game</Label>
              <Input
                placeholder="Ex: MikeGT"
                value={form.pseudo}
                onChange={(e) => setForm({ ...form, pseudo: e.target.value })}
                required
              />
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
                {loading ? "Création..." : "Créer le membre"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

