"use client";

import { useState, useTransition } from "react";
import { Eye, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { upsertPermission } from "@/actions/permissions";
import { ALL_SECTIONS, RANGS_GERES, type PermissionsMap, type Section } from "@/types";

const SECTION_LABELS: Record<Section, string> = {
  dashboard:   "Dashboard",
  membres:     "Membres",
  contacts:    "Identités",
  plaques:     "Plaques",
  tresorerie:  "Trésorerie",
  operations:  "Opérations",
  armurerie:   "Armurerie",
  stocks:      "Stocks",
  business:    "Business",
  territoires: "Territoires",
  points:      "Points map",
};

interface Props {
  rang: string;
  email: string;
  allPermissions: Array<{ rang: string; section: string; peut_voir: boolean; peut_modifier: boolean }>;
}

export function ParametresClient({ rang, email, allPermissions }: Props) {
  const [tab, setTab] = useState<"compte" | "permissions">("compte");

  // ── Mot de passe ────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPwdPending, startPwdTransition] = useTransition();

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdMsg(null);

    if (newPassword !== confirmPassword) {
      setPwdMsg({ ok: false, text: "Les mots de passe ne correspondent pas." });
      return;
    }
    if (newPassword.length < 8) {
      setPwdMsg({ ok: false, text: "Le mot de passe doit faire au moins 8 caractères." });
      return;
    }

    startPwdTransition(async () => {
      const supabase = createClient();

      // Re-authenticate with current password before updating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (signInError) {
        setPwdMsg({ ok: false, text: "Mot de passe actuel incorrect." });
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPwdMsg({ ok: false, text: error.message });
      } else {
        setPwdMsg({ ok: true, text: "Mot de passe mis à jour avec succès !" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    });
  }

  // ── Permissions ─────────────────────────────────────────────
  // Build local state as a flat map { "rang::section": { peut_voir, peut_modifier } }
  const [permsState, setPermsState] = useState<
    Record<string, { peut_voir: boolean; peut_modifier: boolean }>
  >(() => {
    const map: Record<string, { peut_voir: boolean; peut_modifier: boolean }> = {};
    for (const r of RANGS_GERES) {
      for (const s of ALL_SECTIONS) {
        const found = allPermissions.find((p) => p.rang === r && p.section === s);
        map[`${r}::${s}`] = {
          peut_voir:     found?.peut_voir     ?? false,
          peut_modifier: found?.peut_modifier ?? false,
        };
      }
    }
    return map;
  });

  const [savingKey, setSavingKey] = useState<string | null>(null);

  async function handleToggle(
    r: string,
    s: Section,
    field: "peut_voir" | "peut_modifier"
  ) {
    const key = `${r}::${s}`;
    const current = permsState[key] ?? { peut_voir: false, peut_modifier: false };
    let next = { ...current, [field]: !current[field] };

    // Business rules: uncheck voir => also uncheck modifier; check modifier => also check voir
    if (field === "peut_voir" && !next.peut_voir) {
      next.peut_modifier = false;
    } else if (field === "peut_modifier" && next.peut_modifier) {
      next.peut_voir = true;
    }

    setPermsState((prev) => ({ ...prev, [key]: next }));
    setSavingKey(key);

    const { error } = await upsertPermission(r, s, next.peut_voir, next.peut_modifier);
    if (error) {
      // Revert on failure
      setPermsState((prev) => ({ ...prev, [key]: current }));
    }
    setSavingKey(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">Gérez votre compte et les accès de l&apos;organisation</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setTab("compte")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === "compte"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Mon compte
        </button>
        {rang === "Gérant" && (
          <button
            onClick={() => setTab("permissions")}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === "permissions"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Permissions
          </button>
        )}
      </div>

      {/* ── Mon compte ── */}
      {tab === "compte" && (
        <div className="max-w-md space-y-6">
          {/* Info */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-3">
            <h2 className="font-semibold">Informations du compte</h2>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Grade</span>
                <span className="font-medium">{rang}</span>
              </div>
            </div>
          </div>

          {/* Change password */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <div>
              <h2 className="font-semibold">Changer de mot de passe</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Votre mot de passe est temporaire — changez-le maintenant.
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="current-pwd">
                  Mot de passe actuel
                </label>
                <input
                  id="current-pwd"
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="new-pwd">
                  Nouveau mot de passe
                </label>
                <input
                  id="new-pwd"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Min. 8 caractères"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="confirm-pwd">
                  Confirmer le mot de passe
                </label>
                <input
                  id="confirm-pwd"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                />
              </div>

              {pwdMsg && (
                <p className={`text-sm ${pwdMsg.ok ? "text-green-600" : "text-destructive"}`}>
                  {pwdMsg.text}
                </p>
              )}

              <button
                type="submit"
                disabled={isPwdPending}
                className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
              >
                {isPwdPending ? "Mise à jour…" : "Mettre à jour le mot de passe"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Permissions ── */}
      {tab === "permissions" && rang === "Gérant" && (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Définissez ce que chaque grade peut voir et modifier. Les Gérants ont toujours un accès complet.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {RANGS_GERES.map((r) => (
              <div key={r} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-muted/40 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-sm tracking-wide">{r}</h3>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> Voir</span>
                    <span className="flex items-center gap-1"><Pencil className="h-3 w-3" /> Édit</span>
                  </div>
                </div>
                <div className="divide-y divide-border/60">
                  {ALL_SECTIONS.map((s) => {
                    const key = `${r}::${s}`;
                    const perm = permsState[key] ?? { peut_voir: false, peut_modifier: false };
                    const saving = savingKey === key;
                    return (
                      <div key={s} className="flex items-center justify-between px-4 py-2">
                        <span className="text-sm">{SECTION_LABELS[s]}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggle(r, s, "peut_voir")}
                            disabled={saving}
                            title="Voir"
                            className={`p-1.5 rounded-md transition-colors disabled:opacity-40 ${
                              perm.peut_voir
                                ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                                : "bg-muted text-muted-foreground/40 hover:text-muted-foreground"
                            }`}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggle(r, s, "peut_modifier")}
                            disabled={saving || !perm.peut_voir}
                            title="Modifier"
                            className={`p-1.5 rounded-md transition-colors disabled:opacity-40 ${
                              perm.peut_modifier
                                ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                : "bg-muted text-muted-foreground/40 hover:text-muted-foreground"
                            }`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Cliquez sur <Eye className="inline h-3 w-3" /> pour activer la visibilité, sur <Pencil className="inline h-3 w-3" /> pour la modification. Les changements sont sauvegardés automatiquement.
          </p>
        </div>
      )}
    </div>
  );
}
