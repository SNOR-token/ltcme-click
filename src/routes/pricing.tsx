import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Copy, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { getLtcUsdPrice } from "@/lib/ltc/api";
import { toast } from "sonner";

export const Route = createFileRoute("/pricing")({
  head: () => ({ meta: [{ title: "Plans — LTCme.click" }] }),
  component: PricingPage,
});

const LTC_PAY_ADDRESS = "MLaCqgY8ZQUXn9hThwZoU5ohFxGuwfCug8";

const PLANS = [
  { id: "monthly",   name: "Monthly",   price: "$4.99",  usd: 4.99,  period: "/ month",    badge: undefined,     save: "" },
  { id: "quarterly", name: "3 Months",  price: "$9.99",  usd: 9.99,  period: "/ 3 months", badge: "Popular",     save: "Save 33%" },
  { id: "yearly",    name: "Yearly",    price: "$19.99", usd: 19.99, period: "/ year",     badge: "Best value",  save: "Save 67%" },
];

function PricingPage() {
  const [ltcUsd, setLtcUsd] = useState<number>(0);
  const [payWithLtc, setPayWithLtc] = useState<string | null>(null);

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
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-5xl mx-auto text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary mb-4">
          <Sparkles className="h-3.5 w-3.5" /> LTCme AI Plans
        </div>
        <h1 className="text-4xl font-bold">Unlock unlimited Litecoin AI</h1>
        <p className="mt-3 text-muted-foreground">Wallet features stay free. Get 5 free AI messages to try, then choose a plan.</p>
      </div>

      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-4">
        {PLANS.map((p) => {
          const ltcAmount = ltcUsd > 0 ? (p.usd / ltcUsd) : 0;
          const isOpen = payWithLtc === p.id;
          return (
          <div key={p.id} className={`card-glass rounded-3xl p-6 relative ${p.badge === "Best value" ? "border-primary" : ""}`}>
            {p.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary text-primary-foreground text-xs font-medium px-3 py-1 btn-glow">
                {p.badge}
              </div>
            )}
            <h3 className="text-lg font-semibold">{p.name}</h3>
            <div className="mt-3">
              <span className="text-4xl font-bold gradient-text">{p.price}</span>
              <span className="text-muted-foreground text-sm">{p.period}</span>
            </div>
            {p.save && <p className="text-xs text-primary mt-1">{p.save}</p>}
            {ltcUsd > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                ≈ <span className="text-foreground font-medium">{ltcAmount.toFixed(4)} LTC</span>
              </p>
            )}
            <ul className="mt-5 space-y-2 text-sm">
              <Feat>Unlimited LTCme AI messages</Feat>
              <Feat>Priority responses</Feat>
              <Feat>All wallet features free forever</Feat>
              <Feat>Cancel anytime</Feat>
            </ul>
            <button
              onClick={() => setPayWithLtc(isOpen ? null : p.id)}
              className="mt-6 w-full rounded-full bg-primary text-primary-foreground px-5 py-3 text-sm font-medium btn-glow"
            >
              {isOpen ? "Hide LTC details" : "Pay with Litecoin"}
            </button>
            {isOpen && (
              <div className="mt-4 rounded-2xl border border-border bg-background/40 p-3 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <button
                    onClick={() => copy(ltcAmount.toFixed(8))}
                    className="font-mono text-foreground inline-flex items-center gap-1 hover:text-primary"
                  >
                    {ltcAmount.toFixed(8)} LTC <Copy className="h-3 w-3" />
                  </button>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Send to</div>
                  <button
                    onClick={() => copy(LTC_PAY_ADDRESS)}
                    className="w-full font-mono text-[11px] break-all text-left rounded-lg bg-input border border-border px-2 py-2 hover:border-primary inline-flex items-center gap-1 justify-between"
                  >
                    <span>{LTC_PAY_ADDRESS}</span>
                    <Copy className="h-3 w-3 flex-shrink-0" />
                  </button>
                </div>
                <p className="text-muted-foreground pt-1">
                  After sending, email the txid to support and we'll activate your plan. Rate quoted at ${ltcUsd.toFixed(2)}/LTC.
                </p>
              </div>
            )}
          </div>
          );
        })}
      </div>

      <div className="max-w-2xl mx-auto mt-10 text-center text-xs text-muted-foreground">
        Wallet features (create, import, send, receive, tools) are free and available now.{" "}
        <Link to="/wallets" className="text-primary underline">Go to wallets →</Link>
      </div>
    </div>
  );
}

function Feat({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="h-4 w-4 text-primary mt-0.5" />
      <span>{children}</span>
    </li>
  );
}