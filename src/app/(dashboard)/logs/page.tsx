import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LogsClient } from "@/components/logs/logs-client";
import type { Log } from "@/types";

export default async function LogsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Vérification des droits : Gérant ou Bras Droit uniquement
  const { data: moi } = await supabase
    .from("membres")
    .select("rang")
    .eq("user_id", user.id)
    .single();

  if (!moi || !["Gérant", "Bras Droit"].includes(moi.rang)) {
    redirect("/");
  }

  const { data: logs } = await supabase
    .from("logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  return <LogsClient logs={(logs as Log[]) ?? []} />;
}
