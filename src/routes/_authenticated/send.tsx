import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { loadStore } from "@/lib/ltc/storage";
import { getUtxos, estimateFeeRate, broadcastTx, getLtcUsdPrice } from "@/lib/ltc/api";
import { formatLtc, toSatoshis, fromSatoshis } from "@/lib/ltc/network";
import { toast } from "sonner";

// Developer fee: 1% of every send, with a $0.50 USD minimum. Sent to the
// project developer's Litecoin address. Disclosed in-UI before broadcast.
const DEV_FEE_ADDRESS = "MLaCqgY8ZQUXn9hThwZoU5ohFxGuwfCug8";
const DEV_FEE_RATE = 0.01; // 1%
const DEV_FEE_MIN_USD = 0.5; // $0.50 floor

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
  const [ltcUsd, setLtcUsd] = useState<number>(0);
  const [preview, setPreview] = useState<{ txid: string; feeSats: number; vbytes: number; rawHex: string; devFeeSats: number } | null>(null);

  useEffect(() => {
    estimateFeeRate().then(setFeeRate).catch(() => {});
    getLtcUsdPrice().then(setLtcUsd).catch(() => {});
  }, []);

  if (wallets.length === 0) return <div className="p-10 text-muted-foreground">No wallets. Create one first.</div>;

  const amt = Number(amount);
  const amountSats = amt > 0 ? toSatoshis(amt) : 0;
  const onePctSats = Math.ceil(amountSats * DEV_FEE_RATE);
  const minFloorSats = ltcUsd > 0 ? Math.ceil((DEV_FEE_MIN_USD / ltcUsd) * 1e8) : 0;
  const devFeeSats = amountSats > 0 ? Math.max(onePctSats, minFloorSats) : 0;

  async function build() {
    if (!wallet) return;
    if (wallet.meta.kind === "watch") return toast.error("Watch-only wallet — no keys to sign with.");
    if (!wallet.secret) return toast.error("Wallet has no stored secret.");
    if (!to.trim()) return toast.error("Recipient required");
    if (!(amt > 0)) return toast.error("Amount required");
    if (devFeeSats <= 0) return toast.error("Couldn't compute developer fee — LTC price unavailable, try again.");
    setBusy(true);
    setPreview(null);
    try {
      const { validateAddress } = await import("@/lib/ltc/wallet");
      const v = validateAddress(to);
      if (!v.valid) throw new Error("Invalid Litecoin address");
      // Secret is plaintext: either JSON {mnemonic, passphrase} for HD wallets
      // or a raw WIF string for single-key imports.
      let secret = wallet.secret;
      let passphrase = "";
      try {
        const parsed = JSON.parse(wallet.secret);
        if (parsed && typeof parsed.mnemonic === "string") {
          secret = parsed.mnemonic;
          if (typeof parsed.passphrase === "string") passphrase = parsed.passphrase;
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
        secret,
        passphrase,
        utxosByAddress,
        toAddress: to.trim(),
        amountSats,
        extraOutputs: [{ address: DEV_FEE_ADDRESS, value: devFeeSats }],
        feeRate,
        changeAddress,
      });
      setPreview({ ...result, devFeeSats });
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

        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground space-y-1">
          <div className="font-medium text-foreground">Developer fee — 1% (min $0.50)</div>
          <div>
            A 1% developer fee (minimum $0.50 USD equivalent) is added as a
            separate output to <span className="font-mono">{DEV_FEE_ADDRESS.slice(0, 10)}…{DEV_FEE_ADDRESS.slice(-6)}</span>.
            This keeps LTCme.click free to use.
          </div>
          {amountSats > 0 && (
            <div className="flex justify-between pt-1">
              <span>Estimated dev fee</span>
              <span className="text-foreground">
                {formatLtc(devFeeSats)} LTC{ltcUsd > 0 ? ` (~$${(fromSatoshis(devFeeSats) * ltcUsd).toFixed(2)})` : ""}
              </span>
            </div>
          )}
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
              <div className="flex justify-between"><span className="text-muted-foreground">Network fee</span><span>{formatLtc(preview.feeSats)} LTC ({preview.feeSats} sats)</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Developer fee (1%)</span><span>{formatLtc(preview.devFeeSats)} LTC</span></div>
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