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
import { Trash2, Loader2 } from "lucide-react";
import { EditContactDialog } from "@/components/contacts/edit-contact-dialog";
import type { Contact, Tag } from "@/types";

function Etoiles({ n }: { n: number }) {
  return (
    <span className="text-sm">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < n ? "text-yellow-400" : "text-muted-foreground/30"}>
          ★
        </span>
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
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-destructive"
        onClick={() => setOpen(true)}
      >
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
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
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
  canModifier?: boolean;
}

export function ContactsTable({ contacts, tags, canModifier = true }: ContactsTableProps) {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const tagMap = new Map(tags.map((t) => [t.nom, t]));

  return (
    <>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pseudo</TableHead>
          <TableHead>Faction</TableHead>
          <TableHead>Tags</TableHead>
          <TableHead>Fiabilité</TableHead>
          <TableHead>Notes</TableHead>
          {canModifier && <TableHead className="w-20"></TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {contacts.length > 0 ? (
          contacts.map((c) => (
            <TableRow
              key={c.id}
              className={canModifier ? "cursor-pointer" : undefined}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("button")) return;
                if (canModifier) setSelectedContact(c);
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
                        style={
                          tag
                            ? {
                                borderColor: tag.couleur + "50",
                                color: tag.couleur,
                                backgroundColor: tag.couleur + "15",
                              }
                            : {}
                        }
                      >
                        {t}
                      </span>
                    );
                  })}
                  {c.tags.length === 0 && (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Etoiles n={c.fiabilite} />
              </TableCell>
              <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                {c.notes ?? "—"}
              </TableCell>
              {canModifier && (
                <TableCell>
                  <div className="flex items-center gap-1">
                    <EditContactDialog contact={c} tags={tags} />
                    <DeleteContactButton contact={c} />
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
              Aucune identité enregistrée — clique sur &quot;Ajouter une identité&quot;
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>

    {/* Controlled edit dialog triggered by row click */}
    {selectedContact && canModifier && (
      <EditContactDialog
        contact={selectedContact}
        tags={tags}
        open={selectedContact !== null}
        onOpenChange={(v) => { if (!v) setSelectedContact(null); }}
      />
    )}
    </>
  );
}
