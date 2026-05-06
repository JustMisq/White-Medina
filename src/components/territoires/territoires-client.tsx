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
import { Plus, Trash2, MapPin, ImagePlus } from "lucide-react";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import type { Territoire, StatutTerritoire } from "@/types";

const statutColors: Record<StatutTerritoire, string> = {
  stable: "bg-green-500/10 text-green-400 border-green-500/20",
  contesté: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  perdu: "bg-red-500/10 text-red-500 border-red-500/20",
};

const statutIcons: Record<StatutTerritoire, string> = {
  stable: "✅",
  contesté: "⚔️",
  perdu: "❌",
};

interface TerritoiresClientProps {
  territoires: Territoire[];
}

export function TerritoiresClient({ territoires: initialTerritoires }: TerritoiresClientProps) {
  const [territoires, setTerritoires] = useState(initialTerritoires);
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Territoire | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    nom: "",
    statut: "stable" as StatutTerritoire,
    revenu_mensuel: "",
    faction_rivale: "",
    notes: "",
  });
  const router = useRouter();
  const supabase = createClient();

  const openCreate = () => {
    setEditTarget(null);
    resetForm();
    setOpen(true);
  };

  const openEdit = (t: Territoire) => {
    setEditTarget(t);
    setForm({
      nom: t.nom,
      statut: t.statut,
      revenu_mensuel: t.revenu_mensuel ? String(t.revenu_mensuel) : "",
      faction_rivale: t.faction_rivale ?? "",
      notes: t.notes ?? "",
    });
    setImageFile(null);
    setImagePreview(t.image_url ?? null);
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

  const resetForm = () => {
    setForm({ nom: "", statut: "stable", revenu_mensuel: "", faction_rivale: "", notes: "" });
    setImageFile(null);
    setImagePreview(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);

    let image_url: string | null = editTarget?.image_url ?? null;

    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("territoires")
        .upload(path, imageFile, { upsert: false });
      if (!upErr) {
        const { data: pub } = supabase.storage.from("territoires").getPublicUrl(path);
        image_url = pub.publicUrl;
      }
    } else if (!imagePreview) {
      // user removed the image
      image_url = null;
    }

    const payload = {
      nom: form.nom,
      statut: form.statut,
      revenu_mensuel: parseFloat(form.revenu_mensuel) || 0,
      faction_rivale: form.faction_rivale || null,
      image_url,
      notes: form.notes || null,
    };

    if (editTarget) {
      const { data, error } = await supabase
        .from("territoires")
        .update(payload)
        .eq("id", editTarget.id)
        .select()
        .single();
      if (error) {
        setFormError(error.message);
      } else if (data) {
        setTerritoires(prev => prev.map(t => t.id === editTarget.id ? data as Territoire : t));
        setOpen(false);
        resetForm();
      }
    } else {
      const { data, error } = await supabase
        .from("territoires")
        .insert([payload])
        .select()
        .single();
      if (error) {
        setFormError(error.message);
      } else if (data) {
        setTerritoires(prev => [data as Territoire, ...prev]);
        setOpen(false);
        resetForm();
      }
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("territoires").delete().eq("id", id);
    setTerritoires(prev => prev.filter(t => t.id !== id));
    setConfirmingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un territoire
        </Button>
      </div>

      {territoires.length === 0 ? (
        <div className="text-center text-muted-foreground py-20">
          <MapPin className="mx-auto h-12 w-12 opacity-20 mb-3" />
          <p>Aucun territoire enregistré.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[64px]">Zone</TableHead>
                <TableHead>Territoire</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Faction rivale</TableHead>
                <TableHead className="text-right">Revenu mensuel</TableHead>
                <TableHead className="w-[110px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {territoires.map((t) => (
                <TableRow
                  key={t.id}
                  className="cursor-pointer"
                  onClick={(e) => {
                    // don't open edit when clicking confirm/delete buttons
                    if ((e.target as HTMLElement).closest("button")) return;
                    openEdit(t);
                  }}
                >
                  <TableCell>
                    {t.image_url ? (
                      <img
                        src={t.image_url}
                        alt={t.nom}
                        className="h-10 w-14 rounded object-cover border border-border cursor-zoom-in hover:opacity-80 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); setLightboxUrl(t.image_url!); }}
                      />
                    ) : (
                      <div className="h-10 w-14 rounded bg-muted flex items-center justify-center border border-border">
                        <MapPin className="h-4 w-4 text-muted-foreground/40" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{t.nom}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statutColors[t.statut]}>
                      {statutIcons[t.statut]} {t.statut.charAt(0).toUpperCase() + t.statut.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{t.faction_rivale ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <span className={t.statut === "perdu" ? "text-muted-foreground line-through" : "text-green-400 font-semibold"}>
                      +{new Intl.NumberFormat("fr-FR").format(t.revenu_mensuel)}$
                    </span>
                  </TableCell>
                  <TableCell>
                    {confirmingId === t.id ? (
                      <div className="flex gap-1">
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(t.id)}>Suppr.</Button>
                        <Button size="sm" variant="outline" onClick={() => setConfirmingId(null)}>✕</Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setConfirmingId(t.id)}
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

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setOpen(false); resetForm(); } else setOpen(true); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? `Modifier ${editTarget.nom}` : "Nouveau territoire"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                placeholder="Ex: East Side, Zone Industrielle, Vespucci..."
                value={form.nom}
                onChange={e => setForm({ ...form, nom: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={form.statut} onValueChange={(v) => setForm({ ...form, statut: v as StatutTerritoire })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stable">✅ Stable</SelectItem>
                    <SelectItem value="contesté">⚔️ Contesté</SelectItem>
                    <SelectItem value="perdu">❌ Perdu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Revenu mensuel ($) <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.revenu_mensuel}
                  onChange={e => setForm({ ...form, revenu_mensuel: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Faction rivale <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <Input
                placeholder="Ex: Los Santos Vagos, Ballas..."
                value={form.faction_rivale}
                onChange={e => setForm({ ...form, faction_rivale: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Infos sur ce territoire..."
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>

            {/* Image de la zone */}
            <div className="space-y-2">
              <Label>Image de la zone</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleImageFile(e.target.files[0])}
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
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
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
              <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Annuler</Button>
              <Button type="submit" disabled={loading}>{loading ? "Enregistrement..." : "Enregistrer"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ImageLightbox src={lightboxUrl} alt="carte territoire" onClose={() => setLightboxUrl(null)} />
    </div>
  );
}
