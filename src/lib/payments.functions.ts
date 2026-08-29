/**
 * Litecoin-only Heightened Security payments.
 * User sends LTC to the official address, then submits the txid for on-chain verification.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getUserEntitlements } from "@/lib/entitlements.server";

/** Official subscription payment address (same as project receive address). */
export const LTC_PAY_ADDRESS = "MLaCqgY8ZQUXn9hThwZoU5ohFxGuwfCug8";

/** USD list prices — converted to LTC at claim time using live spot. */
export const PLAN_USD: Record<"monthly" | "yearly", number> = {
  monthly: 5.99,
  yearly: 49.99,
};

const PERIOD_DAYS: Record<"monthly" | "yearly", number> = {
  monthly: 31,
  yearly: 366,
};

/** Accept payments within 8% of expected LTC amount (price volatility buffer). */
const AMOUNT_TOLERANCE = 0.08;

/** Require at least this many confirmations before activating. */
const MIN_CONFIRMATIONS = 1;

const TXID_RE = /^[0-9a-fA-F]{64}$/;

async function fetchTx(txid: string): Promise<any> {
  const res = await fetch(`https://litecoinspace.org/api/tx/${txid}`);
  if (!res.ok) throw new Error(`Could not fetch transaction (${res.status}). Check the txid.`);
  return res.json();
}

async function fetchLtcUsd(): Promise<number> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd",
    );
    if (!res.ok) return 0;
    const j = (await res.json()) as { litecoin?: { usd?: number } };
    return j?.litecoin?.usd && j.litecoin.usd > 0 ? j.litecoin.usd : 0;
  } catch {
    return 0;
  }
}

function paymentToAddressSats(tx: any, address: string): number {
  let sum = 0;
  for (const vout of tx?.vout ?? []) {
    const addrs: string[] = vout?.scriptpubkey_address
      ? [vout.scriptpubkey_address]
      : vout?.scriptpubkey_addresses ?? [];
    // mempool.space style
    const spk = vout?.scriptpubkey_address ?? vout?.scriptpubkey_addresses?.[0];
    const candidates = [spk, ...(vout?.scriptpubkey_addresses ?? [])].filter(Boolean);
    if (candidates.includes(address) || addrs.includes(address)) {
      sum += Number(vout.value ?? 0);
    }
  }
  return sum;
}

function confirmationsOf(tx: any): number {
  if (!tx?.status?.confirmed) return 0;
  // litecoinspace may not return absolute height delta; treat confirmed as 1+
  return 1;
}

export const getPaymentInfo = createServerFn({ method: "GET" }).handler(async () => {
  const ltcUsd = await fetchLtcUsd();
  return {
    address: LTC_PAY_ADDRESS,
    plans: {
      monthly: {
        usd: PLAN_USD.monthly,
        ltc: ltcUsd > 0 ? PLAN_USD.monthly / ltcUsd : null,
        days: PERIOD_DAYS.monthly,
      },
      yearly: {
        usd: PLAN_USD.yearly,
        ltc: ltcUsd > 0 ? PLAN_USD.yearly / ltcUsd : null,
        days: PERIOD_DAYS.yearly,
      },
    },
    ltcUsd,
    minConfirmations: MIN_CONFIRMATIONS,
  };
});

export const getMyEntitlement = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    return getUserEntitlements(supabase, userId);
  });

/**
 * Submit a Litecoin txid as payment for Heightened Security.
 * Verifies on-chain that funds were sent to LTC_PAY_ADDRESS in sufficient amount.
 */
export const claimLtcPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { txid: string; tier: "monthly" | "yearly" }) => {
    if (!TXID_RE.test(data.txid.trim())) throw new Error("Invalid transaction id (expect 64 hex chars).");
    if (data.tier !== "monthly" && data.tier !== "yearly") throw new Error("Invalid plan tier.");
    return { txid: data.txid.trim().toLowerCase(), tier: data.tier };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Idempotency: if this txid already activated someone, reject reuse
    const { data: existingClaim } = await (supabaseAdmin as any)
      .from("ltc_payment_claims")
      .select("id, user_id, status")
      .eq("txid", data.txid)
      .maybeSingle();

    if (existingClaim) {
      if (existingClaim.user_id === userId && existingClaim.status === "confirmed") {
        const ent = await getUserEntitlements(supabase, userId);
        return { ok: true as const, alreadyProcessed: true, entitlement: ent };
      }
      throw new Error("This transaction has already been used for a subscription claim.");
    }

    const ltcUsd = await fetchLtcUsd();
    if (!(ltcUsd > 0)) throw new Error("Could not fetch LTC/USD price. Try again shortly.");

    const expectedLtc = PLAN_USD[data.tier] / ltcUsd;
    const expectedSats = Math.floor(expectedLtc * 1e8);
    const minSats = Math.floor(expectedSats * (1 - AMOUNT_TOLERANCE));

    const tx = await fetchTx(data.txid);
    const paidSats = paymentToAddressSats(tx, LTC_PAY_ADDRESS);
    if (paidSats < minSats) {
      await (supabaseAdmin as any).from("ltc_payment_claims").insert({
        user_id: userId,
        txid: data.txid,
        tier: data.tier,
        amount_sats: paidSats,
        status: "rejected",
        notes: `Insufficient amount: got ${paidSats} sats, need >= ${minSats}`,
      });
      throw new Error(
        `Payment to ${LTC_PAY_ADDRESS} is insufficient (got ${paidSats} sats, need about ${expectedSats} sats ≈ ${expectedLtc.toFixed(6)} LTC).`,
      );
    }

    const confs = confirmationsOf(tx);
    if (confs < MIN_CONFIRMATIONS) {
      await (supabaseAdmin as any).from("ltc_payment_claims").insert({
        user_id: userId,
        txid: data.txid,
        tier: data.tier,
        amount_sats: paidSats,
        status: "pending",
        confirmations: confs,
        notes: "Waiting for confirmation",
      });
      throw new Error("Transaction is unconfirmed. Wait for at least 1 confirmation, then submit again.");
    }

    const periodEnd = new Date();
    periodEnd.setUTCDate(periodEnd.getUTCDate() + PERIOD_DAYS[data.tier]);

    await (supabaseAdmin as any).from("ltc_payment_claims").insert({
      user_id: userId,
      txid: data.txid,
      tier: data.tier,
      amount_sats: paidSats,
      status: "confirmed",
      confirmations: confs,
      confirmed_at: new Date().toISOString(),
    });

    // Upsert active subscription row (service role)
    await supabaseAdmin.from("subscriptions").insert({
      user_id: userId,
      tier: data.tier,
      status: "active",
      provider: "litecoin",
      provider_subscription_id: data.txid,
      current_period_end: periodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    });

    const entitlement = await getUserEntitlements(supabaseAdmin as any, userId);
    return {
      ok: true as const,
      alreadyProcessed: false,
      paidSats,
      periodEnd: periodEnd.toISOString(),
      entitlement,
    };
  });
