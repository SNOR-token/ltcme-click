import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const FREE_LIMIT = 5;

export const getAiEntitlement = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: usage } = await supabase
      .from("ai_usage")
      .select("free_messages_used,total_messages")
      .eq("user_id", userId)
      .maybeSingle();
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("tier,status,current_period_end");
    const now = Date.now();
    const all = subs || [];
    const active = all.some(
      (s: any) =>
        s.status === "active" &&
        (!s.current_period_end || new Date(s.current_period_end).getTime() > now),
    );
    return {
      freeUsed: usage?.free_messages_used ?? 0,
      freeLimit: FREE_LIMIT,
      totalMessages: usage?.total_messages ?? 0,
      hasActiveSub: active,
      everSubscribed: all.length > 0,
      canSend:
        active || (usage?.free_messages_used ?? 0) < FREE_LIMIT,
    };
  });

export const consumeAiMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("current_period_end")
      .eq("user_id", userId)
      .eq("status", "active");
    const active = (subs || []).some(
      (s: any) => !s.current_period_end || new Date(s.current_period_end).getTime() > Date.now(),
    );
    const { data: current } = await supabase
      .from("ai_usage")
      .select("free_messages_used,total_messages")
      .eq("user_id", userId)
      .maybeSingle();
    const freeUsed = current?.free_messages_used ?? 0;
    const total = current?.total_messages ?? 0;
    if (!active && freeUsed >= FREE_LIMIT) {
      return { ok: false as const, reason: "free_limit" };
    }
    // Upsert
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("ai_usage")
      .upsert(
        {
          user_id: userId,
          free_messages_used: active ? freeUsed : freeUsed + 1,
          total_messages: total + 1,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    return { ok: true as const, freeUsed: active ? freeUsed : freeUsed + 1, freeLimit: FREE_LIMIT };
  });