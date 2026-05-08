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
import { Pencil, X, ImagePlus, Loader2 } from "lucide-react";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import type { Contact, Tag } from "@/types";

interface EditContactDialogProps {
  contact: Contact;
  tags: Tag[];
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}

export function EditContactDialog({ contact, tags, open: controlledOpen, onOpenChange: controlledOnOpenChange }: EditContactDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    pseudo: contact.pseudo,
    faction: contact.faction ?? "",
    telephone_ig: contact.telephone_ig ?? "",
    fiabilite: contact.fiabilite,
    notes: contact.notes ?? "",
  });
  const [selectedTags, setSelectedTags] = useState<string[]>(contact.tags);
  const [champsValues, setChampsValues] = useState<Record<string, Record<string, string>>>(
    contact.champs_custom ?? {}
  );
  // Images existantes (URLs)
  const [existingImages, setExistingImages] = useState<string[]>(contact.images ?? []);
  // Nouvelles images (fichiers locaux)
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setOpen = (v: boolean) => {
    if (isControlled) controlledOnOpenChange?.(v);
    else setInternalOpen(v);
  };
  const router = useRouter();
  const supabase = createClient();

  const toggleTag = (nom: string) => {
    setSelectedTags((prev) =>
      prev.includes(nom) ? prev.filter((t) => t !== nom) : [...prev, nom]
    );
  };

  const addFiles = useCallback((files: FileList | File[]) => {
    const accepted = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setNewFiles((prev) => [...prev, ...accepted]);
    accepted.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewPreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const removeNewImage = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (url: string) => {
    setExistingImages((prev) => prev.filter((u) => u !== url));
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

  const uploadNewImages = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of newFiles) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const uploadedUrls = newFiles.length > 0 ? await uploadNewImages() : [];
    const allImages = [...existingImages, ...uploadedUrls];

    const { error } = await supabase
      .from("contacts")
      .update({
        ...form,
        tags: selectedTags,
        images: allImages,
        champs_custom: champsValues,
      })
      .eq("id", contact.id);

    if (!error) {
      setOpen(false);
      router.refresh();
    }
    setLoading(false);
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) {
      // Reset à l'état initial du contact
      setForm({ pseudo: contact.pseudo, faction: contact.faction ?? "", telephone_ig: contact.telephone_ig ?? "", fiabilite: contact.fiabilite, notes: contact.notes ?? "" });
      setSelectedTags(contact.tags);
      setChampsValues(contact.champs_custom ?? {});
      setExistingImages(contact.images ?? []);
      setNewFiles([]);
      setNewPreviews([]);
    }
  };

  return (
    <>
      {!isControlled && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={() => setOpen(true)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      )}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier {contact.pseudo}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Infos */}
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
                <Label>
                  Faction{" "}
                  <span className="text-muted-foreground text-xs">(optionnel)</span>
                </Label>
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

            {/* Tags */}
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

            {/* Champs dynamiques */}
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

            {/* Fiabilité */}
            <div className="space-y-2">
              <Label>Fiabilité : {form.fiabilite}/5</Label>
              <input
                type="range"
                min={1}
                max={5}
                value={form.fiabilite}
                onChange={(e) => setForm({ ...form, fiabilite: parseInt(e.target.value) as Contact["fiabilite"] })}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Pas fiable</span>
                <span>Très fiable</span>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>
                Notes{" "}
                <span className="text-muted-foreground text-xs">(optionnel)</span>
              </Label>
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

              {/* Images existantes */}
              {existingImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {existingImages.map((url) => (
                    <div
                      key={url}
                      className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted cursor-zoom-in"
                      onClick={() => setLightboxUrl(url)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt="photo"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeExistingImage(url); }}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Zone drag & drop pour nouvelles images */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                className={[
                  "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-4 text-center transition-colors",
                  dragOver
                    ? "border-primary bg-primary/10"
                    : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40",
                ].join(" ")}
              >
                <ImagePlus className="h-5 w-5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Glisse ou{" "}
                  <span className="text-primary font-medium">clique</span> pour ajouter des photos
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileInput}
              />

              {/* Nouvelles previews */}
              {newPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {newPreviews.map((src, i) => (
                    <div
                      key={i}
                      className="group relative aspect-square overflow-hidden rounded-lg border border-primary/30 bg-muted cursor-zoom-in"
                      onClick={() => setLightboxUrl(src)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`nouveau ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 ring-1 ring-inset ring-primary/20 rounded-lg pointer-events-none" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeNewImage(i); }}
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
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer"
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
