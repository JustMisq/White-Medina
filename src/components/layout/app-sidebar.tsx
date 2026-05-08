"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookUser,
  Wallet,
  Swords,
  LogOut,
  Crosshair,
  FlaskConical,
  Building2,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Membre, Rang } from "@/types";

const navMain = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/membres", label: "Membres", icon: Users },
  { href: "/contacts", label: "Identités", icon: BookUser },
  { href: "/tresorerie", label: "Trésorerie", icon: Wallet },
  { href: "/operations", label: "Opérations", icon: Swords },
];

const navIllegal = [
  { href: "/armurerie", label: "Armurerie", icon: Crosshair },
  { href: "/stocks", label: "Stocks illégaux", icon: FlaskConical },
  { href: "/business", label: "Business", icon: Building2 },
  { href: "/territoires", label: "Territoires", icon: MapPin },
];

const rangColors: Partial<Record<Rang, string>> = {
  "Gérant":        "bg-red-600 text-white",
  "Bras Droit":    "bg-red-500 text-white",
  "Grand":         "bg-orange-500 text-white",
  "Dealer":        "bg-yellow-500 text-black",
  "Petite Frappe": "bg-blue-500 text-white",
  "Nova":          "bg-gray-500 text-white",
};

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [membre, setMembre] = useState<Pick<Membre, "pseudo" | "rang"> | null>(null);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("membres")
        .select("pseudo, rang")
        .eq("user_id", user.id)
        .single();
      if (data) setMembre(data as Pick<Membre, "pseudo" | "rang">);
    })();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-border">
        {logoError ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/30">
            <span className="text-sm font-black text-white tracking-tight">WM</span>
          </div>
        ) : (
          // Remplace /logo.png dans le dossier public/ par ton image
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/logo.png"
            alt="White Medina"
            className="h-9 w-9 rounded-lg object-contain"
            onError={() => setLogoError(true)}
          />
        )}
        <div>
          <p className="text-sm font-bold leading-none text-foreground">White Medina</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Gang Management</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {navMain.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
              {label}
            </Link>
          );
        })}

        <div className="px-3 pt-4 pb-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Illégal</p>
        </div>

        {navIllegal.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3 space-y-1">
        {membre && (
          <div className="flex items-center gap-2.5 rounded-md px-3 py-2 mb-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
              {membre.pseudo.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-none text-foreground">{membre.pseudo}</p>
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${rangColors[membre.rang] ?? "bg-gray-500 text-white"}`}>
                {membre.rang}
              </span>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
