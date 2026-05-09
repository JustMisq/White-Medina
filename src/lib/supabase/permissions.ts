import { createClient } from "@/lib/supabase/server";

export async function getCanModifier(section: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: membre } = await supabase
    .from("membres")
    .select("rang")
    .eq("user_id", user.id)
    .single();

  if (!membre) return false;
  if (membre.rang === "Gérant") return true;
  if (membre.rang === "Staff") return false;

  const { data: perm } = await supabase
    .from("permissions_rang")
    .select("peut_modifier")
    .eq("rang", membre.rang)
    .eq("section", section)
    .single();

  return perm?.peut_modifier ?? false;
}
