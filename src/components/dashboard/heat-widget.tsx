"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flame, Plus, Minus } from "lucide-react";
import type { HeatEvent } from "@/types";

interface HeatWidgetProps {
  initialHeat: number;
  recentEvents: HeatEvent[];
}

export function HeatWidget({ initialHeat, recentEvents }: HeatWidgetProps) {
  const heat = Math.max(0, Math.min(100, initialHeat));
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ description: "", impact: "10", type: "hausse" as "hausse" | "baisse" });
  const router = useRouter();
  const supabase = createClient();

  const heatColor =
    heat >= 80 ? "text-red-500" :
    heat >= 60 ? "text-orange-400" :
    heat >= 40 ? "text-yellow-400" :
    "text-green-400";

  const barColor =
    heat >= 80 ? "bg-red-500" :
    heat >= 60 ? "bg-orange-400" :
    heat >= 40 ? "bg-yellow-400" :
    "bg-green-400";

  const heatLabel =
    heat >= 80 ? "CRITIQUE" :
    heat >= 60 ? "Élevée" :
    heat >= 40 ? "Modérée" :
    "Faible";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const impact = parseInt(form.impact) * (form.type === "baisse" ? -1 : 1);
    await supabase.from("heat_events").insert([{ description: form.description, impact }]);
    setOpen(false);
    setForm({ description: "", impact: "10", type: "hausse" });
    router.refresh();
    setLoading(false);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Flame className={`h-4 w-4 ${heatColor}`} />
              Pression policière
            </CardTitle>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" onClick={() => setOpen(true)}>
              <Plus className="h-3 w-3" />
              Évènement
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end justify-between">
            <span className={`text-3xl font-bold ${heatColor}`}>{heat}</span>
            <span className={`text-sm font-semibold ${heatColor}`}>{heatLabel}</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${heat}%` }}
            />
          </div>
          {recentEvents.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-border">
              {recentEvents.slice(0, 3).map((ev) => (
                <div key={ev.id} className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="truncate">{ev.description}</span>
                  <span className={`shrink-0 font-mono font-semibold ${ev.impact > 0 ? "text-red-400" : "text-green-400"}`}>
                    {ev.impact > 0 ? "+" : ""}{ev.impact}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Ajouter un évènement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setForm({ ...form, type: "hausse" })}
                className={`flex-1 py-2 text-sm font-medium transition-colors border-r border-border flex items-center justify-center gap-1.5 ${
                  form.type === "hausse" ? "bg-red-500/20 text-red-400" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Flame className="h-3.5 w-3.5" /> Hausse
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, type: "baisse" })}
                className={`flex-1 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  form.type === "baisse" ? "bg-green-500/20 text-green-400" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Minus className="h-3.5 w-3.5" /> Baisse
              </button>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Ex: Témoin lors du braquage, Flic soudoyé..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Impact (points, 1–100)</Label>
              <Input
                type="number"
                min={1}
                max={100}
                placeholder="10"
                value={form.impact}
                onChange={e => setForm({ ...form, impact: e.target.value })}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={loading}>{loading ? "Enregistrement..." : "Enregistrer"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
