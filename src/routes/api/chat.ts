import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createAiProvider, getAiModelName } from "@/lib/ai-provider.server";
import { createClient } from "@supabase/supabase-js";
import {
  AGENT_SAFETY_PROMPT,
  containsSecretMaterial,
  SECRET_REFUSAL,
} from "@/lib/agent-safety";

const SYSTEM = `You are LTCme AI — a friendly, expert Litecoin (LTC) companion for the LTCme.click wallet.

Your knowledge domain:
- Litecoin protocol: PoW (Scrypt), 2.5-min blocks, halvings, block reward, supply cap (84M).
- Litecoin addresses: L (legacy P2PKH), M / 3 (P2SH), ltc1... (bech32 SegWit). Explain differences.
- MWEB (Mimblewimble Extension Blocks) — confidential transactions on Litecoin.
- Wallet security: seed phrases, private keys, PSBT, hardware wallets, cold storage.
- Fees, mempool, confirmations, RBF/CPFP.
- Lightning on Litecoin, atomic swaps, LTC vs BTC differences.
- LTCme.click features: multi-wallet import, non-custodial in-browser keys, TX builder, tools, send/receive.

Rules:
- NEVER ask for or accept the user's seed phrase or private key. If they try to share one, refuse and warn them.
- Prefer LTC-first answers. If asked about BTC, answer briefly and relate to LTC.
- Be concise. Use markdown, code blocks for addresses/commands.
- If asked something outside Litecoin/crypto scope, give a short answer and steer back to LTC.`;

const FULL_SYSTEM = `${SYSTEM}\n\n${AGENT_SAFETY_PROMPT}`;

function messageText(m: UIMessage): string {
  return (m.parts ?? [])
    .map((p: any) => (p?.type === "text" ? String(p.text ?? "") : ""))
    .join(" ");
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // AuthN: require a valid Supabase session bearer token.
        const authHeader = request.headers.get("Authorization") ?? "";
        if (!authHeader.toLowerCase().startsWith("bearer ")) {
          return new Response("Unauthorized", { status: 401 });
        }
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabasePublishable = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!supabaseUrl || !supabasePublishable) {
          return new Response("Server not configured", { status: 500 });
        }
        const userClient = createClient(supabaseUrl, supabasePublishable, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { Authorization: authHeader } },
        });
        const { data: userData, error: userErr } =
          await userClient.auth.getUser();
        if (userErr || !userData.user) {
          return new Response("Unauthorized", { status: 401 });
        }
        const userId = userData.user.id;

        const body = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(body.messages))
          return new Response("bad request", { status: 400 });

        // Deterministic agent-safety gate: refuse before the model ever sees
        // anything resembling a recovery phrase, private key or password.
        const latest = body.messages[body.messages.length - 1];
        if (
          latest &&
          latest.role === "user" &&
          containsSecretMaterial(messageText(latest))
        ) {
          return new Response(SECRET_REFUSAL, { status: 422 });
        }

        // AuthZ / quota: 5 free messages, then an active subscription is
        // required. Enforced server-side before streaming a paid response.
        const FREE_MESSAGES = 5;
        const { supabaseAdmin } =
          await import("@/integrations/supabase/client.server");
        const nowIso = new Date().toISOString();
        const { data: subs } = await supabaseAdmin
          .from("subscriptions")
          .select("status,current_period_end")
          .eq("user_id", userId)
          .eq("status", "active");
        const hasActiveSub = (subs || []).some(
          (s: { current_period_end: string | null }) =>
            !s.current_period_end ||
            new Date(s.current_period_end).getTime() > Date.now(),
        );
        await supabaseAdmin
          .from("ai_usage")
          .upsert(
            { user_id: userId },
            { onConflict: "user_id", ignoreDuplicates: true },
          );
        const { data: usage } = await supabaseAdmin
          .from("ai_usage")
          .select("total_messages,free_messages_used")
          .eq("user_id", userId)
          .maybeSingle();
        const total = usage?.total_messages ?? 0;
        const freeUsed = usage?.free_messages_used ?? 0;
        if (!hasActiveSub && freeUsed >= FREE_MESSAGES) {
          return new Response(
            "You've used your 5 free AI messages. Subscribe to continue.",
            { status: 402 },
          );
        }
        const { error: upsertErr } = await supabaseAdmin
          .from("ai_usage")
          .update({
            total_messages: total + 1,
            free_messages_used: hasActiveSub ? freeUsed : freeUsed + 1,
            updated_at: nowIso,
          })
          .eq("user_id", userId);
        if (upsertErr) {
          return new Response("Could not record usage", { status: 500 });
        }

        const key = process.env.AI_API_KEY;
        if (!key) return new Response("Missing AI_API_KEY", { status: 500 });
        const provider = createAiProvider(key);
        const model = provider(getAiModelName());
        const result = streamText({
          model,
          system: FULL_SYSTEM,
          messages: await convertToModelMessages(body.messages),
        });
        return result.toUIMessageStreamResponse({
          originalMessages: body.messages,
        });
      },
    },
  },
});
