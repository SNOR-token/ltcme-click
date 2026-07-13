import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { loadStore } from "@/lib/ltc/storage";
import { getUtxos, estimateFeeRate, broadcastTx } from "@/lib/ltc/api";
import { formatLtc, toSatoshis } from "@/lib/ltc/network";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/send")({
  head: () => ({ meta: [{ title: "Send LTC — LTCme.click" }] }),
  validateSearch: (s) => z.object({ walletId: z.string().optional() }).parse(s),
  component: SendPage,
});

function SendPage() {
  const { walletId } = Route.useSearch();
  const [wallets] = useState(loadStore().wallets);
  const [selected, setSelected] = useState<string | undefined>(walletId ?? wallets[0]?.meta.id);
  const wallet = useMemo(() => wallets.find((w) => w.meta.id === selected), [wallets, selected]);

  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [feeRate, setFeeRate] = useState<number>(10);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{ txid: string; feeSats: number; vbytes: number; rawHex: string } | null>(null);

  useEffect(() => {
    estimateFeeRate().then(setFeeRate).catch(() => {});
  }, []);

  if (wallets.length === 0) return <div className="p-10 text-muted-foreground">No wallets. Create one first.</div>;

  async function build() {
    if (!wallet) return;
    if (wallet.meta.kind === "watch") return toast.error("Watch-only wallet — no keys to sign with.");
    if (!wallet.secret) return toast.error("Wallet has no stored secret.");
    if (!to.trim()) return toast.error("Recipient required");
    const amt = Number(amount);
    if (!(amt > 0)) return toast.error("Amount required");
    setBusy(true);
    setPreview(null);
    try {
      const { validateAddress } = await import("@/lib/ltc/wallet");
      const v = validateAddress(to);
      if (!v.valid) throw new Error("Invalid Litecoin address");
      // Secret is plaintext: either JSON {mnemonic, passphrase} for HD wallets
      // or a raw WIF string for single-key imports.
      let mnemonic = wallet.secret;
      try {
        const parsed = JSON.parse(wallet.secret);
        if (parsed && typeof parsed.mnemonic === "string") {
          mnemonic = parsed.mnemonic;
        }
      } catch {
        // Not JSON — treat wallet.secret as the raw mnemonic/WIF.
      }

      // Fetch UTXOs for all wallet addresses
      const utxosByAddress: Record<string, Awaited<ReturnType<typeof getUtxos>>> = {};
      for (const a of wallet.addresses) {
        utxosByAddress[a.address] = await getUtxos(a.address);
      }

      const changeAddress = wallet.addresses[0].address;
      const { buildAndSignTx } = await import("@/lib/ltc/tx");
      const result = await buildAndSignTx({
        mnemonic,
        addressType: "bech32",
        utxosByAddress,
        toAddress: to.trim(),
        amountSats: toSatoshis(amt),
        feeRate,
        changeAddress,
      });
      setPreview(result);
    } catch (e) {
      toast.error("Couldn't build tx", { description: String((e as Error).message) });
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    if (!preview) return;
    setBusy(true);
    try {
      const txid = await broadcastTx(preview.rawHex);
      toast.success("Broadcast!", { description: txid });
      setPreview(null);
      setAmount("");
      setTo("");
    } catch (e) {
      toast.error("Broadcast failed", { description: String((e as Error).message) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Send Litecoin</h1>
      <div className="flex items-start gap-2 text-xs text-muted-foreground mb-6">
        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-primary" />
        <span>Mainnet transaction. Double-check the address. Small amounts first.</span>
      </div>

      <div className="card-glass rounded-3xl p-6 space-y-4">
        <label className="block">
          <span className="text-xs text-muted-foreground">From wallet</span>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full mt-1 rounded-xl bg-input border border-border px-3 py-2 text-sm"
          >
            {wallets.filter((w) => w.meta.kind !== "watch").map((w) => (
              <option key={w.meta.id} value={w.meta.id}>{w.meta.name}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs text-muted-foreground">Recipient address</span>
          <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="ltc1..." className="w-full mt-1 rounded-xl bg-input border border-border px-3 py-2 text-sm font-mono" />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-muted-foreground">Amount (LTC)</span>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0.00" className="w-full mt-1 rounded-xl bg-input border border-border px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">Fee rate (sat/vB)</span>
            <input value={feeRate} onChange={(e) => setFeeRate(Number(e.target.value) || 1)} type="number" min={1} className="w-full mt-1 rounded-xl bg-input border border-border px-3 py-2 text-sm" />
          </label>
        </div>

        {!preview ? (
          <button onClick={build} disabled={busy} className="w-full rounded-full bg-primary text-primary-foreground px-5 py-3 text-sm font-medium btn-glow disabled:opacity-50 inline-flex items-center justify-center gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {busy ? "Building…" : "Preview transaction"}
          </button>
        ) : (
          <div className="border-t border-border pt-4 space-y-3">
            <div className="text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">TXID (pre-broadcast)</span><span className="font-mono text-xs">{preview.txid.slice(0, 12)}…</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Fee</span><span>{formatLtc(preview.feeSats)} LTC ({preview.feeSats} sats)</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Size</span><span>{preview.vbytes} vB</span></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPreview(null)} className="flex-1 rounded-full border border-border px-5 py-3 text-sm">Cancel</button>
              <button onClick={send} disabled={busy} className="flex-1 rounded-full bg-primary text-primary-foreground px-5 py-3 text-sm font-medium btn-glow disabled:opacity-50">
                {busy ? "Broadcasting…" : "Broadcast to mainnet"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}