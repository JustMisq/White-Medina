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
import { Plus } from "lucide-react";
import type { CategorieTransaction, Membre } from "@/types";

const categories: CategorieTransaction[] = ["deal", "braquage", "amende", "achat", "salaire", "autre"];

interface AddTransactionDialogProps {
  membres: Membre[];
}

export function AddTransactionDialog({ membres }: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<"entree" | "sortie">("entree");
  const [typeArgent, setTypeArgent] = useState<"propre" | "sale">("propre");
  const [form, setForm] = useState({
    montant: "",
    categorie: "autre" as CategorieTransaction,
    description: "",
    membre_id: "",
  });
  const router = useRouter();
  const supabase = createClient();
  const membreMap = Object.fromEntries(membres.map(m => [m.id, m.pseudo]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const montant = parseFloat(form.montant);
    const { error } = await supabase.from("transactions").insert([{
      montant: type === "sortie" ? -Math.abs(montant) : Math.abs(montant),
      categorie: form.categorie,
      description: form.description,
      type_argent: typeArgent,
      membre_id: form.membre_id || null,
    }]);

    if (!error) {
      setOpen(false);
      setForm({ montant: "", categorie: "autre", description: "", membre_id: "" });
      setTypeArgent("propre");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Nouvelle transaction
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">

          {/* Propre / Sale toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setTypeArgent("propre")}
              className={`flex-1 py-2 text-sm font-medium transition-colors border-r border-border ${
                typeArgent === "propre"
                  ? "bg-sky-500/20 text-sky-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              💸 Propre
            </button>
            <button
              type="button"
              onClick={() => setTypeArgent("sale")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                typeArgent === "sale"
                  ? "bg-amber-500/20 text-amber-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              💰 Sale
            </button>
          </div>

          {/* Entrée / Sortie toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setType("entree")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                type === "entree"
                  ? "bg-green-500/20 text-green-400 border-r border-border"
                  : "text-muted-foreground hover:text-foreground border-r border-border"
              }`}
            >
              + Entrée
            </button>
            <button
              type="button"
              onClick={() => setType("sortie")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                type === "sortie"
                  ? "bg-red-500/20 text-red-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              − Sortie
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Montant ($)</Label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={form.montant}
                onChange={(e) => setForm({ ...form, montant: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select
                value={form.categorie}
                onValueChange={(v) => setForm({ ...form, categorie: v as CategorieTransaction })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              placeholder="Ex: Vente de stuff à GTA Online..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Membre lié <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
            <Select
              value={form.membre_id}
              onValueChange={(v) => setForm({ ...form, membre_id: v ?? "" })}
            >
              <SelectTrigger>
                <SelectValue>{(v: string) => v ? (membreMap[v] ?? v) : "Aucun"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {membres.map((m) => (
                  <SelectItem key={m.id} value={m.id} label={m.pseudo}>{m.pseudo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
