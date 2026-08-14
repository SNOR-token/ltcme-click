import { Bot, Radar, ShieldCheck, LineChart } from "lucide-react";

export const PRO_PILLARS = [
  {
    icon: Bot,
    title: "Unlimited AI agent",
    body: "Unlimited messages with a wallet-aware Litecoin agent that reads your public addresses, explains transactions and drafts plans you approve.",
    free: "5 free messages",
  },
  {
    icon: Radar,
    title: "Continuous monitoring & alerts",
    body: "Background scanning of every wallet and watch-only vault for address reuse, exposed public keys, dust attacks and fee targets.",
    free: "One-off manual check",
  },
  {
    icon: ShieldCheck,
    title: "Quantum migration planning",
    body: "A step-by-step Protection Refresh plan: which addresses to retire, where to move funds, and what it costs at current fees.",
    free: "Status only",
  },
  {
    icon: LineChart,
    title: "Earn intelligence & reports",
    body: "Yield comparison and monitoring across vetted LTC opportunities, plus CSV/tax reports and labelled transaction history.",
    free: "Read-only list",
  },
] as const;

export function ProValueGrid({ dense = false }: { dense?: boolean }) {
  return (
    <div className={`grid gap-3 ${dense ? "sm:grid-cols-2" : "sm:grid-cols-2"}`}>
      {PRO_PILLARS.map((p) => (
        <div key={p.title} className="rounded-2xl card-glass p-4">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              <p.icon className="h-4 w-4" />
            </span>
            <h3 className="font-semibold text-sm">{p.title}</h3>
          </div>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{p.body}</p>
          <p className="mt-2 eyebrow">Free plan: {p.free}</p>
        </div>
      ))}
    </div>
  );
}