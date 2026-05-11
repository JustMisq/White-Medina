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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Trash2, Pencil, Package, ShoppingCart } from "lucide-react";
import type { StockDrogue, Munition, StockMatos, ProduitDrogue, ProduitWeed, VenteWeed, Membre } from "@/types";

const WEED_VARIANTS: ProduitWeed[] = ["og_kush", "purple_haze", "white_widow", "blue_dream"];

const produitColors: Record<ProduitDrogue, string> = {
  og_kush:     "bg-green-600/10 text-green-400 border-green-600/20",
  purple_haze: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  white_widow: "bg-slate-100/10 text-slate-200 border-slate-100/20",
  blue_dream:  "bg-blue-500/10 text-blue-400 border-blue-500/20",
  coke:        "bg-slate-200/10 text-slate-200 border-slate-200/20",
  meth:        "bg-sky-500/10 text-sky-400 border-sky-500/20",
  pills:       "bg-purple-500/10 text-purple-400 border-purple-500/20",
  autre:       "text-muted-foreground border-border",
};

const produitLabels: Record<ProduitDrogue, string> = {
  og_kush:     "OG Kush",
  purple_haze: "Purple Haze",
  white_widow: "White Widow",
  blue_dream:  "Blue Dream",
  coke:        "Coke",
  meth:        "Meth",
  pills:       "Pills",
  autre:       "Autre",
};

interface StocksClientProps {
  stocks: StockDrogue[];
  munitions: Munition[];
  matos: StockMatos[];
  ventes: VenteWeed[];
  membres: Pick<Membre, "id" | "pseudo">[];
  canModifier?: boolean;
}

export function StocksClient({
  stocks: initialStocks,
  munitions: initialMunitions,
  matos: initialMatos,
  ventes: initialVentes,
  membres,
  canModifier = true,
}: StocksClientProps) {
  const [stocks, setStocks] = useState(initialStocks);
  const [munitions, setMunitions] = useState(initialMunitions);
  const [matos, setMatos] = useState(initialMatos);
  const [ventes, setVentes] = useState(initialVentes);
  const router = useRouter();
  const supabase = createClient();

  // Drogue
  const [openDrogue, setOpenDrogue] = useState(false);
  const [loadingDrogue, setLoadingDrogue] = useState(false);
  const [formDrogue, setFormDrogue] = useState({
    produit: "og_kush" as ProduitDrogue,
    quantite_g: "",
    prix_achat_g: "",
    prix_revente_g: "",
    prix_graine: "",
    notes: "",
  });
  const [confirmingDrogue, setConfirmingDrogue] = useState<string | null>(null);

  const openEditDrogue = (s: StockDrogue) => {
    setFormDrogue({
      produit: s.produit,
      quantite_g: String(s.quantite_g),
      prix_achat_g: s.prix_achat_g != null ? String(s.prix_achat_g) : "",
      prix_revente_g: s.prix_revente_g != null ? String(s.prix_revente_g) : "",
      prix_graine: s.prix_graine != null ? String(s.prix_graine) : "",
      notes: s.notes ?? "",
    });
    setOpenDrogue(true);
  };

  const handleSubmitDrogue = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingDrogue(true);
    const payload: Record<string, unknown> = {
      produit: formDrogue.produit,
      quantite_g: parseFloat(formDrogue.quantite_g) || 0,
      prix_achat_g: parseFloat(formDrogue.prix_achat_g) || 0,
      prix_revente_g: parseFloat(formDrogue.prix_revente_g) || 0,
      notes: formDrogue.notes || null,
      updated_at: new Date().toISOString(),
    };
    if (formDrogue.produit === "og_kush") {
      payload.prix_graine = formDrogue.prix_graine ? parseFloat(formDrogue.prix_graine) : null;
    } else {
      payload.prix_graine = null;
    }
    const { error } = await supabase
      .from("stocks_drogue")
      .upsert([payload], { onConflict: "produit" });
    if (!error) {
      setOpenDrogue(false);
      setFormDrogue({ produit: "og_kush", quantite_g: "", prix_achat_g: "", prix_revente_g: "", prix_graine: "", notes: "" });
      router.refresh();
    }
    setLoadingDrogue(false);
  };

  const handleDeleteDrogue = async (id: string) => {
    await supabase.from("stocks_drogue").delete().eq("id", id);
    setStocks((prev) => prev.filter((s) => s.id !== id));
    setConfirmingDrogue(null);
  };

  // Munitions
  const [openMunition, setOpenMunition] = useState(false);
  const [loadingMunition, setLoadingMunition] = useState(false);
  const [formMunition, setFormMunition] = useState({ calibre: "", quantite: "" });
  const [confirmingMunition, setConfirmingMunition] = useState<string | null>(null);

  const openEditMunition = (m: Munition) => {
    setFormMunition({ calibre: m.calibre, quantite: String(m.quantite) });
    setOpenMunition(true);
  };

  const handleSubmitMunition = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingMunition(true);
    const { error } = await supabase
      .from("munitions")
      .upsert([{ calibre: formMunition.calibre, quantite: parseInt(formMunition.quantite) || 0, updated_at: new Date().toISOString() }], { onConflict: "calibre" });
    if (!error) {
      setOpenMunition(false);
      setFormMunition({ calibre: "", quantite: "" });
      router.refresh();
    }
    setLoadingMunition(false);
  };

  const handleDeleteMunition = async (id: string) => {
    await supabase.from("munitions").delete().eq("id", id);
    setMunitions((prev) => prev.filter((m) => m.id !== id));
    setConfirmingMunition(null);
  };

  // Matos
  const defaultFormMatos = { nom: "", categorie: "", quantite: "", unite: "unites", notes: "" };
  const [openMatos, setOpenMatos] = useState(false);
  const [loadingMatos, setLoadingMatos] = useState(false);
  const [editingMatos, setEditingMatos] = useState<StockMatos | null>(null);
  const [formMatos, setFormMatos] = useState(defaultFormMatos);
  const [confirmingMatos, setConfirmingMatos] = useState<string | null>(null);
  const categories = [...new Set(matos.map((m) => m.categorie))].sort();

  const openCreateMatos = () => { setEditingMatos(null); setFormMatos(defaultFormMatos); setOpenMatos(true); };
  const openEditMatos = (m: StockMatos) => {
    setEditingMatos(m);
    setFormMatos({ nom: m.nom, categorie: m.categorie, quantite: String(m.quantite), unite: m.unite, notes: m.notes ?? "" });
    setOpenMatos(true);
  };

  const handleSubmitMatos = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingMatos(true);
    const payload = {
      nom: formMatos.nom,
      categorie: formMatos.categorie,
      quantite: parseInt(formMatos.quantite) || 0,
      unite: formMatos.unite || "unites",
      notes: formMatos.notes || null,
      updated_at: new Date().toISOString(),
    };
    if (editingMatos) {
      const { data, error } = await supabase.from("stocks_matos").update(payload).eq("id", editingMatos.id).select().single();
      if (!error && data) { setMatos((prev) => prev.map((m) => (m.id === editingMatos.id ? (data as StockMatos) : m))); setOpenMatos(false); }
    } else {
      const { data, error } = await supabase.from("stocks_matos").insert([payload]).select().single();
      if (!error && data) { setMatos((prev) => [...prev, data as StockMatos].sort((a, b) => a.categorie.localeCompare(b.categorie) || a.nom.localeCompare(b.nom))); setOpenMatos(false); }
    }
    setLoadingMatos(false);
  };

  const handleDeleteMatos = async (id: string) => {
    await supabase.from("stocks_matos").delete().eq("id", id);
    setMatos((prev) => prev.filter((m) => m.id !== id));
    setConfirmingMatos(null);
  };

  const [activeCategory, setActiveCategory] = useState("__all__");
  const matosByCategory = matos.reduce((acc, m) => {
    if (!acc[m.categorie]) acc[m.categorie] = [];
    acc[m.categorie].push(m);
    return acc;
  }, {} as Record<string, StockMatos[]>);
  const sortedCategories = Object.keys(matosByCategory).sort();
  const visibleMatos = activeCategory === "__all__" ? matos : (matosByCategory[activeCategory] ?? []);

  // Ventes Weed
  const defaultFormVente = { variete: "og_kush" as ProduitWeed, quantite_g: "", prix_vente_g: "", vendeur_id: "", notes: "" };
  const [openVente, setOpenVente] = useState(false);
  const [loadingVente, setLoadingVente] = useState(false);
  const [formVente, setFormVente] = useState(defaultFormVente);
  const [confirmingVente, setConfirmingVente] = useState<string | null>(null);

  const computeAvgPrice = (variete: ProduitWeed, allVentes: VenteWeed[]): number | null => {
    const relevant = allVentes.filter((v) => v.variete === variete);
    if (relevant.length === 0) return null;
    const total = relevant.reduce((sum, v) => sum + v.prix_vente_g * v.quantite_g, 0);
    const totalQty = relevant.reduce((sum, v) => sum + v.quantite_g, 0);
    return totalQty > 0 ? total / totalQty : null;
  };

  const handleSubmitVente = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingVente(true);

    const payload = {
      variete: formVente.variete,
      quantite_g: parseFloat(formVente.quantite_g) || 0,
      prix_vente_g: parseFloat(formVente.prix_vente_g) || 0,
      vendeur_id: formVente.vendeur_id || null,
      notes: formVente.notes || null,
    };

    const { data: newVente, error: venteError } = await supabase
      .from("ventes_weed")
      .insert([payload])
      .select("*, membre:membres(pseudo)")
      .single();

    if (venteError || !newVente) { setLoadingVente(false); return; }

    const updatedVentes = [...ventes, newVente as VenteWeed];
    setVentes(updatedVentes);

    const avgPrice = computeAvgPrice(formVente.variete, updatedVentes);
    if (avgPrice !== null) {
      await supabase
        .from("stocks_drogue")
        .update({ prix_revente_g: Math.round(avgPrice * 100) / 100, updated_at: new Date().toISOString() })
        .eq("produit", formVente.variete);
      setStocks((prev) =>
        prev.map((s) =>
          s.produit === formVente.variete
            ? { ...s, prix_revente_g: Math.round(avgPrice * 100) / 100 }
            : s
        )
      );
    }

    const stockItem = stocks.find((s) => s.produit === formVente.variete);
    if (stockItem) {
      const newQty = Math.max(0, stockItem.quantite_g - payload.quantite_g);
      await supabase
        .from("stocks_drogue")
        .update({ quantite_g: newQty, updated_at: new Date().toISOString() })
        .eq("produit", formVente.variete);
      setStocks((prev) =>
        prev.map((s) =>
          s.produit === formVente.variete ? { ...s, quantite_g: newQty } : s
        )
      );
    }

    setOpenVente(false);
    setFormVente(defaultFormVente);
    setLoadingVente(false);
  };

  const handleDeleteVente = async (id: string) => {
    await supabase.from("ventes_weed").delete().eq("id", id);
    const removed = ventes.find((v) => v.id === id);
    const updatedVentes = ventes.filter((v) => v.id !== id);
    setVentes(updatedVentes);
    setConfirmingVente(null);

    if (removed) {
      const avgPrice = computeAvgPrice(removed.variete, updatedVentes);
      if (avgPrice !== null) {
        await supabase
          .from("stocks_drogue")
          .update({ prix_revente_g: Math.round(avgPrice * 100) / 100, updated_at: new Date().toISOString() })
          .eq("produit", removed.variete);
        setStocks((prev) =>
          prev.map((s) =>
            s.produit === removed.variete
              ? { ...s, prix_revente_g: Math.round(avgPrice * 100) / 100 }
              : s
          )
        );
      }
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="drogue">
        <TabsList>
          <TabsTrigger value="drogue">Drogue</TabsTrigger>
          <TabsTrigger value="ventes">
            <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
            Ventes Weed
            {ventes.length > 0 && (
              <span className="ml-1.5 rounded-full bg-green-500/20 px-1.5 py-0.5 text-xs text-green-400">
                {ventes.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="munitions">Munitions</TabsTrigger>
          <TabsTrigger value="materiel">Materiel</TabsTrigger>
        </TabsList>

        {/* Drogue */}
        <TabsContent value="drogue" className="mt-4 space-y-4">
          {canModifier && (
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => {
                  setFormDrogue({ produit: "og_kush", quantite_g: "", prix_achat_g: "", prix_revente_g: "", prix_graine: "", notes: "" });
                  setOpenDrogue(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
            </div>
          )}
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead className="text-right">Quantite</TableHead>
                  <TableHead className="text-right">Achat /g</TableHead>
                  <TableHead className="text-right">Revente /g</TableHead>
                  <TableHead className="text-right">Groupe -30%</TableHead>
                  <TableHead className="text-right">Marge</TableHead>
                  <TableHead className="text-right">Valeur</TableHead>
                  {canModifier && <TableHead className="w-[90px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {stocks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                      Aucun stock de drogue.
                    </TableCell>
                  </TableRow>
                ) : (
                  stocks.map((s) => {
                    const marge = (s.prix_revente_g ?? 0) - (s.prix_achat_g ?? 0);
                    const valeur = s.quantite_g * (s.prix_revente_g ?? 0);
                    const prixGroupe = (s.prix_revente_g ?? 0) * 0.7;
                    return (
                      <TableRow
                        key={s.id}
                        className={canModifier ? "cursor-pointer" : undefined}
                        onClick={
                          canModifier
                            ? (e) => {
                                if ((e.target as HTMLElement).closest("button")) return;
                                openEditDrogue(s);
                              }
                            : undefined
                        }
                      >
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <Badge variant="outline" className={produitColors[s.produit]}>
                              {produitLabels[s.produit]}
                            </Badge>
                            {s.produit === "og_kush" && s.prix_graine != null && (
                              <span className="text-xs text-muted-foreground pl-0.5">
                                Graine: {s.prix_graine}$
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">{s.quantite_g}g</TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">{s.prix_achat_g ?? 0}$</TableCell>
                        <TableCell className="text-right font-mono">
                          {s.prix_revente_g ?? 0}$
                          {WEED_VARIANTS.includes(s.produit as ProduitWeed) && ventes.some((v) => v.variete === s.produit) && (
                            <span className="ml-1 text-xs text-emerald-400/70">moy.</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-blue-400">
                          {prixGroupe.toFixed(2)}$
                        </TableCell>
                        <TableCell className={`text-right font-mono font-semibold ${marge >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {marge >= 0 ? "+" : ""}{marge.toFixed(2)}$
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-amber-400">
                          {new Intl.NumberFormat("fr-FR").format(valeur)}$
                        </TableCell>
                        {canModifier && (
                          <TableCell>
                            {confirmingDrogue === s.id ? (
                              <div className="flex gap-1">
                                <Button size="sm" variant="destructive" onClick={() => handleDeleteDrogue(s.id)}>Suppr.</Button>
                                <Button size="sm" variant="outline" onClick={() => setConfirmingDrogue(null)}>X</Button>
                              </div>
                            ) : (
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => openEditDrogue(s)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => setConfirmingDrogue(s.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
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
        </TabsContent>

        {/* Ventes Weed */}
        <TabsContent value="ventes" className="mt-4 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Chaque vente enregistree met a jour automatiquement le prix de revente moyen dans le stock.
              </p>
              <div className="flex flex-wrap gap-2">
                {WEED_VARIANTS.map((v) => {
                  const avg = computeAvgPrice(v, ventes);
                  if (avg === null) return null;
                  return (
                    <span key={v} className="rounded-full border border-border px-2.5 py-0.5 text-xs">
                      <span className={produitColors[v].split(" ")[1]}>{produitLabels[v]}</span>
                      <span className="ml-1 text-muted-foreground">moy. {avg.toFixed(2)}$/g</span>
                      <span className="ml-1 text-blue-400">— groupe {(avg * 0.7).toFixed(2)}$/g</span>
                    </span>
                  );
                })}
              </div>
            </div>
            {canModifier && (
              <Button size="sm" className="shrink-0" onClick={() => { setFormVente(defaultFormVente); setOpenVente(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Enregistrer une vente
              </Button>
            )}
          </div>

          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variete</TableHead>
                  <TableHead>Vendeur</TableHead>
                  <TableHead className="text-right">Qte</TableHead>
                  <TableHead className="text-right">Prix /g</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Date</TableHead>
                  {canModifier && <TableHead className="w-[90px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                      Aucune vente enregistree.
                    </TableCell>
                  </TableRow>
                ) : (
                  [...ventes]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((v) => (
                      <TableRow key={v.id}>
                        <TableCell>
                          <Badge variant="outline" className={produitColors[v.variete]}>
                            {produitLabels[v.variete]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {v.membre?.pseudo ?? (membres.find((m) => m.id === v.vendeur_id)?.pseudo ?? "—")}
                        </TableCell>
                        <TableCell className="text-right font-mono">{v.quantite_g}g</TableCell>
                        <TableCell className="text-right font-mono">{v.prix_vente_g}$</TableCell>
                        <TableCell className="text-right font-mono font-semibold text-amber-400">
                          {(v.quantite_g * v.prix_vente_g).toFixed(2)}$
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[160px] truncate">{v.notes ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(v.created_at).toLocaleDateString("fr-FR", {
                            day: "2-digit", month: "2-digit", year: "2-digit",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </TableCell>
                        {canModifier && (
                          <TableCell>
                            {confirmingVente === v.id ? (
                              <div className="flex gap-1">
                                <Button size="sm" variant="destructive" onClick={() => handleDeleteVente(v.id)}>Suppr.</Button>
                                <Button size="sm" variant="outline" onClick={() => setConfirmingVente(null)}>X</Button>
                              </div>
                            ) : (
                              <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => setConfirmingVente(v.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Munitions */}
        <TabsContent value="munitions" className="mt-4 space-y-4">
          {canModifier && (
            <div className="flex justify-end">
              <Button size="sm" onClick={() => { setFormMunition({ calibre: "", quantite: "" }); setOpenMunition(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
            </div>
          )}
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Calibre</TableHead>
                  <TableHead className="text-right">Quantite</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {munitions.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-10">Aucune munition en stock.</TableCell></TableRow>
                ) : (
                  munitions.map((m) => (
                    <TableRow
                      key={m.id}
                      className={canModifier ? "cursor-pointer" : undefined}
                      onClick={canModifier ? (e) => { if ((e.target as HTMLElement).closest("button")) return; openEditMunition(m); } : undefined}
                    >
                      <TableCell className="font-medium">{m.calibre}</TableCell>
                      <TableCell className="text-right font-mono">
                        <span className={m.quantite < 50 ? "text-red-400" : m.quantite < 200 ? "text-yellow-400" : "text-green-400"}>
                          {m.quantite.toLocaleString()} unites
                        </span>
                      </TableCell>
                      <TableCell>
                        {confirmingMunition === m.id ? (
                          <div className="flex gap-1">
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteMunition(m.id)}>Suppr.</Button>
                            <Button size="sm" variant="outline" onClick={() => setConfirmingMunition(null)}>X</Button>
                          </div>
                        ) : canModifier ? (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => openEditMunition(m)}><Pencil className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => setConfirmingMunition(m.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Materiel */}
        <TabsContent value="materiel" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {matos.length === 0
                ? "Aucun article enregistre."
                : `${matos.length} article${matos.length > 1 ? "s" : ""} — ${sortedCategories.length} categorie${sortedCategories.length > 1 ? "s" : ""}`}
            </p>
            {canModifier && (
              <Button size="sm" onClick={openCreateMatos}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
            )}
          </div>

          {matos.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-muted-foreground">
              <Package className="h-8 w-8 opacity-30" />
              <p className="text-sm">Cles Fleeka, disques durs, vis, cles USB…</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 border-b border-border pb-3">
                <button
                  onClick={() => setActiveCategory("__all__")}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                    activeCategory === "__all__"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "text-muted-foreground border-border hover:border-muted-foreground"
                  }`}
                >
                  Tout ({matos.length})
                </button>
                {sortedCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                      activeCategory === cat
                        ? "bg-primary text-primary-foreground border-primary"
                        : "text-muted-foreground border-border hover:border-muted-foreground"
                    }`}
                  >
                    {cat} ({matosByCategory[cat].length})
                  </button>
                ))}
              </div>

              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {activeCategory === "__all__" && <TableHead>Categorie</TableHead>}
                      <TableHead>Article</TableHead>
                      <TableHead className="text-right">Quantite</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleMatos.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">Aucun article dans cette categorie.</TableCell></TableRow>
                    ) : (
                      visibleMatos.map((m) => (
                        <TableRow
                          key={m.id}
                          className={canModifier ? "cursor-pointer" : undefined}
                          onClick={canModifier ? (e) => { if ((e.target as HTMLElement).closest("button")) return; openEditMatos(m); } : undefined}
                        >
                          {activeCategory === "__all__" && (
                            <TableCell>
                              <button
                                onClick={(e) => { e.stopPropagation(); setActiveCategory(m.categorie); }}
                                className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground hover:border-muted-foreground transition-all"
                              >
                                {m.categorie}
                              </button>
                            </TableCell>
                          )}
                          <TableCell className="font-medium">{m.nom}</TableCell>
                          <TableCell className="text-right font-mono">
                            <span className={m.quantite === 0 ? "text-red-400" : m.quantite < 5 ? "text-yellow-400" : "text-foreground"}>
                              {m.quantite} {m.unite}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{m.notes ?? "—"}</TableCell>
                          <TableCell>
                            {confirmingMatos === m.id ? (
                              <div className="flex gap-1">
                                <Button size="sm" variant="destructive" onClick={() => handleDeleteMatos(m.id)}>Suppr.</Button>
                                <Button size="sm" variant="outline" onClick={() => setConfirmingMatos(null)}>X</Button>
                              </div>
                            ) : canModifier ? (
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => openEditMatos(m)}><Pencil className="h-4 w-4" /></Button>
                                <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => setConfirmingMatos(m.id)}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog Drogue */}
      <Dialog open={openDrogue} onOpenChange={setOpenDrogue}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Stock de drogue</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmitDrogue} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Produit</Label>
              <Select value={formDrogue.produit} onValueChange={(v) => setFormDrogue({ ...formDrogue, produit: v as ProduitDrogue })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="og_kush">OG Kush</SelectItem>
                  <SelectItem value="purple_haze">Purple Haze</SelectItem>
                  <SelectItem value="white_widow">White Widow</SelectItem>
                  <SelectItem value="blue_dream">Blue Dream</SelectItem>
                  <SelectItem value="coke">Coke</SelectItem>
                  <SelectItem value="meth">Meth</SelectItem>
                  <SelectItem value="pills">Pills</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantite (grammes)</Label>
              <Input type="number" min={0} step="0.1" placeholder="0" value={formDrogue.quantite_g} onChange={(e) => setFormDrogue({ ...formDrogue, quantite_g: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prix achat /g ($)</Label>
                <Input type="number" min={0} step="0.01" placeholder="0" value={formDrogue.prix_achat_g} onChange={(e) => setFormDrogue({ ...formDrogue, prix_achat_g: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Prix revente /g ($)</Label>
                <Input type="number" min={0} step="0.01" placeholder="0" value={formDrogue.prix_revente_g} onChange={(e) => setFormDrogue({ ...formDrogue, prix_revente_g: e.target.value })} />
              </div>
            </div>
            {formDrogue.produit === "og_kush" && (
              <div className="space-y-2">
                <Label>Prix graine ($) <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
                <Input type="number" min={0} step="0.01" placeholder="0" value={formDrogue.prix_graine} onChange={(e) => setFormDrogue({ ...formDrogue, prix_graine: e.target.value })} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Notes..." value={formDrogue.notes} onChange={(e) => setFormDrogue({ ...formDrogue, notes: e.target.value })} rows={2} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenDrogue(false)}>Annuler</Button>
              <Button type="submit" disabled={loadingDrogue}>{loadingDrogue ? "Enregistrement..." : "Enregistrer"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Vente Weed */}
      <Dialog open={openVente} onOpenChange={setOpenVente}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Enregistrer une vente</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmitVente} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Variete</Label>
              <Select value={formVente.variete} onValueChange={(v) => setFormVente({ ...formVente, variete: v as ProduitWeed })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="og_kush">OG Kush</SelectItem>
                  <SelectItem value="purple_haze">Purple Haze</SelectItem>
                  <SelectItem value="white_widow">White Widow</SelectItem>
                  <SelectItem value="blue_dream">Blue Dream</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vendeur <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <Select value={formVente.vendeur_id} onValueChange={(v) => setFormVente({ ...formVente, vendeur_id: v ?? "" })}>
                <SelectTrigger><SelectValue placeholder="Selectionner un membre..." /></SelectTrigger>
                <SelectContent>
                  {membres.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.pseudo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantite vendue (g)</Label>
                <Input type="number" min={0.1} step="0.1" placeholder="0" value={formVente.quantite_g} onChange={(e) => setFormVente({ ...formVente, quantite_g: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Prix de vente /g ($)</Label>
                <Input type="number" min={0} step="0.01" placeholder="0" value={formVente.prix_vente_g} onChange={(e) => setFormVente({ ...formVente, prix_vente_g: e.target.value })} required />
              </div>
            </div>
            {formVente.quantite_g && formVente.prix_vente_g && (
              <div className="rounded-md bg-muted/30 px-3 py-2 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total vente</span>
                  <span className="font-mono font-semibold text-amber-400">
                    {(parseFloat(formVente.quantite_g) * parseFloat(formVente.prix_vente_g)).toFixed(2)}$
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prix groupe (-30%)</span>
                  <span className="font-mono text-blue-400">
                    {(parseFloat(formVente.prix_vente_g) * 0.7).toFixed(2)}$/g
                  </span>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Notes <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <Textarea placeholder="Client, lieu, remarques..." value={formVente.notes} onChange={(e) => setFormVente({ ...formVente, notes: e.target.value })} rows={2} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenVente(false)}>Annuler</Button>
              <Button type="submit" disabled={loadingVente}>{loadingVente ? "Enregistrement..." : "Enregistrer"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Munition */}
      <Dialog open={openMunition} onOpenChange={setOpenMunition}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Munitions</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmitMunition} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Calibre</Label>
              <Input placeholder="9mm, .308, 5.56, 12 gauge..." value={formMunition.calibre} onChange={(e) => setFormMunition({ ...formMunition, calibre: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Quantite (unites)</Label>
              <Input type="number" min={0} placeholder="0" value={formMunition.quantite} onChange={(e) => setFormMunition({ ...formMunition, quantite: e.target.value })} required />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenMunition(false)}>Annuler</Button>
              <Button type="submit" disabled={loadingMunition}>{loadingMunition ? "Enregistrement..." : "Enregistrer"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Matos */}
      <Dialog open={openMatos} onOpenChange={(v) => { if (!v) setOpenMatos(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingMatos ? `Modifier ${editingMatos.nom}` : "Nouvel article"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmitMatos} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Article *</Label>
              <Input placeholder="Ex: Disque dur 1To, Cle USB, Vis M6..." value={formMatos.nom} onChange={(e) => setFormMatos({ ...formMatos, nom: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Categorie *</Label>
              <Input placeholder="Ex: Fleeka, Superette, Electronique..." value={formMatos.categorie} onChange={(e) => setFormMatos({ ...formMatos, categorie: e.target.value })} list="cats-list" required />
              <datalist id="cats-list">{categories.map((c) => <option key={c} value={c} />)}</datalist>
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {categories.map((c) => (
                    <button key={c} type="button" onClick={() => setFormMatos({ ...formMatos, categorie: c })}
                      className={`rounded-full border px-2 py-0.5 text-xs transition-all ${formMatos.categorie === c ? "bg-primary/20 text-primary border-primary/30" : "text-muted-foreground border-border hover:border-muted-foreground"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantite *</Label>
                <Input type="number" min={0} placeholder="0" value={formMatos.quantite} onChange={(e) => setFormMatos({ ...formMatos, quantite: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Unite</Label>
                <Input placeholder="unites, pieces, sacs..." value={formMatos.unite} onChange={(e) => setFormMatos({ ...formMatos, unite: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <Textarea placeholder="Provenance, etat, remarques..." value={formMatos.notes} onChange={(e) => setFormMatos({ ...formMatos, notes: e.target.value })} rows={2} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenMatos(false)}>Annuler</Button>
              <Button type="submit" disabled={loadingMatos}>{loadingMatos ? "Enregistrement..." : "Enregistrer"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
