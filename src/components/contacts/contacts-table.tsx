"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Loader2, Search, LayoutList, LayoutGrid, X } from "lucide-react";
import { EditContactDialog } from "@/components/contacts/edit-contact-dialog";
import type { Contact, Tag } from "@/types";

function Etoiles({ n }: { n: number }) {
  return (
    <span className="text-sm">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < n ? "text-yellow-400" : "text-muted-foreground/30"}>★</span>
      ))}
    </span>
  );
}

function DeleteContactButton({ contact }: { contact: Contact }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleDelete = async () => {
    setLoading(true);
    await supabase.from("contacts").delete().eq("id", contact.id);
    setOpen(false);
    router.refresh();
    setLoading(false);
  };

  return (
    <>
      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setOpen(true)}>
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer {contact.pseudo} ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Cette action est irréversible. L&apos;identité sera définitivement supprimée.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Suppression...</> : "Supprimer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface ContactsTableProps {
  contacts: Contact[];
  tags: Tag[];
}

export function ContactsTable({ contacts, tags }: ContactsTableProps) {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const tagMap = new Map(tags.map((t) => [t.nom, t]));

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      q === "" ||
      c.pseudo.toLowerCase().includes(q) ||
      (c.faction ?? "").toLowerCase().includes(q) ||
      (c.notes ?? "").toLowerCase().includes(q);
    const matchTag = activeTag === null || c.tags.includes(activeTag);
    return matchSearch && matchTag;
  });

  return (
    <div className="space-y-4">
      {/* Search bar + view toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Rechercher par pseudo, faction, notes…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex rounded-md border border-border overflow-hidden shrink-0">
          <button
            onClick={() => setViewMode("table")}
            title="Vue liste"
            className={`px-3 py-2 transition-colors ${viewMode === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <LayoutList className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            title="Vue grille"
            className={`px-3 py-2 border-l border-border transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tag filters */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const active = activeTag === tag.nom;
            return (
              <button
                key={tag.id}
                onClick={() => setActiveTag(active ? null : tag.nom)}
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border transition-all ${active ? "opacity-100 scale-105" : "opacity-60 hover:opacity-100"}`}
                style={{
                  borderColor: tag.couleur + (active ? "cc" : "50"),
                  color: tag.couleur,
                  backgroundColor: tag.couleur + (active ? "30" : "15"),
                }}
              >
                {tag.nom}
                {active && <X className="h-2.5 w-2.5" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Count */}
      <p className="text-xs text-muted-foreground">
        {filtered.length}{filtered.length !== contacts.length && ` / ${contacts.length}`} identité{contacts.length > 1 ? "s" : ""}
        {(search || activeTag) ? " filtrées" : ""}
      </p>

      {/* Table view */}
      {viewMode === "table" ? (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pseudo</TableHead>
                <TableHead>Faction</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Fiabilité</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? (
                filtered.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest("button")) return;
                      setSelectedContact(c);
                    }}
                  >
                    <TableCell className="font-medium">{c.pseudo}</TableCell>
                    <TableCell className="text-muted-foreground">{c.faction ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {c.tags.map((t) => {
                          const tag = tagMap.get(t);
                          return (
                            <span
                              key={t}
                              className="rounded-full px-2 py-0.5 text-xs font-medium border"
                              style={tag ? { borderColor: tag.couleur + "50", color: tag.couleur, backgroundColor: tag.couleur + "15" } : {}}
                            >
                              {t}
                            </span>
                          );
                        })}
                        {c.tags.length === 0 && <span className="text-muted-foreground text-xs">—</span>}
                      </div>
                    </TableCell>
                    <TableCell><Etoiles n={c.fiabilite} /></TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{c.notes ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <EditContactDialog contact={c} tags={tags} />
                        <DeleteContactButton contact={c} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    Aucune identité ne correspond aux filtres.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        /* Grid view */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.length > 0 ? (
            filtered.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-border bg-card flex flex-col gap-3 p-4 cursor-pointer hover:shadow-sm transition-all"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("button")) return;
                  setSelectedContact(c);
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-9 w-9 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {c.pseudo.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{c.pseudo}</p>
                      {c.faction && <p className="text-xs text-muted-foreground truncate">{c.faction}</p>}
                    </div>
                  </div>
                  <Etoiles n={c.fiabilite} />
                </div>

                {/* Tags */}
                {c.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {c.tags.map((t) => {
                      const tag = tagMap.get(t);
                      return (
                        <span
                          key={t}
                          className="rounded-full px-2 py-0.5 text-xs font-medium border"
                          style={tag ? { borderColor: tag.couleur + "50", color: tag.couleur, backgroundColor: tag.couleur + "15" } : {}}
                        >
                          {t}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Notes */}
                {c.notes && <p className="text-xs text-muted-foreground line-clamp-2">{c.notes}</p>}

                {/* Actions */}
                <div className="flex items-center gap-1 mt-auto pt-2 border-t border-border/50">
                  <EditContactDialog contact={c} tags={tags} />
                  <DeleteContactButton contact={c} />
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-muted-foreground py-10 text-sm">
              Aucune identité ne correspond aux filtres.
            </div>
          )}
        </div>
      )}

      {/* Edit dialog on row/card click */}
      {selectedContact && (
        <EditContactDialog
          contact={selectedContact}
          tags={tags}
          open={selectedContact !== null}
          onOpenChange={(v) => { if (!v) setSelectedContact(null); }}
        />
      )}
    </div>
  );
}
