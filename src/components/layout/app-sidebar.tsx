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
  KeyRound,
  Car,
  Settings,
  Menu,
  X,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import type { Rang } from "@/types";

const navMain = [
  { href: "/",           label: "Dashboard",   icon: LayoutDashboard, section: "dashboard"   },
  { href: "/membres",    label: "Membres",     icon: Users,           section: "membres"     },
  { href: "/contacts",   label: "Identités",   icon: BookUser,        section: "contacts"    },
  { href: "/plaques",    label: "Plaques",     icon: Car,             section: "plaques"     },
  { href: "/tresorerie", label: "Trésorerie",  icon: Wallet,          section: "tresorerie"  },
  { href: "/operations", label: "Opérations",  icon: Swords,          section: "operations"  },
];

const navIllegal = [
  { href: "/armurerie",   label: "Armurerie",       icon: Crosshair,    section: "armurerie"   },
  { href: "/stocks",      label: "Stocks illégaux", icon: FlaskConical, section: "stocks"      },
  { href: "/business",    label: "Business",         icon: Building2,    section: "business"    },
  { href: "/territoires", label: "Territoires",      icon: MapPin,       section: "territoires" },
  { href: "/points",      label: "Points de la Map", icon: KeyRound,     section: "points"      },
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
  const [pseudo, setPseudo] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { rang, permissions, loading: permsLoading } = usePermissions();

  // Ferme le menu mobile lors de la navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("membres")
        .select("pseudo")
        .eq("user_id", user.id)
        .single();
      if (data) setPseudo(data.pseudo);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const isGerant = rang === "Gérant";
  const isBrasDroit = rang === "Bras Droit";

  function isVisible(section: string): boolean {
    if (permsLoading) return true; // avoid flicker while loading
    if (isGerant) return true;
    return (permissions as Record<string, { peut_voir: boolean } | undefined>)?.[section]?.peut_voir ?? false;
  }

  const visibleMain    = navMain.filter((item) => isVisible(item.section));
  const visibleIllegal = navIllegal.filter((item) => isVisible(item.section));
  const canSeeLogsSection = isGerant || isBrasDroit;

  const sidebarContent = (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-border shrink-0">
        {logoError ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/30">
            <span className="text-sm font-black text-white tracking-tight">WM</span>
          </div>
        ) : (
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
        {visibleMain.map(({ href, label, icon: Icon }) => {
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

        {visibleIllegal.length > 0 && (
          <>
            <div className="px-3 pt-4 pb-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Illégal</p>
            </div>

            {visibleIllegal.map(({ href, label, icon: Icon }) => {
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
          </>
        )}

        {canSeeLogsSection && (
          <>
            <div className="px-3 pt-4 pb-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Admin</p>
            </div>
            <Link
              href="/logs"
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all",
                pathname === "/logs"
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <ScrollText className={cn("h-4 w-4 shrink-0", pathname === "/logs" && "text-primary")} />
              Logs
            </Link>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3 space-y-1 shrink-0">
        {(pseudo || rang) && (
          <div className="flex items-center gap-2.5 rounded-md px-3 py-2 mb-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
              {pseudo ? pseudo.slice(0, 2).toUpperCase() : "??"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-none text-foreground">{pseudo ?? "…"}</p>
              {rang && (
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${rangColors[rang as Rang] ?? "bg-gray-500 text-white"}`}>
                  {rang}
                </span>
              )}
            </div>
          </div>
        )}

        <Link
          href="/parametres"
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all",
            pathname === "/parametres"
              ? "bg-primary/15 text-primary border border-primary/20"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          Paramètres
        </Link>

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

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-screen w-60 shrink-0 flex-col">
        {sidebarContent}
      </div>

      {/* Mobile: hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-sidebar shadow-md md:hidden"
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5 text-foreground" />
      </button>

      {/* Mobile: overlay + drawer */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 z-50 flex h-full w-60 md:hidden">
            {sidebarContent}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-[-44px] flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-sidebar shadow-md"
              aria-label="Fermer le menu"
            >
              <X className="h-5 w-5 text-foreground" />
            </button>
          </div>
        </>
      )}
    </>
  );
}
