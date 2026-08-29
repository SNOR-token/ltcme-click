import { useMemo } from "react";
import { loadStore, needsVaultMigration } from "@/lib/ltc/storage";
import { loadMultisig } from "@/lib/ltc/multisig";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";

type Severity = "ok" | "warn" | "crit";

interface Check {
  id: string;
  title: string;
  detail: string;
  severity: Severity;
}

export function SecurityHealth() {
  const checks = useMemo(() => {
    const wallets = loadStore().wallets;
    const ms = typeof window !== "undefined" ? loadMultisig() : [];
    const list: Check[] = [];

    if (wallets.length === 0) {
      list.push({
        id: "nowallet",
        title: "No wallet yet",
        detail: "Create or import a wallet to start. Back up the seed offline before funding.",
        severity: "warn",
      });
    }

    const legacy = wallets.filter((w) => needsVaultMigration(w));
    if (legacy.length > 0) {
      list.push({
        id: "legacy",
        title: `${legacy.length} wallet(s) need vault migration`,
        detail: "Older wallets stored secrets in plaintext. Unlock once with a new vault password on Send to encrypt them.",
        severity: "crit",
      });
    } else if (wallets.some((w) => w.vault)) {
      list.push({
        id: "vault",
        title: "Encrypted vault in use",
        detail: "Secrets are stored with authenticated encryption. Keep your vault password and paper seed backup.",
        severity: "ok",
      });
    }

    const watchOnly = wallets.filter((w) => w.meta.kind === "watch");
    if (watchOnly.length && wallets.every((w) => w.meta.kind === "watch")) {
      list.push({
        id: "watch",
        title: "Watch-only only",
        detail: "You can see balances but cannot sign. Import a seed or use multisig cosigners to spend.",
        severity: "warn",
      });
    }

    if (ms.length > 0) {
      list.push({
        id: "ms",
        title: `${ms.length} multisig policy(ies)`,
        detail: "Verify cosigner xpubs and policy fingerprints offline with each signer before large deposits.",
        severity: "ok",
      });
    } else {
      list.push({
        id: "noms",
        title: "No multisig configured",
        detail: "Optional: use Heightened Security multisig for shared control and reduced single-key risk.",
        severity: "warn",
      });
    }

    list.push({
      id: "backup",
      title: "Offline seed backup",
      detail: "Confirm you can restore from paper/metal backup on a separate device. LTCme cannot recover lost seeds.",
      severity: "warn",
    });

    list.push({
      id: "pq",
      title: "Quantum readiness",
      detail: "Litecoin ECDSA is not post-quantum. Review the Quantum Readiness section for hygiene and migration context.",
      severity: "warn",
    });

    return list;
  }, []);

  const icon = (s: Severity) => {
    if (s === "ok") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    if (s === "crit") return <XCircle className="h-4 w-4 text-destructive" />;
    return <AlertCircle className="h-4 w-4 text-amber-500" />;
  };

  return (
    <div className="space-y-2">
      {checks.map((c) => (
        <div key={c.id} className="rounded-xl border border-border bg-card/40 p-3 flex items-start gap-2.5">
          <div className="mt-0.5">{icon(c.severity)}</div>
          <div>
            <div className="text-sm font-medium">{c.title}</div>
            <p className="text-xs text-muted-foreground mt-0.5">{c.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
