import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, Plus, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import {
  VAULT_CATEGORIES,
  addWatch,
  removeWatch,
  updateWatch,
  useWatchList,
  type VaultCategory,
} from "@/lib/ltc/watchonly";
import { getBalances } from "@/lib/ltc/api";
import { formatLtc } from "@/lib/ltc/network";
import { useNetworkMode } from "@/lib/ltc/network-mode";
import { useProAccess } from "@/lib/pro";
import { ProLock, NetworkToggle, ProExpiredNotice } from "@/components/ProGate";

export const Route = createFileRoute("/_authenticated/vaults")({
  head: () => ({
    meta: [
      { title: "Watch-Only Vaults — LTCme.click" },
      { name: "description", content: "Monitor hardware wallets, cold storage, business, donation and family Litecoin addresses in one watch-only dashboard." },
      { property: "og:title", content: "Watch-Only Vaults — LTCme.click" },
      { property: "og:description", content: "Monitor hardware wallets, cold storage, business, donation and family Litecoin addresses in one watch-only dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VaultsPage,
});

function VaultsPage() {
  const [mode] = useNetworkMode();
  const pro = useProAccess();
  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
          <Eye />
        </div>
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-2xl md:text-3xl font-bold">Watch-Only Vaults</h1>
          <p className="text-sm text-muted-foreground">
            Track public Litecoin addresses you do not spend from. Watch-only means viewing only — never spending
            authority.
          </p>
        </div>
        <NetworkToggle />
      </div>
      <ProExpiredNotice state={pro} />
      <ProLock
        state={pro}
        title="Watch-only vaults"
        purpose="Monitor hardware-wallet accounts, cold storage, business wallets, donation addresses, family wallets and any other public Litecoin address from one dashboard."
        unlocks={[
          "Unlimited watch-only addresses",
          "Categories and labels per vault",
          "Balances rolled into your exposure summary",
          "Included in CSV and annual reports",
        ]}
        preview={
          <div className="space-y-1">
            <div>Cold storage — ltc1q…k4d — 12.40000000 LTC</div>
            <div>Donation — ltc1q…9ap — 0.87213400 LTC</div>
          </div>
        }
      >
        <VaultManager network={mode} />
      </ProLock>
      <p className="text-[11px] text-muted-foreground">
        Watch-only vaults hold no keys and grant no spending authority. Only public addresses are stored, on this
        device.
      </p>
    </div>
  );
}

function VaultManager({ network }: { network: "mainnet" | "testnet" }) {
  const { entries } = useWatchList(network);
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<VaultCategory>(VAULT_CATEGORIES[0]);
  const [balances, setBalances] = useState<Record<string, number>>({});

  useEffect(() => {
    if (entries.length === 0) return;
    getBalances(entries.map((e) => e.address)).then(setBalances).catch(() => {});
  }, [entries, network]);

  function add() {
    const a = address.trim();
    if (!a) return;
    addWatch({ address: a, label: label.trim() || "Vault", category, network });
    setAddress("");
    setLabel("");
    toast.success("Watch-only address added");
  }

  const total = entries.reduce((s, e) => s + (balances[e.address] ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card/50 p-4 space-y-2">
        <div className="grid md:grid-cols-3 gap-2">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Public Litecoin address"
            className="md:col-span-2 rounded-lg bg-input border border-border px-3 py-2 text-sm font-mono"
          />
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label"
            className="rounded-lg bg-input border border-border px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as VaultCategory)}
            className="rounded-lg bg-input border border-border px-3 py-2 text-sm"
          >
            {VAULT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            onClick={add}
            className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm inline-flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Add watch-only
          </button>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Watching {entries.length} address(es) · {formatLtc(total)} LTC total
        </div>
      )}

      <div className="space-y-2">
        {entries.map((e) => (
          <div key={e.id} className="rounded-xl border border-border bg-card/50 p-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <input
                value={e.label}
                onChange={(ev) => updateWatch(e.id, { label: ev.target.value })}
                className="bg-transparent font-medium text-sm outline-none flex-1 min-w-0"
              />
              <span className="text-[10px] rounded-full border border-border px-2 py-0.5 text-muted-foreground">
                {e.category}
              </span>
              <span className="text-[10px] rounded-full bg-primary/15 text-primary px-2 py-0.5">Watch-only</span>
              <button onClick={() => removeWatch(e.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(e.address);
                  toast.success("Copied");
                }}
                className="font-mono truncate hover:text-primary inline-flex items-center gap-1"
              >
                {e.address} <Copy className="h-3 w-3 flex-shrink-0" />
              </button>
              <span className="ml-auto whitespace-nowrap">{formatLtc(balances[e.address] ?? 0)} LTC</span>
            </div>
            <input
              value={e.note ?? ""}
              onChange={(ev) => updateWatch(e.id, { note: ev.target.value })}
              placeholder="Note"
              className="w-full bg-transparent text-xs text-muted-foreground outline-none border-t border-border/60 pt-1.5"
            />
          </div>
        ))}
        {entries.length === 0 && (
          <p className="text-sm text-muted-foreground">No watch-only addresses on {network} yet.</p>
        )}
      </div>
    </div>
  );
}
