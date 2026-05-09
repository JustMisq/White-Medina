"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Pencil } from "lucide-react";
import type { Arme, Membre, EtatArme, ProvenanceArme } from "@/types";

const etatColors: Record<EtatArme, string> = {
  bon: "bg-green-500/10 text-green-400 border-green-500/20",
  usé: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  hors_service: "bg-red-500/10 text-red-500 border-red-500/20",
};

const etatLabels: Record<EtatArme, string> = {
  bon: "Bon état",
  usé: "Usé",
  hors_service: "Hors service",
};

interface ArmesClientProps {
  armes: Arme[];
  membres: Membre[];
  canModifier?: boolean;
}

export function ArmesClient({ armes: initialArmes, membres, canModifier = true }: ArmesClientProps) {
  const [armes, setArmes] = useState(initialArmes);
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Arme | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const defaultForm = { type_arme: "", modele: "", calibre: "", etat: "bon" as EtatArme, serie_efface: false, provenance: "acheté" as ProvenanceArme, membre_id: "", notes: "" };
  const [form, setForm] = useState(defaultForm);
  const router = useRouter();
  const supabase = createClient();

  const openCreate = () => {
    setEditTarget(null);
    setForm(defaultForm);
    setOpen(true);
  };

  const openEdit = (a: Arme) => {
    setEditTarget(a);
    setForm({
      type_arme: a.type_arme,
      modele: a.modele ?? "",
      calibre: a.calibre ?? "",
      etat: a.etat,
      serie_efface: a.serie_efface,
      provenance: a.provenance,
      membre_id: a.membre_id ?? "",
      notes: a.notes ?? "",
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (editTarget) {
      const { data, error } = await supabase
        .from("armes")
        .update({
          type_arme: form.type_arme,
          modele: form.modele || null,
          calibre: form.calibre || null,
          etat: form.etat,
          serie_efface: form.serie_efface,
          provenance: form.provenance,
          membre_id: form.membre_id || null,
          notes: form.notes || null,
        })
        .eq("id", editTarget.id)
        .select()
        .single();
      if (!error && data) {
        setArmes(prev => prev.map(a => a.id === editTarget.id ? data as Arme : a));
        setOpen(false);
        setEditTarget(null);
        setForm(defaultForm);
      }
    } else {
      const { data, error } = await supabase
        .from("armes")
        .insert([{
          type_arme: form.type_arme,
          modele: form.modele || null,
          calibre: form.calibre || null,
          etat: form.etat,
          serie_efface: form.serie_efface,
          provenance: form.provenance,
          membre_id: form.membre_id || null,
          notes: form.notes || null,
        }])
        .select()
        .single();
      if (!error && data) {
        setArmes(prev => [data as Arme, ...prev]);
        setOpen(false);
        setForm(defaultForm);
      }
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("armes").delete().eq("id", id);
    setArmes(prev => prev.filter(a => a.id !== id));
    setConfirmingId(null);
  };

  const membreMap = Object.fromEntries(membres.map(m => [m.id, m.pseudo]));

  return (
    <div className="space-y-4">
      {canModifier && (
        <div className="flex justify-end">
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Enregistrer une arme
          </Button>
        </div>
      )}

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Modèle</TableHead>
              <TableHead>Calibre</TableHead>
              <TableHead>État</TableHead>
              <TableHead>N° Série</TableHead>
              <TableHead>Provenance</TableHead>
              <TableHead>Assignée à</TableHead>
              <TableHead className="w-[110px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {armes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                  Armurerie vide.
                </TableCell>
              </TableRow>
            ) : armes.map((a) => (
              <TableRow key={a.id} className={canModifier ? "cursor-pointer" : undefined} onClick={canModifier ? (e) => { if ((e.target as HTMLElement).closest("button")) return; openEdit(a); } : undefined}>
                <TableCell className="font-medium">{a.type_arme}</TableCell>
                <TableCell className="text-muted-foreground">{a.modele ?? "—"}</TableCell>
                <TableCell>{a.calibre ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={etatColors[a.etat]}>
                    {etatLabels[a.etat]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={a.serie_efface
                    ? "bg-red-500/10 text-red-400 border-red-500/20"
                    : "text-muted-foreground border-border"}>
                    {a.serie_efface ? "Effacé" : "Intact"}
                  </Badge>
                </TableCell>
                <TableCell className="capitalize text-muted-foreground">{a.provenance}</TableCell>
                <TableCell className="text-muted-foreground">
                  {a.membre_id ? (membreMap[a.membre_id] ?? "Inconnu") : "—"}
                </TableCell>
                <TableCell>
                  {canModifier && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => openEdit(a)}
                      >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    {confirmingId === a.id ? (
                      <div className="flex gap-1">
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(a.id)}>Suppr.</Button>
                        <Button size="sm" variant="outline" onClick={() => setConfirmingId(null)}>✕</Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setConfirmingId(a.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setOpen(false); setEditTarget(null); setForm(defaultForm); } else setOpen(v); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? `Modifier ${editTarget.type_arme}` : "Enregistrer une arme"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Type d&apos;arme *</Label>
                <Input
                  placeholder="Pistolet, Fusil, SMG, Shotgun..."
                  value={form.type_arme}
                  onChange={e => setForm({ ...form, type_arme: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Modèle</Label>
                <Input
                  placeholder="Glock 17, AK-47..."
                  value={form.modele}
                  onChange={e => setForm({ ...form, modele: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Calibre</Label>
                <Input
                  placeholder="9mm, .308, 12G..."
                  value={form.calibre}
                  onChange={e => setForm({ ...form, calibre: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>État</Label>
                <Select value={form.etat} onValueChange={(v) => setForm({ ...form, etat: v as EtatArme })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bon">✅ Bon état</SelectItem>
                    <SelectItem value="usé">⚠️ Usé</SelectItem>
                    <SelectItem value="hors_service">❌ Hors service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Provenance</Label>
                <Select value={form.provenance} onValueChange={(v) => setForm({ ...form, provenance: v as ProvenanceArme })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="volé">🔓 Volé</SelectItem>
                    <SelectItem value="acheté">💵 Acheté</SelectItem>
                    <SelectItem value="récupéré">♻️ Récupéré</SelectItem>
                    <SelectItem value="autre">📦 Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assignée à</Label>
                <Select value={form.membre_id} onValueChange={(v) => setForm({ ...form, membre_id: v ?? "" })}>
                  <SelectTrigger><SelectValue>{(v: string) => v ? (membreMap[v] ?? v) : "Non assignée"}</SelectValue></SelectTrigger>
                  <SelectContent>
                    {membres.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.pseudo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="serie_efface"
                checked={form.serie_efface}
                onChange={e => setForm({ ...form, serie_efface: e.target.checked })}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="serie_efface" className="cursor-pointer font-normal">
                Numéro de série effacé
              </Label>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Informations supplémentaires..."
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
