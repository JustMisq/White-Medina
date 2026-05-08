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
import { Plus, Trash2, KeyRound, Eye, EyeOff, ImagePlus } from "lucide-react";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import type { PointMap, TypeCle, Territoire } from "@/types";

const typeCleColors: Record<TypeCle, string> = {
  "clé":    "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "code":   "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "badge":  "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "autre":  "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const typeCleIcons: Record<TypeCle, string> = {
  "clé":   "🔑",
  "code":  "🔢",
  "badge": "💳",
  "autre": "🔓",
};

interface PointsMapClientProps {
  points: PointMap[];
  territoires: Pick<Territoire, "id" | "nom">[];
}

const defaultForm = {
  nom: "",
  description: "",
  coordonnees: "",
  type_cle: "clé" as TypeCle,
  valeur_cle: "",
  contenu: "",
  territoire_id: "",
  notes: "",
};

export function PointsMapClient({ points: initialPoints, territoires }: PointsMapClientProps) {
  const [points, setPoints] = useState(initialPoints);
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PointMap | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
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

  const openEdit = (p: PointMap) => {
    setEditTarget(p);
    setForm({
      nom: p.nom,
      description: p.description ?? "",
      coordonnees: p.coordonnees ?? "",
      type_cle: p.type_cle,
      valeur_cle: p.valeur_cle ?? "",
      contenu: p.contenu ?? "",
      territoire_id: p.territoire_id ?? "",
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

  const toggleReveal = (id: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom.trim()) { setFormError("Le nom est requis."); return; }
    setLoading(true);
    setFormError(null);

    let image_url: string | null = editTarget?.image_url ?? null;

    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("points-map")
        .upload(path, imageFile, { upsert: false });
      if (!upErr) {
        const { data: pub } = supabase.storage.from("points-map").getPublicUrl(path);
        image_url = pub.publicUrl;
      }
    } else if (!imagePreview) {
      image_url = null;
    }

    const payload = {
      nom: form.nom.trim(),
      description: form.description.trim() || null,
      coordonnees: form.coordonnees.trim() || null,
      type_cle: form.type_cle,
      valeur_cle: form.valeur_cle.trim() || null,
      contenu: form.contenu.trim() || null,
      image_url,
      territoire_id: form.territoire_id || null,
      notes: form.notes.trim() || null,
    };

    if (editTarget) {
      const { data, error } = await supabase
        .from("points_map")
        .update(payload)
        .eq("id", editTarget.id)
        .select()
        .single();
      if (error) { setFormError(error.message); setLoading(false); return; }
      setPoints((prev) => prev.map((p) => (p.id === editTarget.id ? (data as PointMap) : p)));
    } else {
      const { data, error } = await supabase
        .from("points_map")
        .insert(payload)
        .select()
        .single();
      if (error) { setFormError(error.message); setLoading(false); return; }
      setPoints((prev) => [data as PointMap, ...prev]);
    }

    setLoading(false);
    setOpen(false);
    resetForm();
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (confirmingId !== id) { setConfirmingId(id); return; }
    await supabase.from("points_map").delete().eq("id", id);
    setPoints((prev) => prev.filter((p) => p.id !== id));
    setConfirmingId(null);
    router.refresh();
  };

  const getTerritoireNom = (id?: string) =>
    territoires.find((t) => t.id === id)?.nom ?? null;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un point
        </Button>
      </div>

      {points.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <KeyRound className="h-10 w-10 opacity-30" />
          <p>Aucun point enregistré</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[64px]">Photo</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Coordonnées</TableHead>
                <TableHead>Accès</TableHead>
                <TableHead>Clé / Code</TableHead>
                <TableHead>Territoire</TableHead>
                <TableHead>Contenu</TableHead>
                <TableHead className="w-[110px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {points.map((p) => (
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
                        alt={p.nom}
                        className="h-10 w-14 rounded object-cover border border-border cursor-zoom-in hover:opacity-80 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); setLightboxUrl(p.image_url!); }}
                      />
                    ) : (
                      <div className="h-10 w-14 rounded bg-muted flex items-center justify-center border border-border">
                        <KeyRound className="h-4 w-4 text-muted-foreground/40" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{p.nom}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{p.coordonnees ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={typeCleColors[p.type_cle]}>
                      {typeCleIcons[p.type_cle]} {p.type_cle}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {p.valeur_cle ? (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          {revealedKeys.has(p.id) ? p.valeur_cle : "••••••"}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => toggleReveal(p.id)}
                        >
                          {revealedKeys.has(p.id)
                            ? <EyeOff className="h-3 w-3" />
                            : <Eye className="h-3 w-3" />}
                        </Button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.territoire_id ? getTerritoireNom(p.territoire_id) ?? "—" : "—"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {p.contenu ?? "—"}
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
              {editTarget ? "Modifier le point" : "Nouveau point de la map"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid gap-4 py-2">
            {/* Nom */}
            <div className="grid gap-1.5">
              <Label>Nom *</Label>
              <Input
                placeholder="Entrepôt Nord, Cache Fleeka…"
                value={form.nom}
                onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                required
              />
            </div>

            {/* Description */}
            <div className="grid gap-1.5">
              <Label>Description</Label>
              <Input
                placeholder="Brève description du lieu"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            {/* Coordonnées */}
            <div className="grid gap-1.5">
              <Label>Coordonnées / Référence map</Label>
              <Input
                placeholder="X: 1234 / Y: 5678 ou nom de zone"
                value={form.coordonnees}
                onChange={(e) => setForm((f) => ({ ...f, coordonnees: e.target.value }))}
              />
            </div>

            {/* Type d'accès + Valeur */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Type d&apos;accès</Label>
                <Select
                  value={form.type_cle}
                  onValueChange={(v) => setForm((f) => ({ ...f, type_cle: v as TypeCle }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clé">🔑 Clé</SelectItem>
                    <SelectItem value="code">🔢 Code</SelectItem>
                    <SelectItem value="badge">💳 Badge</SelectItem>
                    <SelectItem value="autre">🔓 Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Valeur (clé / code…)</Label>
                <Input
                  placeholder="Ex: 4521 ou Clé n°3"
                  value={form.valeur_cle}
                  onChange={(e) => setForm((f) => ({ ...f, valeur_cle: e.target.value }))}
                />
              </div>
            </div>

            {/* Territoire lié */}
            <div className="grid gap-1.5">
              <Label>Territoire lié (optionnel)</Label>
              <Select
                value={form.territoire_id || "_none"}
                onValueChange={(v) => setForm((f) => ({ ...f, territoire_id: !v || v === "_none" ? "" : v }))}
              >
                <SelectTrigger>
                  <SelectValue>{(v: string) => !v || v === "_none" ? "Aucun territoire" : (getTerritoireNom(v) ?? v)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Aucun</SelectItem>
                  {territoires.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contenu stocké */}
            <div className="grid gap-1.5">
              <Label>Contenu / Matos accessible</Label>
              <Textarea
                placeholder="Ex: 2× AK-47, 500 balles 7.62, coffre de liquidités…"
                value={form.contenu}
                onChange={(e) => setForm((f) => ({ ...f, contenu: e.target.value }))}
                rows={3}
              />
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

            {/* Image du lieu */}
            <div className="grid gap-1.5">
              <Label>Photo du lieu</Label>
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

      <ImageLightbox src={lightboxUrl} alt="photo du point" onClose={() => setLightboxUrl(null)} />
    </div>
  );
}
