"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Rang, StatutMembre } from "@/types";
import { createLog } from "./logs";

export interface CreateMembreInput {
  email: string;
  password: string;
  pseudo: string;
  rang: Rang;
  statut: StatutMembre;
  points: number;
  date_recrutement: string;
  notes?: string;
}

export interface UpdateMembreInput {
  id: string;
  pseudo: string;
  rang: Rang;
  statut: StatutMembre;
  points: number;
  date_recrutement: string;
  notes?: string;
}

export async function createMembre(input: CreateMembreInput): Promise<{ error?: string }> {
  const admin = createAdminClient();

  // 1. Créer le compte Auth
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });

  if (authError) return { error: authError.message };

  const userId = authData.user.id;

  // 2. Insérer le membre (pas de trigger, on gère tout ici)
  const { error: dbError } = await admin
    .from("membres")
    .insert({
      user_id: userId,
      pseudo: input.pseudo,
      rang: input.rang,
      statut: input.statut,
      points: input.points,
      date_recrutement: input.date_recrutement,
      notes: input.notes ?? null,
    });

  if (dbError) {
    // Rollback: supprimer le user Auth si l'insert échoue
    await admin.auth.admin.deleteUser(userId);
    return { error: dbError.message };
  }

  await createLog({
    action: "membre.create",
    section: "membres",
    description: `Ajout du membre ${input.pseudo} (${input.rang})`,
    meta: { pseudo: input.pseudo, rang: input.rang },
  });

  return {};
}

export async function updateMembre(input: UpdateMembreInput): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("membres")
    .update({
      pseudo: input.pseudo,
      rang: input.rang,
      statut: input.statut,
      points: input.points,
      date_recrutement: input.date_recrutement,
      notes: input.notes ?? null,
    })
    .eq("id", input.id);

  if (error) return { error: error.message };

  await createLog({
    action: "membre.update",
    section: "membres",
    description: `Modification du membre ${input.pseudo} (${input.rang})`,
    meta: { id: input.id, pseudo: input.pseudo, rang: input.rang },
  });

  return {};
}
