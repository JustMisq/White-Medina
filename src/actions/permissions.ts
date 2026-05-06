"use server";

import { createClient } from "@/lib/supabase/server";

async function assertGerant() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: membre } = await supabase
    .from("membres")
    .select("rang")
    .eq("user_id", user.id)
    .single();

  if (!membre || membre.rang !== "Gérant") throw new Error("Permission refusée");
  return supabase;
}

export async function upsertPermission(
  rang: string,
  section: string,
  peut_voir: boolean,
  peut_modifier: boolean
): Promise<{ error?: string }> {
  try {
    const supabase = await assertGerant();
    const { error } = await supabase
      .from("permissions_rang")
      .upsert(
        { rang, section, peut_voir, peut_modifier: peut_voir ? peut_modifier : false },
        { onConflict: "rang,section" }
      );
    if (error) return { error: error.message };
    return {};
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function getAllPermissions(): Promise<{
  data?: Array<{ rang: string; section: string; peut_voir: boolean; peut_modifier: boolean }>;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { data, error } = await supabase
    .from("permissions_rang")
    .select("rang, section, peut_voir, peut_modifier")
    .order("rang")
    .order("section");

  if (error) return { error: error.message };
  return { data: data ?? [] };
}
