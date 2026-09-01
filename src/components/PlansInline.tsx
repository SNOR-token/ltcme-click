import { useEffect, useState } from "react";
import { Check, Copy, Sparkles, Send, Loader2, Lock, Star, Zap, ShieldCheck, BarChart3, Clock, Bell, Users, Layers, Crown } from "lucide-react";
import { toast } from "sonner";
import { getLtcUsdPrice } from "@/lib/ltc/api";
import { useServerFn } from "@tanstack/react-start";
import { activateLtcSubscription, LTC_PAY_ADDRESS, LTC_TIERS } from "@/lib/ltc-pay.functions";
import { PRO_FEATURES as BaseProFeatures } from "@/components/ProGate";

const PLANS = [
  { id: "monthly", ...LTC_TIERS.monthly, period: "/mo", discount: null },
  { id: "quarterly", ...LTC_TIERS.quarterly, period: "/3 mo", discount: "Save 15%" },
  { id: "yearly", ...LTC_TIERS.yearly, period: "/yr", discount: "Save 30%" },
] as const;

// Feature icons mapping
const FEATURE_ICONS: Record<string, React.ReactNode> = {
  "Unlimited LTCme AI messages on every page": <Sparkles className="h-3.5 w-3.5 text-primary" />,
  "Advanced wallet analytics and insights": <BarChart3 className="h-3.5 w-3.5 text-primary" />,
  "Address exposure & privacy analysis": <ShieldCheck className="h-3.5 w-3.5 text-primary" />,
  "UTXO consolidation guidance": <Layers className="h-3.5 w-3.5 text-primary" />,
  "Priority transaction monitoring": <Zap className="h-3.5 w-3.5 text-primary" />,
  "Custom fee rate recommendations": <Star className="h-3.5 w-3.5 text-primary" />,
  "Multi-signature wallet creation": <Users className="h-3.5 w-3.5 text-primary" />,
  "Batch transaction support": <Send className="h-3.5 w-3.5 text-primary" />,
  "Coin control & UTXO selection": <Clock className="h-3.5 w-3.5 text-primary" />,
  "Transaction history export": <Bell className="h-3.5 w-3.5 text-primary" />,
  "Watch-only address management": <Lock className="h-3.5 w-3.5 text-primary" />,
  "Custom network fee alerts": <Bell className="h-3.5 w-3.5 text-primary" />,
  "Early access to new features": <Crown className="h-3.5 w-3.5 text-primary" />,
};

// Split features into two columns for better display
const FEATURES_LEFT = BaseProFeatures.slice(0, Math.ceil(BaseProFeatures.length / 2));
const FEATURES_RIGHT = BaseProFeatures.slice(Math.ceil(BaseProFeatures.length / 2));

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
        toast.success("LTCme Pro activated! Reloading...");
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

  // Get icon for a feature
  function getFeatureIcon(feature: string) {
    return FEATURE_ICONS[feature] || <Check className="h-3.5 w-3.5 text-primary" />;
  }

  if (compact) {
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 space-y-3">
        <div className="flex items-center gap-2 text-xs text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          <span className="font-medium">Unlock LTCme Pro</span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Every account gets 10 free AI messages. Pro unlocks unlimited wallet-aware Litecoin AI plus
          advanced wallet tools. Litecoin only — send and confirm to activate.
        </p>
        <ul className="space-y-1">
          {BaseProFeatures.slice(0, 4).map((f) => (
            <li key={f} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Check className="h-3 w-3 text-primary flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        <div className="grid grid-cols-3 gap-1.5">
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
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    ≈ {ltc.toFixed(4)} LTC
                  </div>
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

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-4">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/30 px-4 py-2 mb-2">
          <Crown className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold gradient-text">LTCme Pro</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Unlock the full power of Litecoin with advanced tools and unlimited AI assistance
        </p>
      </div>

      {/* Features grid - two columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          {FEATURES_LEFT.map((feature) => (
            <div key={feature} className="flex items-center gap-2.5 text-sm">
              <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                {getFeatureIcon(feature)}
              </div>
              <span className="text-foreground">{feature}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {FEATURES_RIGHT.map((feature) => (
            <div key={feature} className="flex items-center gap-2.5 text-sm">
              <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                {getFeatureIcon(feature)}
              </div>
              <span className="text-foreground">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing plans */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        {PLANS.map((p) => {
          const ltc = ltcUsd > 0 ? p.usd / ltcUsd : 0;
          const open = openId === p.id;
          const isPopular = p.id === "yearly";
          return (
            <button
              key={p.id}
              onClick={() => setOpenId(open ? null : p.id)}
              className={`text-left rounded-2xl border-2 px-4 py-3 transition-all group ${
                open 
                  ? "border-primary bg-primary/15 shadow-lg" 
                  : isPopular
                  ? "border-primary/50 bg-primary/5 ring-2 ring-primary/20" 
                  : "border-border/60 bg-background/40 hover:border-primary/40"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{p.label}</span>
                {isPopular && !open && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    Popular
                  </span>
                )}
              </div>
              <div className="text-xl font-bold gradient-text">
                ${p.usd}
                <span className="text-[12px] text-muted-foreground font-normal">
                  {p.period}
                </span>
              </div>
              {p.discount && !open && (
                <div className="text-[11px] text-success mt-0.5">{p.discount}</div>
              )}
              {ltcUsd > 0 && (
                <div className="text-[11px] text-muted-foreground mt-1">
                  ≈ {ltc.toFixed(4)} LTC
                </div>
              )}
            </button>
          );
        })}
      </div>

      {openId && (() => {
        const p = PLANS.find((x) => x.id === openId)!;
        const ltc = ltcUsd > 0 ? p.usd / ltcUsd : 0;
        return (
          <div className="rounded-2xl border border-primary/40 bg-background/60 p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Crown className="h-4 w-4" />
              <span>Activate {p.label} subscription</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20">
                <div>
                  <div className="text-xs text-muted-foreground">Send exactly</div>
                  <div className="font-mono text-lg font-semibold">{ltc.toFixed(8)} LTC</div>
                </div>
                <button
                  onClick={() => copy(ltc.toFixed(8))}
                  className="p-1.5 rounded-lg hover:bg-primary/10 text-primary hover:text-primary/80 transition"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">To address</span>
                  <span className="text-[10px] text-muted-foreground">LTC mainnet</span>
                </div>
                <button
                  onClick={() => copy(LTC_PAY_ADDRESS)}
                  className="w-full font-mono text-xs break-all text-left rounded-lg bg-input/80 border border-border/60 px-3 py-2 hover:border-primary/60 inline-flex items-center gap-2 justify-between"
                >
                  <span className="truncate">{LTC_PAY_ADDRESS}</span>
                  <Copy className="h-3.5 w-3.5 flex-shrink-0" />
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-border/60 space-y-3">
              <label className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Lock className="h-4 w-4" /> Paste your transaction id after sending
              </label>
              <input
                value={txid}
                onChange={(e) => setTxid(e.target.value.trim())}
                placeholder="e.g. a1b2c3… (64 hex characters)"
                className="w-full rounded-xl bg-input/80 border border-border/60 px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/70"
              />
              <button
                onClick={confirm}
                disabled={confirming || !txid.trim()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-3 font-medium hover:opacity-90 disabled:opacity-50 transition"
              >
                {confirming ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Confirm & Activate
                  </>
                )}
              </button>
              <p className="flex items-start gap-2 text-xs text-muted-foreground/70">
                <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                Activation is verified on the Litecoin blockchain. Once your txid confirms, Pro unlocks
                instantly. Current rate: <strong className="text-foreground">${ltcUsd.toFixed(2)}/LTC</strong>.
              </p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
