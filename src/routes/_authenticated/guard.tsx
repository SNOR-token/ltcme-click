import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Shield, ShieldCheck, Activity, Bell, Bot, ClipboardList, RefreshCw } from "lucide-react";
import { loadStore } from "@/lib/ltc/storage";
import { useWatchList } from "@/lib/ltc/watchonly";
import { getBalances, getAddressInfo } from "@/lib/ltc/api";
import { formatLtc } from "@/lib/ltc/network";
import { useNetworkMode } from "@/lib/ltc/network-mode";
import { useProAccess } from "@/lib/pro";
import { ProLock, ProExpiredNotice, NetworkToggle } from "@/components/ProGate";
import { PlansInline } from "@/components/PlansInline";
import { AGENT_CAPABILITIES, AGENT_PROHIBITIONS } from "@/lib/agent-safety";

export const Route = createFileRoute("/_authenticated/guard")({
  head: () => ({
    meta: [
      { title: "Quantum Guard — LTCme.click" },
      { name: "description", content: "Free exposure summary for your Litecoin addresses, plus Quantum Guard Pro monitoring, AI analysis, alerts and reports." },
      { property: "og:title", content: "Quantum Guard — LTCme.click" },
      { property: "og:description", content: "Free exposure summary for your Litecoin addresses, plus Quantum Guard Pro monitoring, AI analysis, alerts and reports." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GuardPage,
});

interface Row {
  address: string;
  label: string;
  kind: "wallet" | "watch-only";
  balanceSats: number;
  txCount: number;
}

function addrType(a: string) {
  if (a.startsWith("ltc1") || a.startsWith("tltc1")) return "Native SegWit";
  if (a.startsWith("M") || a.startsWith("3") || a.startsWith("Q") || a.startsWith("2")) return "P2SH-SegWit";
  return "Legacy";
}

function GuardPage() {
  const [mode] = useNetworkMode();
  const pro = useProAccess();
  const { entries } = useWatchList(mode);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const wallets = loadStore().wallets.flatMap((w) =>
      w.addresses.map((a) => ({ address: a.address, label: w.meta.name ?? "Wallet", kind: "wallet" as const })),
    );
    const watch = entries.map((e) => ({ address: e.address, label: e.label, kind: "watch-only" as const }));
    const all = [...wallets, ...watch];
    (async () => {
      const out: Row[] = [];
      for (const a of all) {
        try {
          const info = await getAddressInfo(a.address);
          out.push({ ...a, balanceSats: info.balanceSats, txCount: info.txCount });
        } catch {
          out.push({ ...a, balanceSats: 0, txCount: 0 });
        }
      }
      if (alive) {
        setRows(out);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [entries, mode, nonce]);

  const summary = useMemo(() => {
    const total = rows.reduce((s, r) => s + r.balanceSats, 0);
    const reused = rows.filter((r) => r.txCount > 1);
    const exposed = rows.filter((r) => r.txCount > 0 && addrType(r.address) === "Legacy");
    const funded = rows.filter((r) => r.balanceSats > 0);
    const largest = funded.slice().sort((a, b) => b.balanceSats - a.balanceSats)[0];
    const concentration = total > 0 && largest ? Math.round((largest.balanceSats / total) * 100) : 0;
    return { total, reused, exposed, funded, concentration, largest };
  }, [rows]);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
          <Shield />
        </div>
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-2xl md:text-3xl font-bold">Quantum Guard</h1>
          <p className="text-sm text-muted-foreground">
            Free safety foundations and a basic exposure summary for every address you hold or watch.
          </p>
        </div>
        <NetworkToggle />
        <button
          onClick={() => setNonce((n) => n + 1)}
          className="rounded-lg border border-border px-3 py-2 text-xs inline-flex items-center gap-1.5 hover:border-primary"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      <ProExpiredNotice state={pro} />

      {!pro.pro && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-2">
          <h2 className="text-lg font-semibold">Turn your Litecoin wallet into an active security partner.</h2>
          <p className="text-sm text-muted-foreground">
            Your free wallet keeps you in control. Quantum Guard Pro continuously analyzes exposure, explains
            transactions, watches for risk, and prepares safer actions—without ever accessing your private keys.
          </p>
          <PlansInline compact />
        </div>
      )}

      {/* FREE: basic exposure summary */}
      <section className="rounded-2xl border border-border bg-card/50 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Basic exposure summary</h2>
          <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">Free</span>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Scanning public chain data…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No addresses yet. Add a wallet or a watch-only address to see your exposure.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <Stat label="Addresses tracked" value={String(rows.length)} />
              <Stat label="Total balance" value={`${formatLtc(summary.total)} LTC`} />
              <Stat label="Reused addresses" value={String(summary.reused.length)} />
              <Stat label="Largest-address share" value={`${summary.concentration}%`} />
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 pt-1">
              {summary.reused.length > 0 && (
                <li>• {summary.reused.length} address(es) have been used more than once — reuse links your history and exposes the public key.</li>
              )}
              {summary.exposed.length > 0 && (
                <li>• {summary.exposed.length} legacy address(es) with spend history. Modern bech32 addresses are cheaper and reveal the public key later.</li>
              )}
              {summary.concentration > 70 && summary.total > 0 && (
                <li>• {summary.concentration}% of your balance sits on a single address. Consider splitting across addresses.</li>
              )}
              <li>• Only public addresses and transaction ids were used for this summary. Your keys never leave this device.</li>
            </ul>
          </>
        )}
      </section>

      {/* PRO features */}
      <ProLock
        state={pro}
        title="Continuous exposure monitoring"
        purpose="Keeps watching your mainnet addresses in the background and flags newly reused addresses, exposed public keys, dust attacks and unusual inbound activity."
        unlocks={["Background monitoring of every wallet and vault", "Change alerts on wallet exposure", "Target network-fee levels", "Litecoin security update briefings"]}
        preview={<div>Sample: “ltc1q…8f2 was reused today (4 spends). Exposure changed from Low to Medium.”</div>}
      >
        <section className="rounded-2xl border border-border bg-card/50 p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Continuous exposure monitoring</h2>
            <span className="ml-auto text-[10px] uppercase tracking-wide text-primary">Active</span>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1">
            {rows.slice(0, 6).map((r) => (
              <li key={r.address} className="flex justify-between gap-3">
                <span className="font-mono text-xs truncate">{r.address}</span>
                <span className="text-xs">
                  {r.txCount > 1 ? "Reused — medium exposure" : r.txCount === 1 ? "Used once — low exposure" : "Unused — minimal exposure"}
                </span>
              </li>
            ))}
            {rows.length === 0 && <li>Nothing to monitor yet.</li>}
          </ul>
          <p className="text-[11px] text-muted-foreground pt-1">
            Monitoring processes public addresses, script hashes and transaction ids only. Wallet secrets are never uploaded.
          </p>
        </section>
      </ProLock>

      <ProLock
        state={pro}
        title="Advanced AI analysis of mainnet activity"
        purpose="Ask the assistant to explain any transaction, analyze exposure across every wallet, recommend UTXOs and draft an unsigned protection plan."
        unlocks={["Deep transaction explanations", "Cross-wallet exposure analysis", "UTXO recommendations", "Unsigned transaction proposals you approve and sign locally"]}
        preview={<div>Sample: “Three UTXOs on a reused legacy address hold 62% of your balance. Consolidating at 4 sat/vB costs ~0.00021 LTC.”</div>}
      >
        <section className="rounded-2xl border border-border bg-card/50 p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Advanced AI analysis</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Open the assistant and ask it to analyze exposure, explain a transaction, or prepare a protection plan.
            It can read only the public data you approve.
          </p>
          <div className="grid md:grid-cols-2 gap-3 pt-2">
            <SafetyList title="The assistant may" items={AGENT_CAPABILITIES} tone="ok" />
            <SafetyList title="The assistant can never" items={AGENT_PROHIBITIONS} tone="no" />
          </div>
        </section>
      </ProLock>

      <ProLock
        state={pro}
        title="Protection Refresh planning"
        purpose="Generates a step-by-step plan to reduce exposure: which addresses to retire, where to move funds, and what it costs at current fee levels."
        unlocks={["Agentic protection plans", "Fee-aware migration steps", "Re-run whenever exposure changes"]}
        preview={<div>Sample plan: 1) Generate a fresh bech32 address · 2) Consolidate 3 reused UTXOs · 3) Verify and sign locally · 4) Confirm broadcast.</div>}
      >
        <ProtectionPlan rows={rows} />
      </ProLock>

      <ProLock
        state={pro}
        title="Pro alerts"
        purpose="Notifies you when exposure changes, when fees hit your target level, or when a relevant Litecoin security update lands."
        unlocks={["Exposure-change alerts", "Target network-fee alerts", "Litecoin security updates", "Legitimate post-quantum proposal tracking"]}
        preview={<div>Sample: “Fee target reached — 2 sat/vB. Good moment for your consolidation plan.”</div>}
      >
        <AlertPrefs />
      </ProLock>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/50 px-3 py-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

function SafetyList({ title, items, tone }: { title: string; items: string[]; tone: "ok" | "no" }) {
  return (
    <div className="rounded-xl border border-border bg-background/50 p-3">
      <div className="text-xs font-medium mb-1.5">{title}</div>
      <ul className="text-[11px] text-muted-foreground space-y-1">
        {items.map((i) => (
          <li key={i}>
            {tone === "ok" ? "✓" : "✕"} {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProtectionPlan({ rows }: { rows: Row[] }) {
  const reused = rows.filter((r) => r.txCount > 1 && r.balanceSats > 0);
  return (
    <section className="rounded-2xl border border-border bg-card/50 p-5 space-y-2">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">Protection Refresh plan</h2>
      </div>
      {reused.length === 0 ? (
        <p className="text-sm text-muted-foreground">No funded reused addresses found. Nothing urgent to migrate.</p>
      ) : (
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal pl-5">
          <li>Generate a fresh unused bech32 receiving address.</li>
          {reused.slice(0, 4).map((r) => (
            <li key={r.address}>
              Move {formatLtc(r.balanceSats)} LTC off reused address <span className="font-mono text-xs">{r.address}</span>.
            </li>
          ))}
          <li>Review the unsigned proposal in the TX Builder, sign locally, then confirm the broadcast yourself.</li>
        </ol>
      )}
      <p className="text-[11px] text-muted-foreground">
        Plans are proposals only. Nothing is signed or broadcast without your explicit confirmation.
      </p>
    </section>
  );
}

function AlertPrefs() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("ltcme.alerts.v1") || "{}");
    } catch {
      return {};
    }
  });
  const items = [
    ["fees", "Target network-fee levels"],
    ["exposure", "Changes in wallet exposure"],
    ["security", "Litecoin security updates"],
    ["pq", "Legitimate Litecoin post-quantum proposals"],
  ] as const;
  function toggle(k: string) {
    const next = { ...prefs, [k]: !prefs[k] };
    setPrefs(next);
    localStorage.setItem("ltcme.alerts.v1", JSON.stringify(next));
  }
  return (
    <section className="rounded-2xl border border-border bg-card/50 p-5 space-y-2">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">Pro alerts</h2>
      </div>
      <div className="space-y-1.5">
        {items.map(([k, label]) => (
          <label key={k} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!prefs[k]} onChange={() => toggle(k)} className="accent-[hsl(var(--primary))]" />
            {label}
          </label>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Only public addresses, script hashes, transaction ids and the notification choices above are ever processed
        remotely. Wallet secrets are never uploaded.
      </p>
    </section>
  );
}
