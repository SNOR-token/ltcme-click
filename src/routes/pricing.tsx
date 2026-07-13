import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({ meta: [{ title: "Plans — LTCme.click" }] }),
  component: PricingPage,
});

const PLANS = [
  { id: "monthly",   name: "Monthly",   price: "$4.99",  period: "/ month",    badge: undefined,     save: "" },
  { id: "quarterly", name: "3 Months",  price: "$9.99",  period: "/ 3 months", badge: "Popular",     save: "Save 33%" },
  { id: "yearly",    name: "Yearly",    price: "$19.99", period: "/ year",     badge: "Best value",  save: "Save 67%" },
];

function PricingPage() {
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
        {PLANS.map((p) => (
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
            <ul className="mt-5 space-y-2 text-sm">
              <Feat>Unlimited LTCme AI messages</Feat>
              <Feat>Priority responses</Feat>
              <Feat>All wallet features free forever</Feat>
              <Feat>Cancel anytime</Feat>
            </ul>
            <button
              disabled
              className="mt-6 w-full rounded-full bg-primary text-primary-foreground px-5 py-3 text-sm font-medium btn-glow disabled:opacity-60"
            >
              Subscribe (coming soon)
            </button>
          </div>
        ))}
      </div>

      <div className="max-w-2xl mx-auto mt-10 text-center text-xs text-muted-foreground">
        Payments are being finalized. Wallet features (create, import, send, receive, tools) are free and available now.{" "}
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