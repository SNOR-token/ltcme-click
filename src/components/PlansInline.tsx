import { useEffect, useState } from "react";
import { Check, Copy, Shield, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { claimLtcPayment, getPaymentInfo, LTC_PAY_ADDRESS } from "@/lib/payments.functions";

const FEATURES = [
  "Advanced multisig (M-of-N policy, PSBT, cosigner verify)",
  "Unlimited AI security copilot (never receives your keys)",
  "Security health dashboard & backup drills",
  "Quantum-readiness education & key-exposure hygiene",
  "Transaction policy warnings (new recipient, large amount, fee anomaly)",
];

type Tier = "monthly" | "yearly";

export function PlansInline({ compact = false }: { compact?: boolean }) {
  const [ltcUsd, setLtcUsd] = useState(0);
  const [monthlyLtc, setMonthlyLtc] = useState<number | null>(null);
  const [yearlyLtc, setYearlyLtc] = useState<number | null>(null);
  const [tier, setTier] = useState<Tier>("monthly");
  const [txid, setTxid] = useState("");
  const [busy, setBusy] = useState(false);
  const getInfo = useServerFn(getPaymentInfo);
  const claim = useServerFn(claimLtcPayment);

  useEffect(() => {
    getInfo()
      .then((info) => {
        setLtcUsd(info.ltcUsd);
        setMonthlyLtc(info.plans.monthly.ltc);
        setYearlyLtc(info.plans.yearly.ltc);
      })
      .catch(() => {});
  }, [getInfo]);

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(
      () => toast.success("Copied"),
      () => toast.error("Copy failed"),
    );
  }

  const amountLtc = tier === "monthly" ? monthlyLtc : yearlyLtc;
  const priceUsd = tier === "monthly" ? 5.99 : 49.99;

  async function submitClaim() {
    const id = txid.trim();
    if (!/^[0-9a-fA-F]{64}$/.test(id)) {
      return toast.error("Enter a valid 64-character transaction id");
    }
    setBusy(true);
    try {
      const res = await claim({ data: { txid: id, tier } });
      if (res.ok) {
        toast.success(
          res.alreadyProcessed
            ? "Subscription already active for this payment"
            : "Heightened Security activated",
        );
        setTxid("");
      }
    } catch (e) {
      toast.error("Payment verification failed", {
        description: String((e as Error).message || e),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 space-y-3">
      <div className="flex items-center gap-2 text-xs text-primary">
        <Shield className="h-3.5 w-3.5" />
        <span className="font-medium">Heightened Security — pay with Litecoin</span>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Core self-custody stays free. Heightened Security is ${priceUsd === 5.99 ? "5.99/mo" : "49.99/yr"} paid in LTC
        to the official address below. Submit the txid after at least one confirmation — activation is automatic
        after on-chain verification. No card processor.
      </p>
      <ul className="space-y-1">
        {FEATURES.map((f) => (
          <li key={f} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <Check className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className={compact ? "grid grid-cols-2 gap-1.5" : "grid grid-cols-1 sm:grid-cols-2 gap-2"}>
        {(
          [
            { id: "monthly" as const, name: "Monthly", price: "$5.99", ltc: monthlyLtc },
            { id: "yearly" as const, name: "Yearly", price: "$49.99", ltc: yearlyLtc, save: "Save ~30%" },
          ] as const
        ).map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setTier(p.id)}
            className={`text-left rounded-xl border px-2.5 py-2 transition ${
              tier === p.id ? "border-primary bg-primary/10" : "border-border bg-background/40 hover:border-primary/60"
            }`}
          >
            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
              {p.id === "monthly" && <Sparkles className="h-3 w-3 text-primary" />}
              {p.name}
            </div>
            <div className="text-sm font-semibold gradient-text">{p.price}</div>
            {p.ltc != null && (
              <div className="text-[10px] text-muted-foreground mt-0.5">≈ {p.ltc.toFixed(6)} LTC</div>
            )}
            {"save" in p && p.save && <div className="text-[10px] text-primary mt-0.5">{p.save}</div>}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-background/60 p-2.5 text-xs space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Send exactly</span>
          <button
            type="button"
            onClick={() => amountLtc != null && copy(amountLtc.toFixed(8))}
            className="font-mono inline-flex items-center gap-1 hover:text-primary"
          >
            {amountLtc != null ? `${amountLtc.toFixed(8)} LTC` : "…"} <Copy className="h-3 w-3" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => copy(LTC_PAY_ADDRESS)}
          className="w-full font-mono text-[10px] break-all text-left rounded-lg bg-input border border-border px-2 py-1.5 hover:border-primary inline-flex items-center gap-1 justify-between"
        >
          <span>{LTC_PAY_ADDRESS}</span>
          <Copy className="h-3 w-3 flex-shrink-0" />
        </button>
        <label className="block">
          <span className="text-[10px] text-muted-foreground">Transaction ID (after 1+ confirmation)</span>
          <input
            value={txid}
            onChange={(e) => setTxid(e.target.value.trim())}
            placeholder="64-character txid"
            className="w-full mt-1 rounded-lg bg-input border border-border px-2 py-1.5 font-mono text-[11px]"
          />
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={submitClaim}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-2.5 py-2 font-medium hover:opacity-90 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5" />}
          {busy ? "Verifying on-chain…" : "Verify payment & activate"}
        </button>
        <p className="text-[10px] text-muted-foreground">
          Rate {ltcUsd > 0 ? `$${ltcUsd.toFixed(2)}/LTC` : "…"}. Amounts within ~8% of the listed LTC total are
          accepted. Each txid can activate only one account. Core wallet access is never gated.
        </p>
      </div>
    </div>
  );
}
