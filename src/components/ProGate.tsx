import { Link } from "@tanstack/react-router";
import { Lock, ShieldCheck, Clock } from "lucide-react";
import { PRO_EXPIRED_MESSAGE, TRIAL_DAYS, type ProState } from "@/lib/pro";

/** Static mainnet indicator — LTCme.click is mainnet only. */
export function NetworkToggle() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-1 text-[11px] text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      Litecoin Mainnet
    </span>
  );
}

export function TrialBadge({ state }: { state: ProState }) {
  if (state.loading || !state.inTrial) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] text-primary">
      <Clock className="h-3 w-3" />
      {state.trialDaysLeft} {state.trialDaysLeft === 1 ? "day" : "days"} left in free trial
    </span>
  );
}

export function ProExpiredNotice({ state }: { state: ProState }) {
  if (!state.expired) return null;
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4 text-sm">
      <p className="text-muted-foreground">{PRO_EXPIRED_MESSAGE}</p>
    </div>
  );
}

/**
 * Locked preview. Renders the real feature during the free trial or with an
 * active subscription, otherwise a preview with an explicit upgrade path.
 */
export function ProLock({
  state,
  title,
  purpose,
  unlocks,
  preview,
  children,
}: {
  state: ProState;
  title: string;
  purpose: string;
  unlocks: string[];
  preview?: React.ReactNode;
  children: React.ReactNode;
}) {
  if (state.pro) return <>{children}</>;
  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Lock className="h-4 w-4 text-primary" />
        <h3 className="font-semibold">{title}</h3>
        <span className="ml-auto text-[10px] uppercase tracking-wide text-primary">Quantum Guard Pro</span>
      </div>
      <p className="text-sm text-muted-foreground">{purpose}</p>
      {preview && (
        <div className="rounded-xl border border-border bg-background/50 p-3 text-xs text-muted-foreground">
          <div className="text-[10px] uppercase tracking-wide mb-2 text-primary">Sample preview</div>
          {preview}
        </div>
      )}
      <ul className="text-xs text-muted-foreground space-y-1">
        {unlocks.map((u) => (
          <li key={u} className="flex gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
            {u}
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-muted-foreground">
        Every account gets {TRIAL_DAYS} days of full access free. Your free wallet keeps working either way.
      </p>
      <div className="pt-1">
        <Link
          to="/guard"
          className="inline-block rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-medium hover:opacity-90"
        >
          Upgrade to Quantum Guard Pro
        </Link>
      </div>
    </div>
  );
}
