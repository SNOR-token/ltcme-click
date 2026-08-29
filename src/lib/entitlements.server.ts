/**
 * Authoritative Heightened Security entitlement checks (server-side).
 * Never trust client-only UI gates for AI or premium features.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type Entitlement = {
  active: boolean;
  tier: "monthly" | "yearly" | null;
  currentPeriodEnd: string | null;
  provider: string | null;
  everSubscribed: boolean;
};

export async function getUserEntitlements(
  supabase: SupabaseClient,
  userId: string,
): Promise<Entitlement> {
  const { data: subs } = await supabase
    .from("subscriptions")
    .select("status, current_period_end, tier, provider")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const all = subs ?? [];
  const now = Date.now();
  const activeRow = all.find((s: any) => {
    if (s.status !== "active") return false;
    if (!s.current_period_end) return true;
    return new Date(s.current_period_end).getTime() > now;
  });

  return {
    active: !!activeRow,
    tier: (activeRow?.tier as "monthly" | "yearly") ?? null,
    currentPeriodEnd: activeRow?.current_period_end ?? null,
    provider: activeRow?.provider ?? null,
    everSubscribed: all.length > 0,
  };
}

export function requireActiveEntitlement(ent: Entitlement, feature: string): void {
  if (!ent.active) {
    throw new Error(
      `Heightened Security subscription required for ${feature}. Pay with Litecoin to unlock.`,
    );
  }
}
