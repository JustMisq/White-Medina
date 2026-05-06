"use client";

import { useState, useRef, useEffect } from "react";
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
import { HexColorPicker } from "react-colorful";
import { Pencil, Trash2, Plus, Check, X, Settings2, GripVertical } from "lucide-react";
import type { Tag, TagChamp } from "@/types";

interface ManageTagsDialogProps {
  tags: Tag[];
}

function ColorPickerPopover({
  color,
  onChange,
  onClose,
}: {
  color: string;
  onChange: (c: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hex, setHex] = useState(color);

  useEffect(() => {
    setHex(color);
  }, [color]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const handleHexInput = (val: string) => {
    setHex(val);
    if (/^#[0-9a-fA-F]{6}$/.test(val)) onChange(val);
  };

  return (
    <div
      ref={ref}
      className="absolute z-50 rounded-xl border border-border bg-popover p-3 shadow-xl space-y-2"
      style={{ top: "calc(100% + 8px)", left: 0 }}
    >
      <HexColorPicker
        color={color}
        onChange={(c) => {
          onChange(c);
          setHex(c);
        }}
        style={{ width: "200px", height: "160px" }}
      />
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">#</span>
        <input
          className="w-full rounded-md border border-border bg-background pl-6 pr-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
          value={hex.replace("#", "")}
          onChange={(e) => handleHexInput("#" + e.target.value)}
          maxLength={6}
          spellCheck={false}
        />
      </div>
    </div>
  );
}

export function ManageTagsDialog({ tags: initialTags }: ManageTagsDialogProps) {
  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nom: "", couleur: "#6b7280", champs: [] as TagChamp[] });
  const [newForm, setNewForm] = useState({ nom: "", couleur: "#6b7280", champs: [] as TagChamp[] });
  const [adding, setAdding] = useState(false);
  const [showPickerFor, setShowPickerFor] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Sync tags when dialog opens
  useEffect(() => {
    if (open) setTags(initialTags);
  }, [open, initialTags]);

  const startEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setEditForm({ nom: tag.nom, couleur: tag.couleur, champs: tag.champs ?? [] });
    setShowPickerFor(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowPickerFor(null);
  };

  const saveEdit = async (id: string) => {
    const { error } = await supabase
      .from("tags")
      .update({ nom: editForm.nom, couleur: editForm.couleur, champs: editForm.champs })
      .eq("id", id);
    if (!error) {
      setTags((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...editForm } : t))
      );
      setEditingId(null);
      setShowPickerFor(null);
      router.refresh();
    }
  };

  const deleteTag = async (id: string) => {
    const { error } = await supabase.from("tags").delete().eq("id", id);
    if (!error) {
      setTags((prev) => prev.filter((t) => t.id !== id));
      router.refresh();
    }
  };

  const addTag = async () => {
    if (!newForm.nom.trim()) return;
    const { data, error } = await supabase
      .from("tags")
      .insert({ nom: newForm.nom.trim(), couleur: newForm.couleur, champs: newForm.champs })
      .select()
      .single();
    if (!error && data) {
      setTags((prev) => [...prev, data as Tag]);
      setNewForm({ nom: "", couleur: "#6b7280", champs: [] });
      setAdding(false);
      setShowPickerFor(null);
      router.refresh();
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Settings2 className="mr-2 h-4 w-4" />
        Gérer les tags
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gérer les tags</DialogTitle>
          </DialogHeader>

          <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
            {tags.map((tag) =>
              editingId === tag.id ? (
                <div key={tag.id} className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
                  {/* Ligne nom + couleur */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setShowPickerFor(showPickerFor === tag.id ? null : tag.id)
                        }
                        className="h-8 w-8 rounded-md border-2 border-border shadow-sm transition-transform hover:scale-110"
                        style={{ backgroundColor: editForm.couleur }}
                      />
                      {showPickerFor === tag.id && (
                        <ColorPickerPopover
                          color={editForm.couleur}
                          onChange={(c) => setEditForm((f) => ({ ...f, couleur: c }))}
                          onClose={() => setShowPickerFor(null)}
                        />
                      )}
                    </div>
                    <Input
                      value={editForm.nom}
                      onChange={(e) => setEditForm((f) => ({ ...f, nom: e.target.value }))}
                      className="h-8 flex-1 text-sm"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => saveEdit(tag.id)}
                      className="text-green-500 hover:text-green-400 transition-colors"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Champs personnalisés */}
                  <div className="space-y-2 pl-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Champs personnalisés
                    </p>
                    {editForm.champs.map((champ, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <Input
                          value={champ.nom}
                          onChange={(e) =>
                            setEditForm((f) => {
                              const champs = [...f.champs];
                              champs[i] = { ...champs[i], nom: e.target.value };
                              return { ...f, champs };
                            })
                          }
                          placeholder="Nom du champ"
                          className="h-7 flex-1 text-xs"
                        />
                        <Input
                          value={champ.placeholder}
                          onChange={(e) =>
                            setEditForm((f) => {
                              const champs = [...f.champs];
                              champs[i] = { ...champs[i], placeholder: e.target.value };
                              return { ...f, champs };
                            })
                          }
                          placeholder="Placeholder"
                          className="h-7 flex-1 text-xs text-muted-foreground"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setEditForm((f) => ({
                              ...f,
                              champs: f.champs.filter((_, j) => j !== i),
                            }))
                          }
                          className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setEditForm((f) => ({
                          ...f,
                          champs: [...f.champs, { nom: "", placeholder: "" }],
                        }))
                      }
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                      Ajouter un champ
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  key={tag.id}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors group"
                >
                  <div
                    className="h-4 w-4 flex-shrink-0 rounded-full border border-white/10"
                    style={{ backgroundColor: tag.couleur }}
                  />
                  <span
                    className="flex-1 text-sm font-medium"
                    style={{ color: tag.couleur }}
                  >
                    {tag.nom}
                  </span>
                  {tag.champs?.length > 0 && (
                    <span className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                      {tag.champs.length} champ{tag.champs.length > 1 ? "s" : ""}
                    </span>
                  )}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => startEdit(tag)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteTag(tag.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Ajouter un nouveau tag */}
          {adding ? (
            <div className="rounded-lg border border-dashed border-border p-3 space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setShowPickerFor(showPickerFor === "new" ? null : "new")
                    }
                    className="h-8 w-8 rounded-md border-2 border-border shadow-sm transition-transform hover:scale-110"
                    style={{ backgroundColor: newForm.couleur }}
                  />
                  {showPickerFor === "new" && (
                    <ColorPickerPopover
                      color={newForm.couleur}
                      onChange={(c) => setNewForm((f) => ({ ...f, couleur: c }))}
                      onClose={() => setShowPickerFor(null)}
                    />
                  )}
                </div>
                <Input
                  placeholder="Nom du tag..."
                  value={newForm.nom}
                  onChange={(e) => setNewForm((f) => ({ ...f, nom: e.target.value }))}
                  className="h-8 flex-1 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); addTag(); }
                    if (e.key === "Escape") { setAdding(false); setShowPickerFor(null); }
                  }}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="text-green-500 hover:text-green-400 transition-colors"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => { setAdding(false); setShowPickerFor(null); setNewForm({ nom: "", couleur: "#6b7280", champs: [] }); }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Champs personnalisés du nouveau tag */}
              <div className="space-y-2 pl-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Champs personnalisés
                </p>
                {newForm.champs.map((champ, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <Input
                      value={champ.nom}
                      onChange={(e) =>
                        setNewForm((f) => {
                          const champs = [...f.champs];
                          champs[i] = { ...champs[i], nom: e.target.value };
                          return { ...f, champs };
                        })
                      }
                      placeholder="Nom du champ"
                      className="h-7 flex-1 text-xs"
                    />
                    <Input
                      value={champ.placeholder}
                      onChange={(e) =>
                        setNewForm((f) => {
                          const champs = [...f.champs];
                          champs[i] = { ...champs[i], placeholder: e.target.value };
                          return { ...f, champs };
                        })
                      }
                      placeholder="Placeholder"
                      className="h-7 flex-1 text-xs text-muted-foreground"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setNewForm((f) => ({
                          ...f,
                          champs: f.champs.filter((_, j) => j !== i),
                        }))
                      }
                      className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setNewForm((f) => ({
                      ...f,
                      champs: [...f.champs, { nom: "", placeholder: "" }],
                    }))
                  }
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Ajouter un champ
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nouveau tag
            </button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
