/** Static mainnet indicator — LTCme.click is mainnet only. */
export function NetworkToggle() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-1 text-[11px] text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      Litecoin Mainnet
    </span>
  );
}

/**
 * Pro features list for subscription page
 */
export const PRO_FEATURES = [
  "Unlimited LTCme AI messages on every page",
  "Advanced wallet analytics and insights",
  "Address exposure & privacy analysis",
  "UTXO consolidation guidance",
  "Priority transaction monitoring",
  "Custom fee rate recommendations",
  "Multi-signature wallet creation",
  "Batch transaction support",
  "Coin control & UTXO selection",
  "Transaction history export",
  "Watch-only address management",
  "Custom network fee alerts",
  "Early access to new features",
];

/**
 * Enhanced Pro badge component
 */
export function ProBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-primary/15 border border-primary/40 px-2.5 py-1 text-[11px] font-medium text-primary ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      LTCme Pro
    </span>
  );
}

/**
 * Feature tag for Pro features
 */
export function ProFeatureTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/30 px-2 py-0.5 text-[10px] font-medium text-primary/80">
      <span className="h-1 w-1 rounded-full bg-primary" />
      {children}
    </span>
  );
}
