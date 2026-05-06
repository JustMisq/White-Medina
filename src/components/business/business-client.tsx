"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Trash2, Building2, Search } from "lucide-react";
import type { Business, Membre, TypeBusiness } from "@/types";

const typeLabels: Record<TypeBusiness, string> = {
  laverie: "🧺 Laverie",
  resto: "🍽️ Restaurant",
  garage: "🔧 Garage",
  bar: "🍺 Bar",
  salon: "💈 Salon",
  autre: "🏢 Autre",
};

const suspicionLabel = (n: number) =>
  n === 1 ? "Très bas" : n === 2 ? "Bas" : n === 3 ? "Modéré" : n === 4 ? "Élevé" : "Critique";

const suspicionColor = (n: number) =>
  n <= 2 ? "text-green-400" : n === 3 ? "text-yellow-400" : n === 4 ? "text-orange-400" : "text-red-500";

interface BusinessClientProps {
  business: Business[];
  membres: Membre[];
}

export function BusinessClient({ business: initialBusiness, membres }: BusinessClientProps) {
  const [business, setBusiness] = useState(initialBusiness);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Business | null>(null);
  const [form, setForm] = useState({
    nom: "",
    type_business: "autre" as TypeBusiness,
    revenu_mensuel: "",
    gerant_id: "",
    niveau_suspicion: "1",
    notes: "",
  });

  const defaultForm = { nom: "", type_business: "autre" as TypeBusiness, revenu_mensuel: "", gerant_id: "", niveau_suspicion: "1", notes: "" };

  const openCreate = () => {
    setEditTarget(null);
    setForm(defaultForm);
    setOpen(true);
  };

  const openEdit = (b: Business) => {
    setEditTarget(b);
    setForm({ nom: b.nom, type_business: b.type_business, revenu_mensuel: String(b.revenu_mensuel), gerant_id: b.gerant_id ?? "", niveau_suspicion: String(b.niveau_suspicion), notes: b.notes ?? "" });
    setOpen(true);
  };
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      nom: form.nom,
      type_business: form.type_business,
      revenu_mensuel: parseFloat(form.revenu_mensuel) || 0,
      gerant_id: form.gerant_id || null,
      niveau_suspicion: parseInt(form.niveau_suspicion),
      notes: form.notes || null,
    };
    if (editTarget) {
      const { data, error } = await supabase.from("business").update(payload).eq("id", editTarget.id).select().single();
      if (!error && data) {
        setBusiness(prev => prev.map(b => b.id === editTarget.id ? data as Business : b));
        setOpen(false);
      }
    } else {
      const { data, error } = await supabase.from("business").insert([payload]).select().single();
      if (!error && data) {
        setBusiness(prev => [data as Business, ...prev]);
        setOpen(false);
      }
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("business").delete().eq("id", id);
    setBusiness(prev => prev.filter(b => b.id !== id));
    setConfirmingId(null);
  };

  const membreMap = Object.fromEntries(membres.map(m => [m.id, m.pseudo]));

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<TypeBusiness | null>(null);
  const TYPES = Object.keys(typeLabels) as TypeBusiness[];

  const visible = business.filter((b) => {
    const q = search.toLowerCase();
    const matchSearch = q === "" || b.nom.toLowerCase().includes(q);
    const matchType = filterType === null || b.type_business === filterType;
    return matchSearch && matchType;
  });

  const totalRevenu = visible.reduce((sum, b) => sum + b.revenu_mensuel, 0);

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un business
        </Button>
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input placeholder="Rechercher..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Type filters */}
      <div className="flex flex-wrap gap-2">
        {TYPES.map((t) => {
          const active = filterType === t;
          return (
            <button
              key={t}
              onClick={() => setFilterType(active ? null : t)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                active
                  ? "bg-primary/20 text-primary border-primary/40"
                  : "text-muted-foreground border-border hover:border-muted-foreground"
              }`}
            >
              {typeLabels[t]}{active && " ✕"}
            </button>
          );
        })}
        {business.length > 0 && (
          <span className="self-center text-xs text-muted-foreground ml-auto">
            {visible.length} business{visible.length > 1 ? " · " : " · "}
            <span className="text-green-400 font-semibold">
              +{new Intl.NumberFormat("fr-FR").format(totalRevenu)}$/mois
            </span>
          </span>
        )}
      </div>

      {business.length === 0 ? (
        <div className="text-center text-muted-foreground py-20">
          <Building2 className="mx-auto h-12 w-12 opacity-20 mb-3" />
          <p>Aucun business enregistré.</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center text-muted-foreground py-10 text-sm">Aucun business ne correspond aux filtres.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((b) => (
            <Card
              key={b.id}
              className="cursor-pointer hover:border-border/80 transition-colors"
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("button")) return;
                openEdit(b);
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">{b.nom}</CardTitle>
                    <Badge variant="outline" className="mt-1 text-xs">{typeLabels[b.type_business]}</Badge>
                  </div>
                  {confirmingId === b.id ? (
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(b.id)}>Suppr.</Button>
                      <Button size="sm" variant="outline" onClick={() => setConfirmingId(null)}>✕</Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0 h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => setConfirmingId(b.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Revenu mensuel</span>
                  <span className="font-semibold text-green-400">
                    +{new Intl.NumberFormat("fr-FR").format(b.revenu_mensuel)}$
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Gérant</span>
                  <span>{b.gerant_id ? (membreMap[b.gerant_id] ?? "—") : "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Suspicion</span>
                  <span className={`font-semibold text-xs ${suspicionColor(b.niveau_suspicion)}`}>
                    {"●".repeat(b.niveau_suspicion)}{"○".repeat(5 - b.niveau_suspicion)}{" "}
                    {suspicionLabel(b.niveau_suspicion)}
                  </span>
                </div>
                {b.notes && (
                  <p className="text-xs text-muted-foreground border-t border-border pt-2 mt-1">{b.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setOpen(false); } else setOpen(true); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? `Modifier ${editTarget.nom}` : "Nouveau business"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                placeholder="Ex: Laverie du Coin, Garage Marcos..."
                value={form.nom}
                onChange={e => setForm({ ...form, nom: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type_business} onValueChange={(v) => setForm({ ...form, type_business: v as TypeBusiness })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="laverie">🧺 Laverie</SelectItem>
                    <SelectItem value="resto">🍽️ Restaurant</SelectItem>
                    <SelectItem value="garage">🔧 Garage</SelectItem>
                    <SelectItem value="bar">🍺 Bar</SelectItem>
                    <SelectItem value="salon">💈 Salon</SelectItem>
                    <SelectItem value="autre">🏢 Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Revenu mensuel ($)</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.revenu_mensuel}
                  onChange={e => setForm({ ...form, revenu_mensuel: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Gérant</Label>
                <Select value={form.gerant_id} onValueChange={(v) => setForm({ ...form, gerant_id: v ?? "" })}>
                  <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                  <SelectContent>
                    {membres.map(m => (
                      <SelectItem key={m.id} value={m.id} label={m.pseudo}>{m.pseudo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Suspicion (1-5)</Label>
                <Select value={form.niveau_suspicion} onValueChange={(v) => setForm({ ...form, niveau_suspicion: v ?? "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 — Très bas</SelectItem>
                    <SelectItem value="2">2 — Bas</SelectItem>
                    <SelectItem value="3">3 — Modéré</SelectItem>
                    <SelectItem value="4">4 — Élevé</SelectItem>
                    <SelectItem value="5">5 — Critique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Informations sur le business..."
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={loading}>{loading ? "Enregistrement..." : "Enregistrer"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
