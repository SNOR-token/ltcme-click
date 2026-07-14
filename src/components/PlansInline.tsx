import { useEffect, useState } from "react";
import { Check, Copy, Sparkles, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { getLtcUsdPrice } from "@/lib/ltc/api";
import { StripeEmbeddedCheckoutModal } from "@/components/StripeEmbeddedCheckout";

const LTC_PAY_ADDRESS = "MLaCqgY8ZQUXn9hThwZoU5ohFxGuwfCug8";

const PLANS = [
  { id: "monthly",   name: "Monthly",  price: "$4.99",  usd: 4.99,  period: "/mo",   save: "",           stripePriceId: "ltcme_ai_monthly" },
  { id: "quarterly", name: "3 Months", price: "$9.99",  usd: 9.99,  period: "/3 mo", save: "Save 33%",   stripePriceId: null },
  { id: "yearly",    name: "Yearly",   price: "$19.99", usd: 19.99, period: "/yr",   save: "Save 67%",   stripePriceId: "ltcme_ai_yearly" },
];

export function PlansInline({ compact = false }: { compact?: boolean }) {
  const [ltcUsd, setLtcUsd] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const [checkoutPriceId, setCheckoutPriceId] = useState<string | null>(null);

  useEffect(() => {
    getLtcUsdPrice().then(setLtcUsd).catch(() => {});
  }, []);

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(
      () => toast.success("Copied"),
      () => toast.error("Copy failed"),
    );
  }

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 space-y-2">
      {checkoutPriceId && (
        <StripeEmbeddedCheckoutModal
          priceId={checkoutPriceId}
          onClose={() => setCheckoutPriceId(null)}
        />
      )}
      <div className="flex items-center gap-2 text-xs text-primary">
        <Sparkles className="h-3.5 w-3.5" />
        <span className="font-medium">Unlock unlimited LTCme AI</span>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Wallet features stay free. Pay by card or with Litecoin.
      </p>
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
              <div className="text-[11px] text-muted-foreground">{p.name}</div>
              <div className="text-sm font-semibold gradient-text">{p.price}<span className="text-[10px] text-muted-foreground font-normal">{p.period}</span></div>
              {ltcUsd > 0 && (
                <div className="text-[10px] text-muted-foreground mt-0.5">≈ {ltc.toFixed(4)} LTC</div>
              )}
              {p.save && <div className="text-[10px] text-primary mt-0.5">{p.save}</div>}
            </button>
          );
        })}
      </div>

      {openId && (() => {
        const p = PLANS.find((x) => x.id === openId)!;
        const ltc = ltcUsd > 0 ? p.usd / ltcUsd : 0;
        return (
          <div className="rounded-xl border border-border bg-background/60 p-2.5 text-xs space-y-2">
            {p.stripePriceId && (
              <button
                onClick={(e) => { e.stopPropagation(); setCheckoutPriceId(p.stripePriceId!); }}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-2.5 py-2 font-medium hover:opacity-90"
              >
                <CreditCard className="h-3.5 w-3.5" />
                Pay {p.price} by card
              </button>
            )}
            <div className="text-[10px] text-muted-foreground text-center">
              {p.stripePriceId ? "or pay with Litecoin" : "Litecoin only for this tier"}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Send</span>
              <button
                onClick={(e) => { e.stopPropagation(); copy(ltc.toFixed(8)); }}
                className="font-mono inline-flex items-center gap-1 hover:text-primary"
              >
                {ltc.toFixed(8)} LTC <Copy className="h-3 w-3" />
              </button>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); copy(LTC_PAY_ADDRESS); }}
              className="w-full font-mono text-[10px] break-all text-left rounded-lg bg-input border border-border px-2 py-1.5 hover:border-primary inline-flex items-center gap-1 justify-between"
            >
              <span>{LTC_PAY_ADDRESS}</span>
              <Copy className="h-3 w-3 flex-shrink-0" />
            </button>
            <div className="flex items-start gap-1.5 pt-1">
              <Check className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-muted-foreground text-[10px]">
                Card payments activate instantly. For LTC, email the txid to support. Rate ${ltcUsd.toFixed(2)}/LTC.
              </p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}