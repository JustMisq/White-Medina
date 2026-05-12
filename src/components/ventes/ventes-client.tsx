"use client";

import { useState, useMemo, useEffect } from "react";
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
import { Plus, Trash2, Settings2, TrendingUp, AlertCircle } from "lucide-react";
import type { Vente, ProduitCategorie, ProduitType, Membre, StockDrogue } from "@/types";
import { ManageCategoriesDialog } from "./manage-categories-dialog";

const COULEUR_BADGE: Record<string, string> = {
  green:  "bg-green-500/10 text-green-400 border-green-500/20",
  blue:   "bg-blue-500/10 text-blue-400 border-blue-500/20",
  purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  red:    "bg-red-500/10 text-red-400 border-red-500/20",
  orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  cyan:   "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  white:  "bg-slate-100/10 text-slate-200 border-slate-100/20",
  gray:   "text-muted-foreground border-border",
};

interface VentesClientProps {
  ventes: Vente[];
  categories: ProduitCategorie[];
  types: ProduitType[];
  membres: Pick<Membre, "id" | "pseudo">[];
  stocks: StockDrogue[];
  canModifier?: boolean;
}

export function VentesClient({
  ventes: initialVentes,
  categories: initialCategories,
  types: initialTypes,
  membres,
  stocks: initialStocks,
  canModifier = true,
}: VentesClientProps) {
  const [ventes, setVentes] = useState(initialVentes);
  const [categories, setCategories] = useState(initialCategories);
  const [types, setTypes] = useState(initialTypes);
  const [stocks, setStocks] = useState(initialStocks);
  const supabase = createClient();

  // Filter
  const [filterCatId, setFilterCatId] = useState<string>("__all__");

  // Add sale dialog
  const defaultForm = {
    categorie_id: "",
    type_id: "__none__",
    quantite: "",
    unite: "u",
    prix_unitaire: "",
    total_recu: "",
    montant_vole: "",
    vendeur_id: "__none__",
    notes: "",
  };
  const [openAdd, setOpenAdd] = useState(false);
  const [formVente, setFormVente] = useState(defaultForm);
  const [loadingVente, setLoadingVente] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // Manage products dialog
  const [openManage, setOpenManage] = useState(false);

  // Auto-calculate prix_unitaire from total_recu / quantite (reverse calc)
  useEffect(() => {
    const q = parseFloat(formVente.quantite);
    const t = parseFloat(formVente.total_recu);
    if (!isNaN(q) && !isNaN(t) && q > 0 && t >= 0) {
      setFormVente((prev) => ({ ...prev, prix_unitaire: (t / q).toFixed(2) }));
    } else {
      setFormVente((prev) => ({ ...prev, prix_unitaire: "" }));
    }
  }, [formVente.quantite, formVente.total_recu]);

  // Reset type when category changes
  useEffect(() => {
    if (!formVente.categorie_id) return;
    setFormVente((prev) => ({
      ...prev,
      unite: "u",
      type_id: "__none__",
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formVente.categorie_id]);

  // Find matching stock for selected product
  const selectedStock = useMemo(() => {
    if (!formVente.categorie_id) return null;
    const typeId = formVente.type_id && formVente.type_id !== "__none__" ? formVente.type_id : null;
    return stocks.find((s) =>
      s.categorie_id === formVente.categorie_id &&
      (typeId ? s.type_id === typeId : !s.type_id || s.type_id === null)
    ) ?? null;
  }, [stocks, formVente.categorie_id, formVente.type_id]);

  const quantiteVendue = parseFloat(formVente.quantite) || 0;
  const unitesVolees = parseInt(formVente.montant_vole) || 0;
  const totalUnitesSortantes = quantiteVendue + unitesVolees;
  const stockInsuffisant = selectedStock !== null && totalUnitesSortantes > selectedStock.quantite_g;

  const selectedCategoryTypes = useMemo(
    () => types.filter((t) => t.categorie_id === formVente.categorie_id),
    [types, formVente.categorie_id]
  );

  const filteredVentes = useMemo(
    () =>
      filterCatId === "__all__"
        ? ventes
        : ventes.filter((v) => v.categorie_id === filterCatId),
    [ventes, filterCatId]
  );

  const totalRecu = useMemo(
    () => filteredVentes.reduce((acc, v) => acc + v.total_recu, 0),
    [filteredVentes]
  );
  const totalUnitsVoles = useMemo(
    () => filteredVentes.reduce((acc, v) => acc + (v.montant_vole ?? 0), 0),
    [filteredVentes]
  );

  const handleSubmitVente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formVente.categorie_id || stockInsuffisant) return;
    setLoadingVente(true);

    const quantite = parseFloat(formVente.quantite) || 0;
    const totalRecu = parseFloat(formVente.total_recu) || 0;
    const prixUnitaire = quantite > 0 ? Math.round((totalRecu / quantite) * 100) / 100 : 0;

    const payload = {
      categorie_id: formVente.categorie_id,
      type_id:
        formVente.type_id && formVente.type_id !== "__none__"
          ? formVente.type_id
          : null,
      quantite,
      unite: "u",
      prix_unitaire: prixUnitaire,
      total_recu: totalRecu,
      montant_vole: formVente.montant_vole
        ? parseFloat(formVente.montant_vole)
        : null,
      vendeur_id:
        formVente.vendeur_id && formVente.vendeur_id !== "__none__"
          ? formVente.vendeur_id
          : null,
      notes: formVente.notes || null,
    };

    const { data, error } = await supabase
      .from("ventes")
      .insert([payload])
      .select(
        "*, categorie:produit_categories!categorie_id(nom,icone,couleur), type:produit_types!type_id(nom), vendeur:membres!vendeur_id(pseudo)"
      )
      .single();

    if (!error && data) {
      const newVente = data as Vente;
      setVentes((prev) => [newVente, ...prev]);
      setOpenAdd(false);
      setFormVente(defaultForm);

      // Déduire du stock : unités vendues + unités volées
      if (selectedStock) {
        const unitesRetrait = payload.quantite + (payload.montant_vole ?? 0);
        const newQty = Math.max(0, selectedStock.quantite_g - unitesRetrait);

        const { data: updatedStock } = await supabase
          .from("stocks_drogue")
          .update({ quantite_g: newQty, updated_at: new Date().toISOString() })
          .eq("id", selectedStock.id)
          .select("*, categorie:produit_categories!categorie_id(nom,icone,couleur), type:produit_types!type_id(nom)")
          .single();

        if (updatedStock) {
          setStocks((prev) =>
            prev.map((s) => (s.id === selectedStock.id ? (updatedStock as StockDrogue) : s))
          );
        }
      }
    }
    setLoadingVente(false);
  };

  const handleDeleteVente = async (id: string) => {
    const { error } = await supabase.from("ventes").delete().eq("id", id);
    if (!error) {
      setVentes((prev) => prev.filter((v) => v.id !== id));
    }
    setConfirmingId(null);
  };

  return (
    <div className="space-y-4">
      {/* Filter + actions bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterCatId("__all__")}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
              filterCatId === "__all__"
                ? "bg-primary text-primary-foreground border-primary"
                : "text-muted-foreground border-border hover:border-muted-foreground"
            }`}
          >
            Tout ({ventes.length})
          </button>
          {categories.map((cat) => {
            const count = ventes.filter((v) => v.categorie_id === cat.id).length;
            if (count === 0) return null;
            return (
              <button
                key={cat.id}
                onClick={() => setFilterCatId(cat.id)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  filterCatId === cat.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "text-muted-foreground border-border hover:border-muted-foreground"
                }`}
              >
                {cat.icone} {cat.nom} ({count})
              </button>
            );
          })}
        </div>

        {canModifier && (
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setOpenManage(true)}
            >
              <Settings2 className="mr-2 h-4 w-4" />
              Produits
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setFormVente(defaultForm);
                setOpenAdd(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Enregistrer une vente
            </Button>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid gap-3 grid-cols-3">
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <div className="text-xl font-bold">{filteredVentes.length}</div>
          <p className="text-xs text-muted-foreground">
            Vente{filteredVentes.length > 1 ? "s" : ""}
            {filterCatId !== "__all__" ? " (filtrées)" : ""}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <div className="text-xl font-bold text-amber-400">
            +{new Intl.NumberFormat("fr-FR").format(totalRecu)}$
          </div>
          <p className="text-xs text-muted-foreground">
            Encaissé{filterCatId !== "__all__" ? " (filtré)" : ""}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <div
            className={`text-xl font-bold ${totalUnitsVoles > 0 ? "text-red-400" : "text-muted-foreground"}`}
          >
            {totalUnitsVoles > 0
              ? `-${new Intl.NumberFormat("fr-FR").format(totalUnitsVoles)} u`
              : "—"}
          </div>
          <p className="text-xs text-muted-foreground">
            Volé (unités){filterCatId !== "__all__" ? " (filtré)" : ""}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produit</TableHead>
              <TableHead>Vendeur</TableHead>
              <TableHead className="text-right">Quantité</TableHead>
              <TableHead className="text-right">Prix/unité</TableHead>
              <TableHead className="text-right">Total reçu</TableHead>
              <TableHead className="text-right">Volé</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Date</TableHead>
              {canModifier && <TableHead className="w-[80px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVentes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canModifier ? 9 : 8}
                  className="py-12 text-center"
                >
                  <TrendingUp className="mx-auto mb-2 h-8 w-8 opacity-20" />
                  <p className="text-muted-foreground">
                    Aucune vente enregistrée.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredVentes.map((v) => {
                const catData = categories.find((c) => c.id === v.categorie_id);
                const couleur = catData?.couleur ?? v.categorie?.couleur ?? "gray";
                const icone = catData?.icone ?? v.categorie?.icone ?? "📦";
                const catNom = catData?.nom ?? v.categorie?.nom ?? "—";
                const typeNom =
                  types.find((t) => t.id === v.type_id)?.nom ??
                  v.type?.nom;
                const vendeurPseudo =
                  membres.find((m) => m.id === v.vendeur_id)?.pseudo ??
                  v.vendeur?.pseudo;

                return (
                  <TableRow key={v.id}>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <Badge
                          variant="outline"
                          className={COULEUR_BADGE[couleur] ?? COULEUR_BADGE.gray}
                        >
                          {icone} {catNom}
                        </Badge>
                        {typeNom && (
                          <span className="pl-1 text-xs text-muted-foreground">
                            {typeNom}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {vendeurPseudo ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {v.quantite} {v.unite}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {v.prix_unitaire}$/{v.unite}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-amber-400">
                      {new Intl.NumberFormat("fr-FR").format(v.total_recu)}$
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {v.montant_vole ? (
                        <span className="text-red-400">
                          -{v.montant_vole} u
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[140px] truncate text-sm text-muted-foreground">
                      {v.notes ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(v.created_at).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    {canModifier && (
                      <TableCell>
                        {confirmingId === v.id ? (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleDeleteVente(v.id)}
                            >
                              Suppr.
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={() => setConfirmingId(null)}
                            >
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => setConfirmingId(v.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Sale Dialog */}
      <Dialog
        open={openAdd}
        onOpenChange={(v) => {
          if (!v) setOpenAdd(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enregistrer une vente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitVente} className="space-y-4 pt-2">
            {/* Category */}
            <div className="space-y-2">
              <Label>Produit *</Label>
              <Select
                value={formVente.categorie_id}
                onValueChange={(v) =>
                  setFormVente((prev) => ({
                    ...prev,
                    categorie_id: v ?? "",
                    type_id: "__none__",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un produit...">
                    {(v: string | null) => {
                      const c = categories.find((cat) => cat.id === v);
                      return c ? `${c.icone} ${c.nom}` : null;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id} label={`${c.icone} ${c.nom}`}>
                      {c.icone} {c.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subtype (only if category has types) */}
            {selectedCategoryTypes.length > 0 && (
              <div className="space-y-2">
                <Label>
                  Sous-type{" "}
                  <span className="text-xs text-muted-foreground">
                    (optionnel)
                  </span>
                </Label>
                <Select
                  value={formVente.type_id}
                  onValueChange={(v) =>
                    setFormVente((prev) => ({ ...prev, type_id: v ?? "__none__" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner...">
                      {(v: string | null) => {
                        if (!v || v === "__none__") return null;
                        const t = selectedCategoryTypes.find((tp) => tp.id === v);
                        return t ? t.nom : null;
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__" label="— Aucun">— Aucun</SelectItem>
                    {selectedCategoryTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id} label={t.nom}>
                        {t.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Stock disponible */}
            {formVente.categorie_id && (
              <div className={`rounded-md border px-3 py-2 text-sm ${
                selectedStock
                  ? stockInsuffisant
                    ? "border-red-500/40 bg-red-500/10 text-red-400"
                    : "border-border bg-muted/20 text-muted-foreground"
                  : "border-yellow-500/40 bg-yellow-500/10 text-yellow-400"
              }`}>
                {selectedStock ? (
                  <>
                    Stock disponible :{" "}
                    <span className={`font-mono font-semibold ${stockInsuffisant ? "text-red-400" : "text-foreground"}`}>
                      {selectedStock.quantite_g} u
                    </span>
                    {totalUnitesSortantes > 0 && !stockInsuffisant && (
                      <span className="ml-2 text-muted-foreground">
                        → {Math.max(0, selectedStock.quantite_g - totalUnitesSortantes)} u restantes
                      </span>
                    )}
                    {stockInsuffisant && (
                      <span className="ml-2 inline-flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Stock insuffisant ({totalUnitesSortantes} u demandées)
                      </span>
                    )}
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Aucun stock trouvé pour ce produit
                  </span>
                )}
              </div>
            )}

            {/* Vendeur */}
            <div className="space-y-2">
              <Label>
                Vendeur{" "}
                <span className="text-xs text-muted-foreground">(optionnel)</span>
              </Label>
              <Select
                value={formVente.vendeur_id}
                onValueChange={(v) =>
                  setFormVente((prev) => ({ ...prev, vendeur_id: v ?? "__none__" }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un membre...">
                    {(v: string | null) => {
                      if (!v || v === "__none__") return null;
                      const m = membres.find((mb) => mb.id === v);
                      return m ? m.pseudo : null;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__" label="— Aucun">— Aucun</SelectItem>
                  {membres.map((m) => (
                    <SelectItem key={m.id} value={m.id} label={m.pseudo}>
                      {m.pseudo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantite */}
            <div className="space-y-2">
              <Label>Quantité (unités) *</Label>
              <Input
                type="number"
                min={1}
                step={1}
                placeholder="0"
                value={formVente.quantite}
                onChange={(e) =>
                  setFormVente((prev) => ({
                    ...prev,
                    quantite: e.target.value,
                  }))
                }
                className={stockInsuffisant ? "border-red-500/60" : ""}
                required
              />
              {selectedStock && !stockInsuffisant && formVente.quantite && (
                <p className="text-xs text-muted-foreground">
                  Reste après vente :{" "}
                  <span className="font-mono text-foreground">
                    {Math.max(0, selectedStock.quantite_g - totalUnitesSortantes)} u
                  </span>
                  {unitesVolees > 0 && (
                    <span className="ml-1 text-red-400/70">({quantiteVendue} vendues + {unitesVolees} volées)</span>
                  )}
                </p>
              )}
            </div>

            {/* Total reçu — champ principal */}
            <div className="space-y-2">
              <Label>Total reçu ($) *</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="0"
                value={formVente.total_recu}
                onChange={(e) =>
                  setFormVente((prev) => ({
                    ...prev,
                    total_recu: e.target.value,
                  }))
                }
                required
              />
            </div>

            {/* Prix unitaire — calculé automatiquement */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Prix par unité ($) — calculé</Label>
              <Input
                type="number"
                readOnly
                tabIndex={-1}
                placeholder="—"
                value={formVente.prix_unitaire}
                className="bg-muted/30 text-muted-foreground cursor-default"
              />
              {formVente.quantite && formVente.total_recu && formVente.prix_unitaire && (
                <p className="text-xs text-muted-foreground">
                  {formVente.total_recu}$ ÷ {formVente.quantite} u ={" "}
                  <span className="font-mono text-amber-400">
                    {formVente.prix_unitaire}$/u
                  </span>
                </p>
              )}
            </div>

            {/* Unités volées */}
            <div className="space-y-2">
              <Label>
                Unités volées{" "}
                <span className="text-xs text-muted-foreground">(optionnel)</span>
              </Label>
              <Input
                type="number"
                min={0}
                step={1}
                placeholder="0"
                value={formVente.montant_vole}
                onChange={(e) =>
                  setFormVente((prev) => ({
                    ...prev,
                    montant_vole: e.target.value,
                  }))
                }
              />
              {unitesVolees > 0 && selectedStock && (
                <p className="text-xs text-red-400/80">
                  Ces unités seront aussi retirées du stock.
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>
                Notes{" "}
                <span className="text-xs text-muted-foreground">(optionnel)</span>
              </Label>
              <Textarea
                placeholder="Client, lieu, remarques..."
                value={formVente.notes}
                onChange={(e) =>
                  setFormVente((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenAdd(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={
                  loadingVente ||
                  !formVente.categorie_id ||
                  !formVente.quantite ||
                  !formVente.total_recu ||
                  stockInsuffisant || !formVente.total_recu
                }
              >
                {loadingVente ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage Products Dialog */}
      <ManageCategoriesDialog
        open={openManage}
        onOpenChange={setOpenManage}
        categories={categories}
        types={types}
        onCategoriesChange={setCategories}
        onTypesChange={setTypes}
      />
    </div>
  );
}
