import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { FileSpreadsheet, Download } from "lucide-react";
import { loadStore } from "@/lib/ltc/storage";
import { useWatchList } from "@/lib/ltc/watchonly";
import { getAddressInfo, getRecentTxs, getLtcUsdPrice, estimateFeeRate } from "@/lib/ltc/api";
import { formatLtc, fromSatoshis } from "@/lib/ltc/network";
import { useNetworkMode } from "@/lib/ltc/network-mode";
import { useProAccess } from "@/lib/pro";
import { downloadCsv, loadLabels, setLabel, TAX_DISCLAIMER } from "@/lib/reports";
import { ProLock, NetworkToggle, ProExpiredNotice } from "@/components/ProGate";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Advanced Reports — LTCme.click" },
      { name: "description", content: "CSV transaction exports, fee summaries, address-use and wallet-security reports, labels and accountant-friendly annual exports." },
      { property: "og:title", content: "Advanced Reports — LTCme.click" },
      { property: "og:description", content: "CSV transaction exports, fee summaries, address-use and wallet-security reports and annual exports." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReportsPage,
});

interface AddrRow {
  address: string;
  wallet: string;
  balanceSats: number;
  txCount: number;
  type: string;
}

function typeOf(a: string) {
  if (a.startsWith("ltc1") || a.startsWith("tltc1")) return "Native SegWit";
  if (/^[M3Q2]/.test(a)) return "P2SH-SegWit";
  return "Legacy";
}

function ReportsPage() {
  const [mode] = useNetworkMode();
  const pro = useProAccess();
  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
          <FileSpreadsheet />
        </div>
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-2xl md:text-3xl font-bold">Advanced Reports</h1>
          <p className="text-sm text-muted-foreground">
            Exports built in your browser from public chain data. Keys are never involved.
          </p>
        </div>
        <NetworkToggle />
      </div>
      <ProExpiredNotice state={pro} />
      <ProLock
        state={pro}
        title="Advanced reports"
        purpose="Export transactions, fees, address use and wallet-security findings for your own records or your accountant."
        unlocks={[
          "CSV transaction exports",
          "Fee summaries and address-use reports",
          "Wallet-security report",
          "Historical value estimates",
          "User-defined labels and notes",
          "Accountant-friendly annual exports",
        ]}
        preview={<div>Sample row: 2026-02-11, ltc1q…8f2, receive, 0.41000000 LTC, ~$38.90 est.</div>}
      >
        <ReportBuilder network={mode} />
      </ProLock>
      <p className="text-[11px] text-muted-foreground">{TAX_DISCLAIMER}</p>
    </div>
  );
}

function ReportBuilder({ network }: { network: "mainnet" }) {
  const { entries } = useWatchList(network);
  const [rows, setRows] = useState<AddrRow[]>([]);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [price, setPrice] = useState(0);
  const [feeRate, setFeeRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => setLabels(loadLabels()), []);
  useEffect(() => {
    getLtcUsdPrice().then(setPrice).catch(() => {});
    estimateFeeRate().then(setFeeRate).catch(() => {});
  }, [network]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const all = [
      ...loadStore().wallets.flatMap((w) => w.addresses.map((a) => ({ address: a.address, wallet: w.meta.name }))),
      ...entries.map((e) => ({ address: e.address, wallet: `${e.label} (watch-only)` })),
    ];
    (async () => {
      const out: AddrRow[] = [];
      for (const a of all) {
        try {
          const i = await getAddressInfo(a.address);
          out.push({ ...a, balanceSats: i.balanceSats, txCount: i.txCount, type: typeOf(a.address) });
        } catch {
          out.push({ ...a, balanceSats: 0, txCount: 0, type: typeOf(a.address) });
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
  }, [entries, network]);

  const totals = useMemo(() => {
    const sats = rows.reduce((s, r) => s + r.balanceSats, 0);
    return { sats, usd: fromSatoshis(sats) * price };
  }, [rows, price]);

  async function exportTransactions() {
    const out: (string | number)[][] = [
      ["date", "wallet", "address", "txid", "confirmed", "label", "ltc_price_usd_now"],
    ];
    for (const r of rows) {
      const txs = await getRecentTxs(r.address, 50);
      for (const t of txs) {
        out.push([
          t.time ? new Date(t.time * 1000).toISOString().slice(0, 10) : "pending",
          r.wallet,
          r.address,
          t.txid,
          t.confirmations > 0 ? "yes" : "no",
          labels[t.txid] ?? "",
          price.toFixed(2),
        ]);
      }
    }
    downloadCsv(`ltcme-transactions-${network}.csv`, out);
  }

  function exportAddressUse() {
    downloadCsv(`ltcme-address-use-${network}.csv`, [
      ["address", "wallet", "type", "tx_count", "reused", "balance_ltc", "label"],
      ...rows.map((r) => [
        r.address,
        r.wallet,
        r.type,
        r.txCount,
        r.txCount > 1 ? "yes" : "no",
        formatLtc(r.balanceSats),
        labels[r.address] ?? "",
      ]),
    ]);
  }

  function exportSecurity() {
    downloadCsv(`ltcme-wallet-security-${network}.csv`, [
      ["address", "type", "finding", "severity"],
      ...rows.flatMap((r) => {
        const f: (string | number)[][] = [];
        if (r.txCount > 1) f.push([r.address, r.type, "Address reused — public key exposed and history linked", "medium"]);
        if (r.type === "Legacy" && r.balanceSats > 0) f.push([r.address, r.type, "Funds on legacy address — higher fees, earlier key exposure", "low"]);
        if (f.length === 0) f.push([r.address, r.type, "No findings", "none"]);
        return f;
      }),
    ]);
  }

  function exportFees() {
    downloadCsv(`ltcme-fee-summary-${network}.csv`, [
      ["metric", "value"],
      ["current_recommended_fee_rate_sat_vb", feeRate],
      ["estimated_1in_2out_segwit_vbytes", 141],
      ["estimated_fee_sats", Math.ceil(141 * feeRate)],
      ["estimated_fee_ltc", formatLtc(Math.ceil(141 * feeRate))],
      ["estimated_fee_usd", (fromSatoshis(Math.ceil(141 * feeRate)) * price).toFixed(2)],
    ]);
  }

  function exportAnnual() {
    downloadCsv(`ltcme-annual-${year}-${network}.csv`, [
      [`LTCme.click annual export ${year} (${network})`],
      [TAX_DISCLAIMER],
      [],
      ["address", "wallet", "type", "tx_count", "balance_ltc", "estimated_value_usd", "label"],
      ...rows.map((r) => [
        r.address,
        r.wallet,
        r.type,
        r.txCount,
        formatLtc(r.balanceSats),
        (fromSatoshis(r.balanceSats) * price).toFixed(2),
        labels[r.address] ?? "",
      ]),
      [],
      ["total_ltc", formatLtc(totals.sats)],
      ["estimated_total_usd", totals.usd.toFixed(2)],
    ]);
  }

  const buttons: [string, () => void][] = [
    ["CSV transaction export", exportTransactions],
    ["Address-use report", exportAddressUse],
    ["Wallet-security report", exportSecurity],
    ["Fee summary", exportFees],
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <Stat label="Addresses" value={loading ? "…" : String(rows.length)} />
        <Stat label="Total balance" value={`${formatLtc(totals.sats)} LTC`} />
        <Stat label="Estimated value" value={price ? `~$${totals.usd.toFixed(2)}` : "—"} />
        <Stat label="Fee rate" value={feeRate ? `${feeRate} sat/vB` : "—"} />
      </div>

      <div className="flex flex-wrap gap-2">
        {buttons.map(([label, fn]) => (
          <button
            key={label}
            onClick={fn}
            className="rounded-lg border border-border px-3 py-2 text-xs inline-flex items-center gap-1.5 hover:border-primary"
          >
            <Download className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
        <div className="inline-flex items-center gap-1.5">
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-20 rounded-lg bg-input border border-border px-2 py-2 text-xs"
          />
          <button
            onClick={exportAnnual}
            className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs inline-flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" /> Annual export
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/50 p-4 space-y-2">
        <h3 className="font-semibold text-sm">Labels and notes</h3>
        {rows.map((r) => (
          <div key={r.address} className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono truncate max-w-[240px]">{r.address}</span>
            <span className="text-muted-foreground">{r.type}</span>
            <input
              defaultValue={labels[r.address] ?? ""}
              onBlur={(e) => {
                setLabel(r.address, e.target.value);
                setLabels(loadLabels());
              }}
              placeholder="Label this address"
              className="flex-1 min-w-[140px] rounded-lg bg-input border border-border px-2 py-1"
            />
          </div>
        ))}
        {rows.length === 0 && !loading && <p className="text-sm text-muted-foreground">No addresses yet.</p>}
      </div>
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
