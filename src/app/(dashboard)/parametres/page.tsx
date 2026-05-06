import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllPermissions } from "@/actions/permissions";
import { ParametresClient } from "@/components/parametres/parametres-client";

export default async function ParametresPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membre } = await supabase
    .from("membres")
    .select("rang")
    .eq("user_id", user.id)
    .single();

  const rang = membre?.rang ?? "Nova";
  const email = user.email ?? "";

  const { data: allPerms } = await getAllPermissions();

  return (
    <ParametresClient
      rang={rang}
      email={email}
      allPermissions={allPerms ?? []}
    />
  );
}
