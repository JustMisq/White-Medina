import type { Contact, Tag } from "@/types";
import { createClient } from "@/lib/supabase/server";
import { AddContactDialog } from "@/components/contacts/add-contact-dialog";
import { ManageTagsDialog } from "@/components/contacts/manage-tags-dialog";
import { ContactsTable } from "@/components/contacts/contacts-table";

export default async function ContactsPage() {
  const supabase = await createClient();
  const [{ data: tags }, { data: contacts }] = await Promise.all([
    supabase.from("tags").select("*").order("nom"),
    supabase.from("contacts").select("*").order("pseudo"),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Identités</h1>
          <p className="text-muted-foreground">
            {contacts?.length ?? 0} identité{(contacts?.length ?? 0) > 1 ? "s" : ""} enregistrée{(contacts?.length ?? 0) > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <ManageTagsDialog tags={tags as Tag[] ?? []} />
          <AddContactDialog tags={tags as Tag[] ?? []} />
        </div>
      </div>

      <ContactsTable
        contacts={contacts as Contact[] ?? []}
        tags={tags as Tag[] ?? []}
      />
    </div>
  );
}
