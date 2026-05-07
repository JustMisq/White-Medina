"use client";

import { useState } from "react";
import type { Log } from "@/types";
import { ScrollText, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const SECTION_LABELS: Record<string, string> = {
  membres: "Membres",
  tresorerie: "Trésorerie",
  operations: "Opérations",
  contacts: "Identités",
  armurerie: "Armurerie",
  stocks: "Stocks",
  business: "Business",
  territoires: "Territoires",
  points: "Points Map",
  plaques: "Plaques",
  parametres: "Paramètres",
};

const ACTION_COLORS: Record<string, string> = {
  create: "text-green-400 bg-green-500/10 border-green-500/20",
  update: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  delete: "text-red-400 bg-red-500/10 border-red-500/20",
};

function getActionColor(action: string): string {
  for (const key of Object.keys(ACTION_COLORS)) {
    if (action.includes(key)) return ACTION_COLORS[key];
  }
  return "text-zinc-400 bg-zinc-500/10 border-zinc-500/20";
}

function getActionLabel(action: string): string {
  if (action.includes("create")) return "Ajout";
  if (action.includes("update")) return "Modif";
  if (action.includes("delete")) return "Suppression";
  return action;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function LogsClient({ logs }: { logs: Log[] }) {
  const [search, setSearch] = useState("");
  const [filterSection, setFilterSection] = useState<string>("all");

  const sections = Array.from(new Set(logs.map((l) => l.section))).sort();

  const filtered = logs.filter((log) => {
    const matchSearch =
      search === "" ||
      log.description.toLowerCase().includes(search.toLowerCase()) ||
      (log.auteur_pseudo ?? "").toLowerCase().includes(search.toLowerCase());
    const matchSection =
      filterSection === "all" || log.section === filterSection;
    return matchSearch && matchSection;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 border border-primary/20">
          <ScrollText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Logs d'activité</h1>
          <p className="text-sm text-muted-foreground">
            {logs.length} action{logs.length !== 1 ? "s" : ""} enregistrée{logs.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher une action, un auteur…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="relative flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Toutes les sections</option>
            {sections.map((s) => (
              <option key={s} value={s}>
                {SECTION_LABELS[s] ?? s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ScrollText className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Aucun log trouvé</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="divide-y divide-border">
            {filtered.map((log) => (
              <div
                key={log.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3 hover:bg-accent/30 transition-colors"
              >
                {/* Date */}
                <span className="text-[11px] text-muted-foreground font-mono shrink-0 sm:w-36">
                  {formatDate(log.created_at)}
                </span>

                {/* Badges */}
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      getActionColor(log.action)
                    )}
                  >
                    {getActionLabel(log.action)}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted/40">
                    {SECTION_LABELS[log.section] ?? log.section}
                  </span>
                </div>

                {/* Description */}
                <span className="flex-1 text-sm text-foreground">{log.description}</span>

                {/* Auteur */}
                {log.auteur_pseudo && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    par <span className="font-medium text-foreground">{log.auteur_pseudo}</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
