"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { ALL_SECTIONS, type PermissionsMap, type Section } from "@/types";

function allPermissions(): PermissionsMap {
  const map: PermissionsMap = {};
  ALL_SECTIONS.forEach((s) => {
    map[s] = { peut_voir: true, peut_modifier: true };
  });
  return map;
}

function staffPermissions(): PermissionsMap {
  const map: PermissionsMap = {};
  ALL_SECTIONS.forEach((s) => {
    map[s] = { peut_voir: true, peut_modifier: false };
  });
  return map;
}

export function usePermissions() {
  const [rang, setRang] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<PermissionsMap | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: membre } = await supabase
        .from("membres")
        .select("rang")
        .eq("user_id", user.id)
        .single();

      if (!membre) {
        setLoading(false);
        return;
      }

      setRang(membre.rang);

      if (membre.rang === "Gérant") {
        setPermissions(allPermissions());
        setLoading(false);
        return;
      }

      if (membre.rang === "Staff") {
        setPermissions(staffPermissions());
        setLoading(false);
        return;
      }

      const { data: perms } = await supabase
        .from("permissions_rang")
        .select("section, peut_voir, peut_modifier")
        .eq("rang", membre.rang);

      if (perms) {
        const map: PermissionsMap = {};
        perms.forEach((p) => {
          map[p.section as Section] = {
            peut_voir: p.peut_voir,
            peut_modifier: p.peut_modifier,
          };
        });
        setPermissions(map);
      }

      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function can(section: Section, action: "voir" | "modifier" = "voir"): boolean {
    if (!permissions) return false;
    const perm = permissions[section];
    if (!perm) return false;
    return action === "voir" ? perm.peut_voir : perm.peut_modifier;
  }

  return { rang, permissions, loading, can };
}
