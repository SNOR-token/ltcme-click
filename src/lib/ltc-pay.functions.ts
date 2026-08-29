import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Litecoin-only subscription activation.
 *
 * Flow: the user sends LTC to the payment address, pastes the txid, and clicks
 * "Confirm & Activate". This server function verifies the transaction on the
 * Litecoin blockchain via the public litecoinspace.org API, checks the amount
 * matches the tier price, and upserts an "active" subscription row. No card, no
 * Stripe, no third-party payment processor.
 */

const LTC_PAY_ADDRESS = "MLaCqgY8ZQUXn9hThwZoU5ohFxGuwfCug8";
const LTC_API = "https://litecoinspace.org/api";

/** Price tiers in USD and the access duration each grants. */
const TIERS: Record<string, { usd: number; days: number; label: string }> = {
  monthly: { usd: 4.99, days: 31, label: "Monthly" },
  quarterly: { usd: 9.99, days: 92, label: "3 Months" },
  yearly: { usd: 19.99, days: 365, label: "Yearly" },
};

/** tolerance for LTC/USD price movement between send and confirm. */
const PRICE_TOLERANCE = 0.05; // 5% underpayment allowed

type ActivateResult =
  | { ok: true; tier: string; currentPeriodEnd: string }
  | { ok: false; error: string };

interface LtcTx {
  txid: string;
  status?: { confirmed?: boolean };
  vout?: Array<{ value?: number; scriptpubkey_address?: string }>;
}

async function getLtcUsd(): Promise<number> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd",
    );
    if (!res.ok) throw new Error("price");
    const j = (await res.json()) as { litecoin?: { usd?: number } };
    const p = j?.litecoin?.usd;
    if (typeof p === "number" && p > 0) return p;
  } catch {}
  return 0;
}

async function fetchTx(txid: string): Promise<LtcTx | null> {
  try {
    const res = await fetch(`${LTC_API}/tx/${txid}`);
    if (!res.ok) return null;
    return (await res.json()) as LtcTx;
  } catch {
    return null;
  }
}

export const activateLtcSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { txid: string; tier: string }) => {
    if (typeof data.txid !== "string" || !/^[a-f0-9]{64}$/.test(data.txid.trim()))
      throw new Error("Invalid transaction id");
    if (!(data.tier in TIERS)) throw new Error("Invalid tier");
    return data;
  })
  .handler(async ({ data, context }): Promise<ActivateResult> => {
    const { userId } = context;
    const txid = data.txid.trim();
    const tier = TIERS[data.tier];

    // 1. Verify the transaction exists on the Litecoin blockchain.
    const tx = await fetchTx(txid);
    if (!tx) {
      return { ok: false, error: "Transaction not found. Wait a moment for the network to relay it, then try again." };
    }

    // 2. Sum outputs sent to the LTCme payment address (in sats).
    const receivedSats = (tx.vout ?? [])
      .filter((o) => o.scriptpubkey_address === LTC_PAY_ADDRESS)
      .reduce((sum, o) => sum + (o.value ?? 0), 0);

    if (receivedSats <= 0) {
      return { ok: false, error: "No LTC was sent to the LTCme payment address in this transaction." };
    }

    // 3. Check the amount meets the tier price at current LTC/USD.
    const ltcUsd = await getLtcUsd();
    if (ltcUsd <= 0) {
      return { ok: false, error: "Could not fetch the LTC price. Please try again in a moment." };
    }
    const expectedLtc = tier.usd / ltcUsd;
    const expectedSats = Math.round(expectedLtc * 1e8);
    const minAcceptedSats = Math.round(expectedSats * (1 - PRICE_TOLERANCE));
    if (receivedSats < minAcceptedSats) {
      const gotLtc = (receivedSats / 1e8).toFixed(8);
      return {
        ok: false,
        error: `Payment short. This tier (${tier.label}) needs ≈ ${expectedLtc.toFixed(8)} LTC (${tier.usd} USD) but the transaction sent ${gotLtc} LTC.`,
      };
    }

    // 4. Activate the subscription.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = Date.now();
    const periodEnd = new Date(now + tier.days * 24 * 60 * 60 * 1000).toISOString();

    // Reuse an existing litecoin subscription row if present, else insert.
    const { data: existing } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .eq("provider", "litecoin")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const row: Record<string, unknown> = {
      user_id: userId,
      provider: "litecoin",
      provider_subscription_id: `ltc-${txid}`,
      tier: data.tier,
      status: "active",
      current_period_start: new Date(now).toISOString(),
      current_period_end: periodEnd,
      cancel_at_period_end: false,
      environment: "live",
      updated_at: new Date(now).toISOString(),
    };

    if (existing?.id) {
      await supabaseAdmin.from("subscriptions").update(row).eq("id", existing.id);
    } else {
      await supabaseAdmin.from("subscriptions").insert({ ...row, stripe_subscription_id: null });
    }

    return { ok: true, tier: data.tier, currentPeriodEnd: periodEnd };
  });

export { TIERS as LTC_TIERS, LTC_PAY_ADDRESS };
