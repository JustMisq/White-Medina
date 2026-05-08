"use client";

import { useState, useRef, useCallback } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, X, ImagePlus, Loader2 } from "lucide-react";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import type { Tag } from "@/types";

interface AddContactDialogProps {
  tags: Tag[];
}

export function AddContactDialog({ tags }: AddContactDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [champsValues, setChampsValues] = useState<Record<string, Record<string, string>>>({});
  const [form, setForm] = useState({
    pseudo: "",
    faction: "",
    telephone_ig: "",
    fiabilite: 3,
    notes: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const toggleTag = (nom: string) => {
    setSelectedTags((prev) =>
      prev.includes(nom) ? prev.filter((t) => t !== nom) : [...prev, nom]
    );
  };

  const addFiles = useCallback((files: FileList | File[]) => {
    const accepted = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setImages((prev) => [...prev, ...accepted]);
    accepted.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = "";
  };

  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of images) {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from("identites")
        .upload(path, file, { upsert: false });
      if (!error) {
        const { data } = supabase.storage.from("identites").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
    }
    return urls;
  };

  const resetForm = () => {
    setForm({ pseudo: "", faction: "", telephone_ig: "", fiabilite: 3, notes: "" });
    setSelectedTags([]);
    setImages([]);
    setPreviews([]);
    setChampsValues({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const imageUrls = images.length > 0 ? await uploadImages() : [];

    const { error } = await supabase.from("contacts").insert([
      { ...form, tags: selectedTags, images: imageUrls, champs_custom: champsValues },
    ]);

    if (!error) {
      setOpen(false);
      resetForm();
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Ajouter une identité
      </Button>
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle identité</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pseudo</Label>
              <Input
                placeholder="Pseudo in-game"
                value={form.pseudo}
                onChange={(e) => setForm({ ...form, pseudo: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Faction <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <Input
                placeholder="ex: Ballas, LSPD..."
                value={form.faction}
                onChange={(e) => setForm({ ...form, faction: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Téléphone IG <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
            <Input
              placeholder="(xxx)xxxx"
              value={form.telephone_ig}
              onChange={(e) => setForm({ ...form, telephone_ig: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const selected = selectedTags.includes(tag.nom);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.nom)}
                    className="rounded-full border px-3 py-1 text-xs font-medium transition-all"
                    style={{
                      borderColor: selected ? tag.couleur : tag.couleur + "40",
                      color: selected ? "#fff" : tag.couleur,
                      backgroundColor: selected ? tag.couleur : tag.couleur + "15",
                    }}
                  >
                    {tag.nom}
                  </button>
                );
              })}
            </div>
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {selectedTags.map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1 text-xs">
                    {t}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => toggleTag(t)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Champs dynamiques selon les tags sélectionnés */}
          {selectedTags.some((nom) => tags.find((t) => t.nom === nom)?.champs?.length) && (
            <div className="space-y-2">
              {selectedTags.map((tagNom) => {
                const tag = tags.find((t) => t.nom === tagNom);
                if (!tag?.champs?.length) return null;
                return (
                  <div
                    key={tagNom}
                    className="rounded-lg border p-3 space-y-2"
                    style={{ borderColor: tag.couleur + "40", backgroundColor: tag.couleur + "08" }}
                  >
                    <p
                      className="text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: tag.couleur }}
                    >
                      {tag.nom}
                    </p>
                    {tag.champs.map((champ) => (
                      <div key={champ.nom} className="space-y-1">
                        <Label className="text-sm">{champ.nom}</Label>
                        <Input
                          placeholder={champ.placeholder}
                          value={champsValues[tagNom]?.[champ.nom] ?? ""}
                          onChange={(e) =>
                            setChampsValues((prev) => ({
                              ...prev,
                              [tagNom]: { ...prev[tagNom], [champ.nom]: e.target.value },
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-2">
            <Label>Fiabilité : {form.fiabilite}/5</Label>
            <input
              type="range"
              min={1}
              max={5}
              value={form.fiabilite}
              onChange={(e) => setForm({ ...form, fiabilite: parseInt(e.target.value) })}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Pas fiable</span>
              <span>Très fiable</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
            <Textarea
              placeholder="Infos, contexte de la rencontre..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Images */}
          <div className="space-y-2">
            <Label>
              Photos{" "}
              <span className="text-muted-foreground text-xs">(optionnel)</span>
            </Label>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={[
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors",
                dragOver
                  ? "border-primary bg-primary/10"
                  : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40",
              ].join(" ")}
            >
              <ImagePlus className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Glisse des images ici ou{" "}
                <span className="text-primary font-medium">clique pour sélectionner</span>
              </p>
              <p className="text-xs text-muted-foreground/60">PNG, JPG, WEBP</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileInput}
            />
            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {previews.map((src, i) => (
                  <div
                    key={i}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted cursor-zoom-in"
                    onClick={() => setLightboxUrl(src)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`aperçu ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ajout...
                </>
              ) : (
                "Ajouter"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
      <ImageLightbox src={lightboxUrl} alt="photo" onClose={() => setLightboxUrl(null)} />
    </>
  );
}
