"use server";

import { createClient } from "@/lib/supabase/server";

export interface CreateLogInput {
  action: string;
  section: string;
  description: string;
  meta?: Record<string, unknown>;
}

/**
 * Insère un log d'action. À appeler depuis les server actions après chaque
 * opération importante. Ne lève pas d'erreur si le log échoue (non-bloquant).
 */
export async function createLog(input: CreateLogInput): Promise<void> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: membre } = await supabase
      .from("membres")
      .select("id, pseudo")
      .eq("user_id", user.id)
      .single();

    await supabase.from("logs").insert({
      action: input.action,
      section: input.section,
      description: input.description,
      auteur_id: membre?.id ?? null,
      auteur_pseudo: membre?.pseudo ?? null,
      meta: input.meta ?? {},
    });
  } catch {
    // Non-bloquant : on ne propage pas l'erreur
  }
}
