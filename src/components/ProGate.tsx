import { Link } from "@tanstack/react-router";
import { Lock, ShieldCheck, FlaskConical } from "lucide-react";
import { useNetworkMode, setNetworkMode, TESTNET_NOTICE } from "@/lib/ltc/network-mode";
import { PRO_EXPIRED_MESSAGE, type ProState } from "@/lib/pro";

export function TestnetBanner() {
  const [mode, setMode] = useNetworkMode();
  if (mode !== "testnet") return null;
  return (
    <div className="sticky top-0 z-30 bg-primary text-primary-foreground text-xs font-semibold text-center px-4 py-1.5 flex items-center justify-center gap-3">
      <FlaskConical className="h-3.5 w-3.5" />
      <span>{TESTNET_NOTICE}</span>
      <button onClick={() => setMode("mainnet")} className="underline underline-offset-2 font-normal">
        Switch to mainnet
      </button>
    </div>
  );
}

export function NetworkToggle() {
  const [mode, setMode] = useNetworkMode();
  return (
    <div className="inline-flex rounded-full border border-border bg-background/60 p-0.5 text-[11px]">
      {(["mainnet", "testnet"] as const).map((m) => (
        <button
          key={m}
          onClick={() => setMode(m)}
          className={`px-2.5 py-1 rounded-full capitalize transition ${
            mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {m}
        </button>
      ))}
    </div>
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
 * Locked preview. Renders the real feature when Pro access is available
 * (always on testnet), otherwise a preview with an explicit upgrade path.
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
      <div className="flex flex-wrap gap-2 pt-1">
        <Link
          to="/guard"
          className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-medium hover:opacity-90"
        >
          Upgrade to Quantum Guard Pro
        </Link>
        <button
          onClick={() => setNetworkMode("testnet")}
          className="rounded-lg border border-primary/40 px-3 py-2 text-xs hover:bg-primary/10"
        >
          Try it free on testnet
        </button>
      </div>
    </div>
  );
}
