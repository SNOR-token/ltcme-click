import type { ReactNode } from "react";
import { ShieldCheck, LockKeyhole, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { ProAccess } from "@/lib/pro";

/** Static mainnet indicator — LTCme.click is mainnet only. */
export function NetworkToggle() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-1 text-[11px] text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      Litecoin Mainnet
    </span>
  );
}

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

export function ProBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-primary/15 border border-primary/40 px-2.5 py-1 text-[11px] font-medium text-primary ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      LTCme Pro
    </span>
  );
}

export function ProFeatureTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/30 px-2 py-0.5 text-[10px] font-medium text-primary/80">
      <span className="h-1 w-1 rounded-full bg-primary" />
      {children}
    </span>
  );
}

type ProLockProps = {
  state: ProAccess;
  title: string;
  purpose: string;
  unlocks: string[];
  preview?: ReactNode;
  children: ReactNode;
};

export function ProLock({
  state,
  title,
  purpose,
  unlocks,
  preview,
  children,
}: ProLockProps) {
  if (state.loading) {
    return (
      <section className="rounded-2xl border border-border bg-card/50 p-5">
        <div className="flex items-center gap-2">
          <LockKeyhole className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">{title}</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Checking Heightened Security access…
        </p>
      </section>
    );
  }

  if (state.hasAccess) {
    return <>{children}</>;
  }

  return (
    <section className="rounded-2xl border border-primary/30 bg-primary/5 overflow-hidden">
      <div className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-semibold">{title}</h2>
              <ProBadge />
            </div>

            <p className="mt-1 text-sm text-muted-foreground">{purpose}</p>
          </div>
        </div>

        {preview && (
          <div className="rounded-xl border border-border bg-background/50 p-3 text-xs text-muted-foreground">
            <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground/70">
              Preview
            </div>
            {preview}
          </div>
        )}

        <div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">
            Unlocks
          </div>

          <ul className="grid gap-1.5 md:grid-cols-2 text-sm text-muted-foreground">
            {unlocks.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <Link
          to="/buy"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Activate Heightened Security
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

type ProExpiredNoticeProps = {
  state: ProAccess;
};

export function ProExpiredNotice({ state }: ProExpiredNoticeProps) {
  if (state.loading || !state.expired) {
    return null;
  }

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
      <div className="flex items-start gap-3">
        <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />

        <div>
          <div className="text-sm font-medium">
            Heightened Security subscription expired
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            Your core Litecoin wallet functions remain available. Renew to
            restore Quantum Guard, advanced monitoring, PQ Lab and other
            Heightened Security features.
          </p>

          <Link
            to="/buy"
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            Renew Heightened Security
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
