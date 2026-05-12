"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Settings2, ChevronRight } from "lucide-react";
import type { ProduitCategorie, ProduitType } from "@/types";

const COULEURS = ["green", "blue", "purple", "red", "orange", "yellow", "cyan", "white", "gray"] as const;
type Couleur = (typeof COULEURS)[number];

const COULEUR_DOT: Record<Couleur | string, string> = {
  green:  "bg-green-400",
  blue:   "bg-blue-400",
  purple: "bg-purple-400",
  red:    "bg-red-400",
  orange: "bg-orange-400",
  yellow: "bg-yellow-400",
  cyan:   "bg-cyan-400",
  white:  "bg-slate-200",
  gray:   "bg-gray-400",
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  categories: ProduitCategorie[];
  types: ProduitType[];
  onCategoriesChange: (cats: ProduitCategorie[]) => void;
  onTypesChange: (types: ProduitType[]) => void;
}

export function ManageCategoriesDialog({
  open,
  onOpenChange,
  categories,
  types,
  onCategoriesChange,
  onTypesChange,
}: Props) {
  const supabase = createClient();
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);

  // New category form
  const [newCat, setNewCat] = useState({ nom: "", icone: "📦", couleur: "gray" });
  const [loadingCat, setLoadingCat] = useState(false);
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<string | null>(null);

  // New type form
  const [newType, setNewType] = useState("");
  const [loadingType, setLoadingType] = useState(false);
  const [confirmDeleteType, setConfirmDeleteType] = useState<string | null>(null);

  const selectedCat = categories.find((c) => c.id === selectedCatId);
  const selectedTypes = types.filter((t) => t.categorie_id === selectedCatId);

  const handleAddCategory = async () => {
    if (!newCat.nom.trim()) return;
    setLoadingCat(true);
    const { data, error } = await supabase
      .from("produit_categories")
      .insert([{ nom: newCat.nom.trim(), icone: newCat.icone || "📦", couleur: newCat.couleur }])
      .select()
      .single();
    if (!error && data) {
      onCategoriesChange([...categories, data as ProduitCategorie].sort((a, b) => a.nom.localeCompare(b.nom)));
      setNewCat({ nom: "", icone: "📦", couleur: "gray" });
    }
    setLoadingCat(false);
  };

  const handleDeleteCategory = async (id: string) => {
    const { error } = await supabase.from("produit_categories").delete().eq("id", id);
    if (!error) {
      onCategoriesChange(categories.filter((c) => c.id !== id));
      onTypesChange(types.filter((t) => t.categorie_id !== id));
      if (selectedCatId === id) setSelectedCatId(null);
    }
    setConfirmDeleteCat(null);
  };

  const handleAddType = async () => {
    if (!newType.trim() || !selectedCatId) return;
    setLoadingType(true);
    const { data, error } = await supabase
      .from("produit_types")
      .insert([{ categorie_id: selectedCatId, nom: newType.trim() }])
      .select()
      .single();
    if (!error && data) {
      onTypesChange([...types, data as ProduitType].sort((a, b) => a.nom.localeCompare(b.nom)));
      setNewType("");
    }
    setLoadingType(false);
  };

  const handleDeleteType = async (id: string) => {
    const { error } = await supabase.from("produit_types").delete().eq("id", id);
    if (!error) {
      onTypesChange(types.filter((t) => t.id !== id));
    }
    setConfirmDeleteType(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gérer les produits</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6 pt-2 min-h-[400px]">
          {/* Left: Categories */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Catégories
            </p>
            <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer transition-all ${
                    selectedCatId === cat.id
                      ? "border-primary/40 bg-primary/10"
                      : "border-border hover:border-muted-foreground/40 hover:bg-accent"
                  }`}
                  onClick={() => setSelectedCatId(selectedCatId === cat.id ? null : cat.id)}
                >
                  <span className="text-base">{cat.icone}</span>
                  <span className="flex-1 text-sm font-medium">{cat.nom}</span>
                  <div
                    className={`h-2 w-2 shrink-0 rounded-full ${COULEUR_DOT[cat.couleur] ?? "bg-gray-400"}`}
                  />
                  <ChevronRight
                    className={`h-3 w-3 shrink-0 text-muted-foreground transition-transform ${
                      selectedCatId === cat.id ? "rotate-90" : ""
                    }`}
                  />
                  {confirmDeleteCat === cat.id ? (
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-6 px-2 text-xs"
                        onClick={() => handleDeleteCategory(cat.id)}
                      >
                        Suppr.
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs"
                        onClick={() => setConfirmDeleteCat(null)}
                      >
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 shrink-0 p-0 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteCat(cat.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Add category form */}
            <div className="space-y-2 border-t border-border pt-3">
              <p className="text-xs text-muted-foreground">Nouvelle catégorie</p>
              <div className="flex gap-2">
                <Input
                  placeholder="🌿"
                  value={newCat.icone}
                  onChange={(e) => setNewCat({ ...newCat, icone: e.target.value })}
                  className="w-14 text-center"
                />
                <Input
                  placeholder="Nom..."
                  value={newCat.nom}
                  onChange={(e) => setNewCat({ ...newCat, nom: e.target.value })}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-1.5 px-0.5">
                {COULEURS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    onClick={() => setNewCat({ ...newCat, couleur: c })}
                    className={`h-5 w-5 rounded-full border-2 transition-all ${COULEUR_DOT[c]} ${
                      newCat.couleur === c ? "border-foreground scale-110" : "border-transparent"
                    }`}
                  />
                ))}
              </div>
              <Button
                size="sm"
                className="w-full"
                onClick={handleAddCategory}
                disabled={loadingCat || !newCat.nom.trim()}
              >
                <Plus className="mr-2 h-3.5 w-3.5" />
                Ajouter
              </Button>
            </div>
          </div>

          {/* Right: Types for selected category */}
          <div className="space-y-3">
            {selectedCat ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Sous-types — {selectedCat.icone} {selectedCat.nom}
                </p>
                <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1">
                  {selectedTypes.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      Aucun sous-type
                    </p>
                  ) : (
                    selectedTypes.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center gap-2 rounded-md border border-border px-3 py-2"
                      >
                        <span className="flex-1 text-sm">{t.nom}</span>
                        {confirmDeleteType === t.id ? (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-6 px-2 text-xs"
                              onClick={() => handleDeleteType(t.id)}
                            >
                              Suppr.
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs"
                              onClick={() => setConfirmDeleteType(null)}
                            >
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => setConfirmDeleteType(t.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Add type form */}
                <div className="border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground mb-2">Nouveau sous-type</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ex: OG Kush, Purple Haze..."
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddType();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={handleAddType}
                      disabled={loadingType || !newType.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <Settings2 className="h-8 w-8 opacity-30" />
                <p className="text-sm">Sélectionne une catégorie</p>
                <p className="text-xs opacity-60">pour gérer ses sous-types</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
