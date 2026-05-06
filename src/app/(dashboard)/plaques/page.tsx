import { createClient } from "@/lib/supabase/server";
import type { Plaque, Contact } from "@/types";
import { PlaquesClient } from "@/components/plaques/plaques-client";
import { Card, CardContent } from "@/components/ui/card";

export default async function PlaquesPage() {
  const supabase = await createClient();

  const [{ data: plaques }, { data: contacts }] = await Promise.all([
    supabase.from("plaques").select("*").order("created_at", { ascending: false }),
    supabase.from("contacts").select("id, pseudo").order("pseudo"),
  ]);

  const plaquesData = (plaques as Plaque[] | null) ?? [];
  const contactsData = (contacts as Pick<Contact, "id" | "pseudo">[] | null) ?? [];

  const total = plaquesData.length;
  const volees = plaquesData.filter((p) => p.statut === "volée").length;
  const fausses = plaquesData.filter((p) => p.statut === "fausse").length;
  const legales = plaquesData.filter((p) => p.statut === "légale").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Plaques d&apos;immatriculation</h1>
        <p className="text-muted-foreground">Véhicules connus et immatriculations surveillées</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-sm text-muted-foreground">Plaques enregistrées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-400">{legales}</div>
            <p className="text-sm text-muted-foreground">Légales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-400">{volees}</div>
            <p className="text-sm text-muted-foreground">Volées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-400">{fausses}</div>
            <p className="text-sm text-muted-foreground">Fausses</p>
          </CardContent>
        </Card>
      </div>

      <PlaquesClient plaques={plaquesData} contacts={contactsData} />
    </div>
  );
}
