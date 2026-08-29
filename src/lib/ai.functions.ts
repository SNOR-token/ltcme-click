import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getUserEntitlements } from "@/lib/entitlements.server";

/** Free AI messages every account gets before Heightened Security is required. */
export const FREE_MESSAGES = 5;

async function ensureUsageRow(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("ai_usage")
    .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });
  const { data } = await supabaseAdmin
    .from("ai_usage")
    .select("free_messages_used,total_messages")
    .eq("user_id", userId)
    .maybeSingle();
  return data as { free_messages_used: number; total_messages: number } | null;
}

export const getAiEntitlement = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const usage = await ensureUsageRow(userId);
    const ent = await getUserEntitlements(supabase, userId);
    const used = usage?.free_messages_used ?? 0;
    const freeRemaining = Math.max(0, FREE_MESSAGES - used);
    return {
inTrial: false,
trialDaysLeft: 0,
      totalMessages: usage?.total_messages ?? 0,
      hasActiveSub: ent.active,
      everSubscribed: ent.everSubscribed,
      freeRemaining,
      canSend: ent.active || freeRemaining > 0,
      periodEnd: ent.currentPeriodEnd,
      tier: ent.tier,
      provider: ent.provider,
    };
  });

export const consumeAiMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const usage = await ensureUsageRow(userId);
    const ent = await getUserEntitlements(supabase, userId);
    const used = usage?.free_messages_used ?? 0;
    if (!ent.active && used >= FREE_MESSAGES) {
      return { ok: false as const, reason: "free_limit" as const, freeRemaining: 0 };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("ai_usage")
      .update({
        free_messages_used: ent.active ? used : used + 1,
        total_messages: (usage?.total_messages ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    return {
      ok: true as const,
      hasActiveSub: ent.active,
      freeRemaining: ent.active ? FREE_MESSAGES : Math.max(0, FREE_MESSAGES - (used + 1)),
    };
  });
