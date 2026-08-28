import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Sprout, AlertTriangle, ExternalLink, Bot, Info } from "lucide-react";
import { NetworkToggle } from "@/components/ProGate";
import {
  OPPORTUNITIES,
  RISK_PREFERENCES,
  RISK_LABEL_DISCLAIMER,
  EARN_DISCLAIMER,
  filterByRisk,
  netYield,
  type RiskPreference,
} from "@/lib/earn/opportunities";

export const Route = createFileRoute("/_authenticated/earn")({
  head: () => ({
    meta: [
      { title: "Earn — LTCme.click" },
      { name: "description", content: "Compare third-party Litecoin lending, liquidity and wrapped-LTC opportunities with fees, custody and risks made clear." },
      { property: "og:title", content: "Earn — LTCme.click" },
      { property: "og:description", content: "Compare third-party Litecoin lending, liquidity and wrapped-LTC opportunities with fees, custody and risks made clear." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EarnPage,
});

function EarnPage() {
  const [pref, setPref] = useState<RiskPreference>("balanced");
  const list = useMemo(
    () => filterByRisk(OPPORTUNITIES, pref).slice().sort((a, b) => netYield(b) - netYield(a)),
    [pref],
  );

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
          <Sprout />
        </div>
        <div className="flex-1 min-w-[220px]">
          <h1 className="text-2xl md:text-3xl font-bold">Find opportunities for your Litecoin.</h1>
          <p className="text-sm text-muted-foreground">
            Compare what's out there, in plain language, before you commit anything.
          </p>
        </div>
        <NetworkToggle />
      </div>

      <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 flex gap-3">
        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">{EARN_DISCLAIMER}</p>
      </div>

      <section className="rounded-2xl border border-border bg-card/50 p-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold">Your risk preference</h2>
          <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">Free</span>
        </div>
        <div className="grid sm:grid-cols-3 gap-2">
          {RISK_PREFERENCES.map((r) => (
            <button
              key={r.id}
              onClick={() => setPref(r.id)}
              className={`text-left rounded-xl border p-3 transition ${
                pref === r.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
              }`}
            >
              <div className="text-sm font-medium">{r.label}</div>
              <div className="text-[11px] text-muted-foreground mt-1">{r.blurb}</div>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground flex gap-2">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          {RISK_LABEL_DISCLAIMER}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Opportunities ({list.length})</h2>
        {list.map((o) => (
          <article key={o.id} className="rounded-2xl border border-border bg-card/50 p-5 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{o.provider}</h3>
              <span className="text-[10px] uppercase tracking-wide bg-muted px-2 py-0.5 rounded">{o.kind}</span>
              <span className="text-[10px] uppercase tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded">
                {o.network}
              </span>
              <div className="ml-auto text-right">
                <div className="font-semibold">{o.apy}% est. yield</div>
                <div className="text-[11px] text-muted-foreground">≈ {netYield(o)}% net after known costs</div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">{o.howYieldWorks}</p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
              <Fact label="Lockup" value={o.lockup} />
              <Fact label="Withdrawal" value={o.withdrawal} />
              <Fact label="Custody" value={o.selfCustody ? "You keep custody" : "Provider takes custody"} />
              <Fact label="Identity check" value={o.kyc ? "Required" : "Not required"} />
              <Fact label="Entry costs" value={`~${o.entryCostPct}% (network, swap, deposit)`} />
              <Fact label="Exit costs" value={`~${o.exitCostPct}% (withdrawal, bridge, network)`} />
              <Fact
                label="Native LTC?"
                value={o.requiresWrapping ? "Must be converted to wrapped LTC" : "Stays native LTC"}
              />
              <Fact label="Risk tier" value={RISK_PREFERENCES.find((r) => r.id === o.riskTier)!.label} />
            </div>

            {o.requiresWrapping && (
              <p className="text-xs text-amber-500">
                This option requires converting native LTC into wrapped LTC on another network. Wrapped LTC depends on a
                bridge and is not the same asset as the Litecoin you hold today.
              </p>
            )}

            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Risks</div>
              <ul className="text-xs text-muted-foreground space-y-1">
                {o.risks.map((r) => (
                  <li key={r}>• {r}</li>
                ))}
              </ul>
            </div>

            <a
              href={o.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs hover:border-primary"
            >
              Visit provider <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </article>
        ))}
        <p className="text-[11px] text-muted-foreground">
          Yields, fees and terms are estimates gathered from public provider information and change often. LTCme.click is
          not affiliated with these providers, does not custody your funds, and this is not financial advice.
        </p>
      </section>

        <section className="rounded-2xl border border-border bg-card/50 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Agentic Earn assistant</h2>
            <span className="ml-auto text-[10px] uppercase tracking-wide text-primary">Read-only</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Ask the assistant in the side panel to compare these options for your balance and risk preference
            (<strong className="text-foreground">{RISK_PREFERENCES.find((r) => r.id === pref)!.label}</strong>). It can
            explain, compare, estimate net earnings and draft a step-by-step deposit or withdrawal plan.
          </p>
          <div className="rounded-xl border border-border bg-background/50 p-3 text-xs text-muted-foreground space-y-1">
            <div className="text-[10px] uppercase tracking-wide text-primary">The assistant will never</div>
            <div>• Promise guaranteed returns</div>
            <div>• Deposit, bridge, swap, withdraw or rebalance funds automatically</div>
            <div>• Hide risks or fees, or pick an option just because its advertised APY is highest</div>
            <div>• Move anything without a full transaction preview and your explicit approval</div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            The assistant compares, explains and prepares — you always review and approve every transaction yourself.
          </p>
        </section>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-foreground">{value}</div>
    </div>
  );
}
