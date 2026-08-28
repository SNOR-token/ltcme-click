import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Free AI messages every account gets before a subscription is required. */
export const FREE_MESSAGES = 5;

/** Creates the usage row exactly once. */
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

async function hasActiveSubscription(supabase: any, userId: string) {
  const { data: subs } = await supabase
    .from("subscriptions")
    .select("status,current_period_end")
    .eq("user_id", userId);
  const all = subs || [];
  const now = Date.now();
  const active = all.some(
    (s: any) =>
      s.status === "active" &&
      (!s.current_period_end || new Date(s.current_period_end).getTime() > now),
  );
  return { active, everSubscribed: all.length > 0 };
}

export const getAiEntitlement = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const usage = await ensureUsageRow(userId);
    const { active, everSubscribed } = await hasActiveSubscription(supabase, userId);
    const used = usage?.free_messages_used ?? 0;
    const freeRemaining = Math.max(0, FREE_MESSAGES - used);
    return {
      totalMessages: usage?.total_messages ?? 0,
      hasActiveSub: active,
      everSubscribed,
      freeRemaining,
      canSend: active || freeRemaining > 0,
    };
  });

export const consumeAiMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const usage = await ensureUsageRow(userId);
    const { active } = await hasActiveSubscription(supabase, userId);
    const used = usage?.free_messages_used ?? 0;
    if (!active && used >= FREE_MESSAGES) {
      return { ok: false as const, reason: "free_limit" as const, freeRemaining: 0 };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("ai_usage")
      .update({
        free_messages_used: active ? used : used + 1,
        total_messages: (usage?.total_messages ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    return {
      ok: true as const,
      hasActiveSub: active,
      freeRemaining: active ? FREE_MESSAGES : Math.max(0, FREE_MESSAGES - (used + 1)),
    };
  });
