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
import { Plus, Trash2, Pencil, Package } from "lucide-react";
import type { StockDrogue, Munition, StockMatos, ProduitDrogue } from "@/types";

const produitColors: Record<ProduitDrogue, string> = {
  herbe: "bg-green-500/10 text-green-400 border-green-500/20",
  coke: "bg-slate-200/10 text-slate-200 border-slate-200/20",
  meth: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  pills: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  autre: "text-muted-foreground border-border",
};

const produitLabels: Record<ProduitDrogue, string> = {
  herbe: "Herbe",
  coke: "Coke",
  meth: "Meth",
  pills: "Pills",
  autre: "Autre",
};

interface StocksClientProps {
  stocks: StockDrogue[];
  munitions: Munition[];
  matos: StockMatos[];
}

export function StocksClient({ stocks: initialStocks, munitions: initialMunitions, matos: initialMatos }: StocksClientProps) {
  const [stocks, setStocks] = useState(initialStocks);
  const [munitions, setMunitions] = useState(initialMunitions);
  const [matos, setMatos] = useState(initialMatos);
  const router = useRouter();
  const supabase = createClient();

  // Drogue
  const [openDrogue, setOpenDrogue] = useState(false);
  const [loadingDrogue, setLoadingDrogue] = useState(false);
  const [formDrogue, setFormDrogue] = useState({ produit: "herbe" as ProduitDrogue, quantite_g: "", prix_achat_g: "", prix_revente_g: "", notes: "" });
  const [confirmingDrogue, setConfirmingDrogue] = useState<string | null>(null);

  const openEditDrogue = (s: StockDrogue) => {
    setFormDrogue({ produit: s.produit, quantite_g: String(s.quantite_g), prix_achat_g: s.prix_achat_g != null ? String(s.prix_achat_g) : "", prix_revente_g: s.prix_revente_g != null ? String(s.prix_revente_g) : "", notes: s.notes ?? "" });
    setOpenDrogue(true);
  };

  const handleSubmitDrogue = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingDrogue(true);
    const { error } = await supabase.from("stocks_drogue").upsert([{ produit: formDrogue.produit, quantite_g: parseFloat(formDrogue.quantite_g) || 0, prix_achat_g: parseFloat(formDrogue.prix_achat_g) || 0, prix_revente_g: parseFloat(formDrogue.prix_revente_g) || 0, notes: formDrogue.notes || null, updated_at: new Date().toISOString() }], { onConflict: "produit" });
    if (!error) { setOpenDrogue(false); setFormDrogue({ produit: "herbe", quantite_g: "", prix_achat_g: "", prix_revente_g: "", notes: "" }); router.refresh(); }
    setLoadingDrogue(false);
  };

  const handleDeleteDrogue = async (id: string) => {
    await supabase.from("stocks_drogue").delete().eq("id", id);
    setStocks(prev => prev.filter(s => s.id !== id));
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
    const { error } = await supabase.from("munitions").upsert([{ calibre: formMunition.calibre, quantite: parseInt(formMunition.quantite) || 0, updated_at: new Date().toISOString() }], { onConflict: "calibre" });
    if (!error) { setOpenMunition(false); setFormMunition({ calibre: "", quantite: "" }); router.refresh(); }
    setLoadingMunition(false);
  };

  const handleDeleteMunition = async (id: string) => {
    await supabase.from("munitions").delete().eq("id", id);
    setMunitions(prev => prev.filter(m => m.id !== id));
    setConfirmingMunition(null);
  };

  // Matos
  const defaultFormMatos = { nom: "", categorie: "", quantite: "", unite: "unites", notes: "" };
  const [openMatos, setOpenMatos] = useState(false);
  const [loadingMatos, setLoadingMatos] = useState(false);
  const [editingMatos, setEditingMatos] = useState<StockMatos | null>(null);
  const [formMatos, setFormMatos] = useState(defaultFormMatos);
  const [confirmingMatos, setConfirmingMatos] = useState<string | null>(null);
  const categories = [...new Set(matos.map(m => m.categorie))].sort();

  const openCreateMatos = () => { setEditingMatos(null); setFormMatos(defaultFormMatos); setOpenMatos(true); };
  const openEditMatos = (m: StockMatos) => {
    setEditingMatos(m);
    setFormMatos({ nom: m.nom, categorie: m.categorie, quantite: String(m.quantite), unite: m.unite, notes: m.notes ?? "" });
    setOpenMatos(true);
  };

  const handleSubmitMatos = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingMatos(true);
    const payload = { nom: formMatos.nom, categorie: formMatos.categorie, quantite: parseInt(formMatos.quantite) || 0, unite: formMatos.unite || "unites", notes: formMatos.notes || null, updated_at: new Date().toISOString() };
    if (editingMatos) {
      const { data, error } = await supabase.from("stocks_matos").update(payload).eq("id", editingMatos.id).select().single();
      if (!error && data) { setMatos(prev => prev.map(m => m.id === editingMatos.id ? data as StockMatos : m)); setOpenMatos(false); }
    } else {
      const { data, error } = await supabase.from("stocks_matos").insert([payload]).select().single();
      if (!error && data) { setMatos(prev => [...prev, data as StockMatos].sort((a, b) => a.categorie.localeCompare(b.categorie) || a.nom.localeCompare(b.nom))); setOpenMatos(false); }
    }
    setLoadingMatos(false);
  };

  const handleDeleteMatos = async (id: string) => {
    await supabase.from("stocks_matos").delete().eq("id", id);
    setMatos(prev => prev.filter(m => m.id !== id));
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

  return (
    <div className="space-y-4">
      <Tabs defaultValue="drogue">
        <TabsList>
          <TabsTrigger value="drogue">Drogue</TabsTrigger>
          <TabsTrigger value="munitions">Munitions</TabsTrigger>
          <TabsTrigger value="materiel">Matériel</TabsTrigger>
        </TabsList>

        <TabsContent value="drogue" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setFormDrogue({ produit: "herbe", quantite_g: "", prix_achat_g: "", prix_revente_g: "", notes: "" }); setOpenDrogue(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
          </div>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead className="text-right">Quantite</TableHead>
                  <TableHead className="text-right">Achat /g</TableHead>
                  <TableHead className="text-right">Revente /g</TableHead>
                  <TableHead className="text-right">Marge</TableHead>
                  <TableHead className="text-right">Valeur</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stocks.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">Aucun stock de drogue.</TableCell></TableRow>
                ) : stocks.map((s) => {
                  const marge = (s.prix_revente_g ?? 0) - (s.prix_achat_g ?? 0);
                  const valeur = s.quantite_g * (s.prix_revente_g ?? 0);
                  return (
                    <TableRow key={s.id} className="cursor-pointer" onClick={(e) => { if ((e.target as HTMLElement).closest("button")) return; openEditDrogue(s); }}>
                      <TableCell><Badge variant="outline" className={produitColors[s.produit]}>{produitLabels[s.produit]}</Badge></TableCell>
                      <TableCell className="text-right font-mono">{s.quantite_g}g</TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">{s.prix_achat_g ?? 0}$</TableCell>
                      <TableCell className="text-right font-mono">{s.prix_revente_g ?? 0}$</TableCell>
                      <TableCell className={`text-right font-mono font-semibold ${marge >= 0 ? "text-green-400" : "text-red-400"}`}>{marge >= 0 ? "+" : ""}{marge.toFixed(2)}$</TableCell>
                      <TableCell className="text-right font-mono font-semibold text-amber-400">{new Intl.NumberFormat("fr-FR").format(valeur)}$</TableCell>
                      <TableCell>
                        {confirmingDrogue === s.id ? (
                          <div className="flex gap-1">
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteDrogue(s.id)}>Suppr.</Button>
                            <Button size="sm" variant="outline" onClick={() => setConfirmingDrogue(null)}>X</Button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => openEditDrogue(s)}><Pencil className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => setConfirmingDrogue(s.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="munitions" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setFormMunition({ calibre: "", quantite: "" }); setOpenMunition(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
          </div>
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
                ) : munitions.map((m) => (
                  <TableRow key={m.id} className="cursor-pointer" onClick={(e) => { if ((e.target as HTMLElement).closest("button")) return; openEditMunition(m); }}>
                    <TableCell className="font-medium">{m.calibre}</TableCell>
                    <TableCell className="text-right font-mono">
                      <span className={m.quantite < 50 ? "text-red-400" : m.quantite < 200 ? "text-yellow-400" : "text-green-400"}>{m.quantite.toLocaleString()} unites</span>
                    </TableCell>
                    <TableCell>
                      {confirmingMunition === m.id ? (
                        <div className="flex gap-1">
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteMunition(m.id)}>Suppr.</Button>
                          <Button size="sm" variant="outline" onClick={() => setConfirmingMunition(null)}>X</Button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => openEditMunition(m)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => setConfirmingMunition(m.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="materiel" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {matos.length === 0
                ? "Aucun article enregistré."
                : `${matos.length} article${matos.length > 1 ? "s" : ""} — ${sortedCategories.length} catégorie${sortedCategories.length > 1 ? "s" : ""}`}
            </p>
            <Button size="sm" onClick={openCreateMatos}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
          </div>

          {matos.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-muted-foreground">
              <Package className="h-8 w-8 opacity-30" />
              <p className="text-sm">Clés Fleeka, disques durs, vis, clés USB…</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Category tabs */}
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
                {sortedCategories.map(cat => (
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

              {/* Items table */}
              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {activeCategory === "__all__" && <TableHead>Catégorie</TableHead>}
                      <TableHead>Article</TableHead>
                      <TableHead className="text-right">Quantité</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleMatos.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">Aucun article dans cette catégorie.</TableCell></TableRow>
                    ) : visibleMatos.map((m) => (
                      <TableRow key={m.id} className="cursor-pointer" onClick={(e) => { if ((e.target as HTMLElement).closest("button")) return; openEditMatos(m); }}>
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
                          ) : (
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => openEditMatos(m)}><Pencil className="h-4 w-4" /></Button>
                              <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => setConfirmingMatos(m.id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={openDrogue} onOpenChange={setOpenDrogue}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Stock de drogue</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmitDrogue} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Produit</Label>
              <Select value={formDrogue.produit} onValueChange={(v) => setFormDrogue({ ...formDrogue, produit: v as ProduitDrogue })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="herbe" label="Herbe">Herbe</SelectItem>
                  <SelectItem value="coke" label="Coke">Coke</SelectItem>
                  <SelectItem value="meth" label="Meth">Meth</SelectItem>
                  <SelectItem value="pills" label="Pills">Pills</SelectItem>
                  <SelectItem value="autre" label="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantite (grammes)</Label>
              <Input type="number" min={0} step="0.1" placeholder="0" value={formDrogue.quantite_g} onChange={e => setFormDrogue({ ...formDrogue, quantite_g: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prix achat /g ($)</Label>
                <Input type="number" min={0} step="0.01" placeholder="0" value={formDrogue.prix_achat_g} onChange={e => setFormDrogue({ ...formDrogue, prix_achat_g: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Prix revente /g ($)</Label>
                <Input type="number" min={0} step="0.01" placeholder="0" value={formDrogue.prix_revente_g} onChange={e => setFormDrogue({ ...formDrogue, prix_revente_g: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Notes..." value={formDrogue.notes} onChange={e => setFormDrogue({ ...formDrogue, notes: e.target.value })} rows={2} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenDrogue(false)}>Annuler</Button>
              <Button type="submit" disabled={loadingDrogue}>{loadingDrogue ? "Enregistrement..." : "Enregistrer"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openMunition} onOpenChange={setOpenMunition}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Munitions</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmitMunition} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Calibre</Label>
              <Input placeholder="9mm, .308, 5.56, 12 gauge..." value={formMunition.calibre} onChange={e => setFormMunition({ ...formMunition, calibre: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Quantite (unites)</Label>
              <Input type="number" min={0} placeholder="0" value={formMunition.quantite} onChange={e => setFormMunition({ ...formMunition, quantite: e.target.value })} required />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenMunition(false)}>Annuler</Button>
              <Button type="submit" disabled={loadingMunition}>{loadingMunition ? "Enregistrement..." : "Enregistrer"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openMatos} onOpenChange={(v) => { if (!v) setOpenMatos(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingMatos ? `Modifier ${editingMatos.nom}` : "Nouvel article"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmitMatos} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Article *</Label>
              <Input placeholder="Ex: Disque dur 1To, Clé USB, Vis M6..." value={formMatos.nom} onChange={e => setFormMatos({ ...formMatos, nom: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Categorie *</Label>
              <Input placeholder="Ex: Fleeka, Superette, Electronique..." value={formMatos.categorie} onChange={e => setFormMatos({ ...formMatos, categorie: e.target.value })} list="cats-list" required />
              <datalist id="cats-list">{categories.map(c => <option key={c} value={c} />)}</datalist>
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {categories.map(c => (
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
                <Input type="number" min={0} placeholder="0" value={formMatos.quantite} onChange={e => setFormMatos({ ...formMatos, quantite: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Unite</Label>
                <Input placeholder="unites, pieces, sacs..." value={formMatos.unite} onChange={e => setFormMatos({ ...formMatos, unite: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <Textarea placeholder="Provenance, etat, remarques..." value={formMatos.notes} onChange={e => setFormMatos({ ...formMatos, notes: e.target.value })} rows={2} />
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
