import { useEffect, useState } from "react";
import { Check, Copy, Sparkles, Send, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { getLtcUsdPrice } from "@/lib/ltc/api";
import { useServerFn } from "@tanstack/react-start";
import { activateLtcSubscription, LTC_PAY_ADDRESS, LTC_TIERS } from "@/lib/ltc-pay.functions";

const PLANS = [
  { id: "monthly", ...LTC_TIERS.monthly, period: "/mo" },
  { id: "quarterly", ...LTC_TIERS.quarterly, period: "/3 mo" },
  { id: "yearly", ...LTC_TIERS.yearly, period: "/yr" },
] as const;

const PRO_FEATURES = [
  "Unlimited LTCme AI on every page",
  "Advanced wallet tools & multisig",
  "Address exposure analysis",
  "UTXO consolidation guidance",
];

export function PlansInline({ compact = false }: { compact?: boolean }) {
  const [ltcUsd, setLtcUsd] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const [txid, setTxid] = useState("");
  const [confirming, setConfirming] = useState(false);
  const activate = useServerFn(activateLtcSubscription);

  useEffect(() => {
    getLtcUsdPrice().then(setLtcUsd).catch(() => {});
  }, []);

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(
      () => toast.success("Copied"),
      () => toast.error("Copy failed"),
    );
  }

  async function confirm() {
    const t = txid.trim();
    if (!t || !openId) return;
    if (!/^[a-f0-9]{64}$/.test(t)) {
      toast.error("Enter a valid 64-character Litecoin transaction id.");
      return;
    }
    setConfirming(true);
    try {
      const r = await activate({ data: { txid: t, tier: openId } });
      if (r.ok) {
        toast.success("LTCme Pro activated! Reloading…");
        setTimeout(() => window.location.reload(), 1200);
      } else {
        toast.error(r.error);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Activation failed");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 space-y-3">
      <div className="flex items-center gap-2 text-xs text-primary">
        <Sparkles className="h-3.5 w-3.5" />
        <span className="font-medium">Unlock LTCme Pro</span>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Every account gets 10 free AI messages. Pro unlocks unlimited wallet-aware Litecoin AI plus the
        advanced wallet tools. Litecoin only — send and confirm to activate.
      </p>
      <ul className="space-y-1">
        {PRO_FEATURES.map((f) => (
          <li key={f} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Check className="h-3 w-3 text-primary flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      <div className={compact ? "grid grid-cols-3 gap-1.5" : "grid grid-cols-1 sm:grid-cols-3 gap-2"}>
        {PLANS.map((p) => {
          const ltc = ltcUsd > 0 ? p.usd / ltcUsd : 0;
          const open = openId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setOpenId(open ? null : p.id)}
              className={`text-left rounded-xl border px-2.5 py-2 transition ${
                open ? "border-primary bg-primary/10" : "border-border bg-background/40 hover:border-primary/60"
              }`}
            >
              <div className="text-[11px] text-muted-foreground">{p.label}</div>
              <div className="text-sm font-semibold gradient-text">${p.usd}<span className="text-[10px] text-muted-foreground font-normal">{p.period}</span></div>
              {ltcUsd > 0 && (
                <div className="text-[10px] text-muted-foreground mt-0.5">≈ {ltc.toFixed(4)} LTC</div>
              )}
            </button>
          );
        })}
      </div>

      {openId && (() => {
        const p = PLANS.find((x) => x.id === openId)!;
        const ltc = ltcUsd > 0 ? p.usd / ltcUsd : 0;
        return (
          <div className="rounded-xl border border-border bg-background/60 p-3 text-xs space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Send exactly</span>
                <button
                  onClick={() => copy(ltc.toFixed(8))}
                  className="font-mono inline-flex items-center gap-1 hover:text-primary"
                >
                  {ltc.toFixed(8)} LTC <Copy className="h-3 w-3" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">To address</span>
                <span className="text-[10px] text-muted-foreground">LTC mainnet</span>
              </div>
              <button
                onClick={() => copy(LTC_PAY_ADDRESS)}
                className="w-full font-mono text-[10px] break-all text-left rounded-lg bg-input border border-border px-2 py-1.5 hover:border-primary inline-flex items-center gap-1 justify-between"
              >
                <span>{LTC_PAY_ADDRESS}</span>
                <Copy className="h-3 w-3 flex-shrink-0" />
              </button>
            </div>

            <div className="pt-2 border-t border-border/60 space-y-2">
              <label className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" /> Paste your transaction id after sending
              </label>
              <input
                value={txid}
                onChange={(e) => setTxid(e.target.value.trim())}
                placeholder="e.g. a1b2c3… (64 hex characters)"
                className="w-full rounded-lg bg-input border border-border px-2.5 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={confirm}
                disabled={confirming || !txid.trim()}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-2.5 py-2 font-medium hover:opacity-90 disabled:opacity-50"
              >
                {confirming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Confirm & Activate
              </button>
              <p className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                <Check className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                Activation is verified on the Litecoin blockchain. Once your txid confirms, Pro unlocks
                instantly. Rate ${ltcUsd.toFixed(2)}/LTC.
              </p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
