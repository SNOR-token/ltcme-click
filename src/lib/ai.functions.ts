import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Length of the free trial that unlocks the AI column + advanced features. */
export const TRIAL_DAYS = 3;

function trialEnd(startedAt: string | null | undefined): number {
  const start = startedAt ? new Date(startedAt).getTime() : Date.now();
  return start + TRIAL_DAYS * 24 * 60 * 60 * 1000;
}

/** Creates the usage row (and therefore starts the trial clock) exactly once. */
async function ensureUsageRow(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("ai_usage")
    .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });
  const { data } = await supabaseAdmin
    .from("ai_usage")
    .select("free_messages_used,total_messages,trial_started_at")
    .eq("user_id", userId)
    .maybeSingle();
  return data as
    | { free_messages_used: number; total_messages: number; trial_started_at: string }
    | null;
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
    const trialEndsAt = trialEnd(usage?.trial_started_at);
    const inTrial = !active && Date.now() < trialEndsAt;
    return {
      totalMessages: usage?.total_messages ?? 0,
      hasActiveSub: active,
      everSubscribed,
      inTrial,
      trialEndsAt,
      trialDaysLeft: Math.max(0, Math.ceil((trialEndsAt - Date.now()) / 86400000)),
      trialExpired: !active && Date.now() >= trialEndsAt,
      canSend: active || inTrial,
    };
  });

export const consumeAiMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const usage = await ensureUsageRow(userId);
    const { active } = await hasActiveSubscription(supabase, userId);
    const trialEndsAt = trialEnd(usage?.trial_started_at);
    const inTrial = !active && Date.now() < trialEndsAt;
    if (!active && !inTrial) {
      return { ok: false as const, reason: "trial_ended" as const };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("ai_usage")
      .update({
        total_messages: (usage?.total_messages ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    return { ok: true as const, hasActiveSub: active, inTrial };
  });
