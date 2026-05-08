"use client";

import { useState, useRef } from "react";
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
import { Plus, Trash2, Car, ImagePlus, LayoutList, LayoutGrid } from "lucide-react";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import type { Plaque, TypeVehicule, StatutPlaque, Contact } from "@/types";

const statutColors: Record<StatutPlaque, string> = {
  "légale":   "bg-green-500/10 text-green-400 border-green-500/20",
  "volée":    "bg-red-500/10 text-red-400 border-red-500/20",
  "fausse":   "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "inconnue": "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const typeVehiculeIcons: Record<TypeVehicule, string> = {
  "voiture": "🚗",
  "moto":    "🏍️",
  "camion":  "🚚",
  "quad":    "🛻",
  "autre":   "🚘",
};

interface PlaquesClientProps {
  plaques: Plaque[];
  contacts: Pick<Contact, "id" | "pseudo">[];
}

const defaultForm = {
  numero: "",
  marque: "",
  modele: "",
  couleur: "",
  type_vehicule: "voiture" as TypeVehicule,
  statut: "légale" as StatutPlaque,
  contact_id: "",
  notes: "",
};

export function PlaquesClient({ plaques: initialPlaques, contacts }: PlaquesClientProps) {
  const [plaques, setPlaques] = useState(initialPlaques);
  const [filterStatut, setFilterStatut] = useState<StatutPlaque | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Plaque | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(defaultForm);
  const router = useRouter();
  const supabase = createClient();

  const resetForm = () => {
    setForm(defaultForm);
    setImageFile(null);
    setImagePreview(null);
    setFormError(null);
  };

  const openCreate = () => {
    setEditTarget(null);
    resetForm();
    setOpen(true);
  };

  const openEdit = (p: Plaque) => {
    setEditTarget(p);
    setForm({
      numero: p.numero,
      marque: p.marque ?? "",
      modele: p.modele ?? "",
      couleur: p.couleur ?? "",
      type_vehicule: p.type_vehicule,
      statut: p.statut,
      contact_id: p.contact_id ?? "",
      notes: p.notes ?? "",
    });
    setImageFile(null);
    setImagePreview(p.image_url ?? null);
    setFormError(null);
    setOpen(true);
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.numero.trim()) { setFormError("Le numéro de plaque est requis."); return; }
    setLoading(true);
    setFormError(null);

    let image_url: string | null = editTarget?.image_url ?? null;

    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("plaques")
        .upload(path, imageFile, { upsert: false });
      if (!upErr) {
        const { data: pub } = supabase.storage.from("plaques").getPublicUrl(path);
        image_url = pub.publicUrl;
      }
    } else if (!imagePreview) {
      image_url = null;
    }

    const payload = {
      numero: form.numero.trim().toUpperCase(),
      marque: form.marque.trim() || null,
      modele: form.modele.trim() || null,
      couleur: form.couleur.trim() || null,
      type_vehicule: form.type_vehicule,
      statut: form.statut,
      contact_id: form.contact_id || null,
      image_url,
      notes: form.notes.trim() || null,
    };

    if (editTarget) {
      const { data, error } = await supabase
        .from("plaques")
        .update(payload)
        .eq("id", editTarget.id)
        .select()
        .single();
      if (error) { setFormError(error.message); setLoading(false); return; }
      setPlaques((prev) => prev.map((p) => (p.id === editTarget.id ? (data as Plaque) : p)));
    } else {
      const { data, error } = await supabase
        .from("plaques")
        .insert(payload)
        .select()
        .single();
      if (error) { setFormError(error.message); setLoading(false); return; }
      setPlaques((prev) => [data as Plaque, ...prev]);
    }

    setLoading(false);
    setOpen(false);
    resetForm();
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (confirmingId !== id) { setConfirmingId(id); return; }
    await supabase.from("plaques").delete().eq("id", id);
    setPlaques((prev) => prev.filter((p) => p.id !== id));
    setConfirmingId(null);
    router.refresh();
  };

  const getContactPseudo = (id?: string) =>
    contacts.find((c) => c.id === id)?.pseudo ?? null;

  const STATUTS: StatutPlaque[] = ["légale", "volée", "fausse", "inconnue"];
  const statutFilterStyle: Record<StatutPlaque, { active: string; idle: string }> = {
    légale:   { active: "bg-green-500/20 text-green-400 border-green-500/40",  idle: "text-muted-foreground border-border hover:border-muted-foreground" },
    volée:    { active: "bg-red-500/20 text-red-400 border-red-500/40",        idle: "text-muted-foreground border-border hover:border-muted-foreground" },
    fausse:   { active: "bg-orange-500/20 text-orange-400 border-orange-500/40", idle: "text-muted-foreground border-border hover:border-muted-foreground" },
    inconnue: { active: "bg-zinc-500/20 text-zinc-400 border-zinc-500/40",     idle: "text-muted-foreground border-border hover:border-muted-foreground" },
  };

  const visible = filterStatut ? plaques.filter((p) => p.statut === filterStatut) : plaques;

  return (
    <div className="space-y-4">
      {/* Top bar: add + filters + view toggle */}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une plaque
        </Button>

        {/* Statut filter pills */}
        <div className="flex flex-wrap gap-1.5 flex-1">
          {STATUTS.map((s) => {
            const active = filterStatut === s;
            return (
              <button
                key={s}
                onClick={() => setFilterStatut(active ? null : s)}
                className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-all ${
                  active ? statutFilterStyle[s].active : statutFilterStyle[s].idle
                }`}
              >
                {s}{active && " ✕"}
              </button>
            );
          })}
        </div>

        {/* View toggle */}
        <div className="flex rounded-md border border-border overflow-hidden shrink-0">
          <button
            onClick={() => setViewMode("table")}
            title="Vue liste"
            className={`px-3 py-2 transition-colors ${
              viewMode === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutList className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            title="Vue grille"
            className={`px-3 py-2 border-l border-border transition-colors ${
              viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Count */}
      {filterStatut && (
        <p className="text-xs text-muted-foreground">{visible.length} / {plaques.length} plaque{plaques.length > 1 ? "s" : ""} filtrées</p>
      )}

      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <Car className="h-10 w-10 opacity-30" />
          <p>{plaques.length === 0 ? "Aucune plaque enregistrée" : "Aucune plaque ne correspond au filtre"}</p>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid view */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {visible.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-border bg-card flex flex-col overflow-hidden cursor-pointer hover:shadow-sm transition-all"
              onClick={(e) => { if ((e.target as HTMLElement).closest("button")) return; openEdit(p); }}
            >
              {/* Photo or emoji placeholder */}
              {p.image_url ? (
                <img
                  src={p.image_url}
                  alt={p.numero}
                  className="w-full h-28 object-cover cursor-zoom-in hover:opacity-80 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); setLightboxUrl(p.image_url!); }}
                />
              ) : (
                <div className="w-full h-28 bg-muted flex items-center justify-center text-4xl">
                  {typeVehiculeIcons[p.type_vehicule]}
                </div>
              )}
              <div className="p-3 flex flex-col gap-2">
                <span className="font-mono font-bold tracking-widest text-sm">{p.numero}</span>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground truncate">
                    {[p.marque, p.modele].filter(Boolean).join(" ") || typeVehiculeIcons[p.type_vehicule]}
                    {p.couleur && ` · ${p.couleur}`}
                  </span>
                  <Badge variant="outline" className={`shrink-0 text-[10px] ${statutColors[p.statut]}`}>
                    {p.statut.charAt(0).toUpperCase() + p.statut.slice(1)}
                  </Badge>
                </div>
                {p.contact_id && (
                  <p className="text-xs text-muted-foreground">👤 {getContactPseudo(p.contact_id)}</p>
                )}
                <div className="flex gap-1 pt-1 border-t border-border/50">
                  {confirmingId === p.id ? (
                    <>
                      <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}>Suppr.</Button>
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setConfirmingId(null); }}>✕</Button>
                    </>
                  ) : (
                    <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table view */
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[64px]">Photo</TableHead>
                <TableHead>Plaque</TableHead>
                <TableHead>Véhicule</TableHead>
                <TableHead>Couleur</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Contact lié</TableHead>
                <TableHead className="w-[110px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("button")) return;
                    openEdit(p);
                  }}
                >
                  <TableCell>
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.numero}
                        className="h-10 w-14 rounded object-cover border border-border cursor-zoom-in hover:opacity-80 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); setLightboxUrl(p.image_url!); }}
                      />
                    ) : (
                      <div className="h-10 w-14 rounded bg-muted flex items-center justify-center border border-border">
                        <Car className="h-4 w-4 text-muted-foreground/40" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono font-bold tracking-widest text-sm">{p.numero}</span>
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="mr-1">{typeVehiculeIcons[p.type_vehicule]}</span>
                    {[p.marque, p.modele].filter(Boolean).join(" ") || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.couleur ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statutColors[p.statut]}>
                      {p.statut.charAt(0).toUpperCase() + p.statut.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.contact_id ? getContactPseudo(p.contact_id) ?? "—" : "—"}
                  </TableCell>
                  <TableCell>
                    {confirmingId === p.id ? (
                      <div className="flex gap-1">
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(p.id)}>Suppr.</Button>
                        <Button size="sm" variant="outline" onClick={() => setConfirmingId(null)}>✕</Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(p.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog créer / éditer */}
      <Dialog open={open} onOpenChange={(v) => { if (!v) { setOpen(false); resetForm(); } else setOpen(true); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Modifier la plaque" : "Nouvelle plaque"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid gap-4 py-2">
            {/* Numéro */}
            <div className="grid gap-1.5">
              <Label>Numéro de plaque *</Label>
              <Input
                placeholder="AB-123-CD"
                value={form.numero}
                onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))}
                className="font-mono tracking-widest uppercase"
                required
              />
            </div>

            {/* Type + Statut */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Type de véhicule</Label>
                <Select
                  value={form.type_vehicule}
                  onValueChange={(v) => setForm((f) => ({ ...f, type_vehicule: v as TypeVehicule }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="voiture">🚗 Voiture</SelectItem>
                    <SelectItem value="moto">🏍️ Moto</SelectItem>
                    <SelectItem value="camion">🚚 Camion</SelectItem>
                    <SelectItem value="quad">🛻 Quad / Pick-up</SelectItem>
                    <SelectItem value="autre">🚘 Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Statut</Label>
                <Select
                  value={form.statut}
                  onValueChange={(v) => setForm((f) => ({ ...f, statut: v as StatutPlaque }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="légale">✅ Légale</SelectItem>
                    <SelectItem value="volée">🔴 Volée</SelectItem>
                    <SelectItem value="fausse">🟠 Fausse</SelectItem>
                    <SelectItem value="inconnue">❓ Inconnue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Marque + Modèle */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Marque</Label>
                <Input
                  placeholder="BMW, Peugeot…"
                  value={form.marque}
                  onChange={(e) => setForm((f) => ({ ...f, marque: e.target.value }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Modèle</Label>
                <Input
                  placeholder="M3, 308…"
                  value={form.modele}
                  onChange={(e) => setForm((f) => ({ ...f, modele: e.target.value }))}
                />
              </div>
            </div>

            {/* Couleur */}
            <div className="grid gap-1.5">
              <Label>Couleur</Label>
              <Input
                placeholder="Noir, Blanc, Gris métallisé…"
                value={form.couleur}
                onChange={(e) => setForm((f) => ({ ...f, couleur: e.target.value }))}
              />
            </div>

            {/* Contact lié */}
            <div className="grid gap-1.5">
              <Label>Contact lié (optionnel)</Label>
              <Select
                value={form.contact_id || "_none"}
                onValueChange={(v) => setForm((f) => ({ ...f, contact_id: !v || v === "_none" ? "" : v }))}
              >
                <SelectTrigger><SelectValue>{(v: string) => !v || v === "_none" ? "Aucun contact" : (getContactPseudo(v) ?? v)}</SelectValue></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Aucun</SelectItem>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.pseudo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="grid gap-1.5">
              <Label>Notes</Label>
              <Textarea
                placeholder="Informations supplémentaires…"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
              />
            </div>

            {/* Image du véhicule */}
            <div className="grid gap-1.5">
              <Label>Photo du véhicule</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
              />
              {imagePreview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Aperçu"
                    className="w-full h-32 object-cover rounded-lg border border-border cursor-zoom-in hover:opacity-80 transition-opacity"
                    onClick={() => setLightboxUrl(imagePreview)}
                  />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs hover:bg-black/80"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div
                  className={`flex h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors ${
                    dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Glisse ou clique pour ajouter</p>
                </div>
              )}
            </div>

            {formError && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                {formError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Enregistrement…" : editTarget ? "Sauvegarder" : "Créer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ImageLightbox src={lightboxUrl} alt="photo du véhicule" onClose={() => setLightboxUrl(null)} />
    </div>
  );
}
