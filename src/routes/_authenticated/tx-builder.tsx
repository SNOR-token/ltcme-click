import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, X, Hammer } from "lucide-react";
import { toast } from "sonner";
import { broadcastTx } from "@/lib/ltc/api";

export const Route = createFileRoute("/_authenticated/tx-builder")({
  head: () => ({ meta: [{ title: "TX Builder — LTCme.click" }] }),
  component: TxBuilderPage,
});

interface Row { txid: string; vout: string; value: string; wif: string; }
interface OutRow { address: string; amount: string; }

function TxBuilderPage() {
  const [inputs, setInputs] = useState<Row[]>([{ txid: "", vout: "0", value: "", wif: "" }]);
  const [outputs, setOutputs] = useState<OutRow[]>([{ address: "", amount: "" }]);
  const [raw, setRaw] = useState<string>("");
  const [txid, setTxid] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function build() {
    setBusy(true);
    try {
      const { bitcoin, ECPair } = await import("@/lib/ltc/wallet");
      const { litecoinMainnet } = await import("@/lib/ltc/network");
      const { Buffer } = await import("buffer");
      const psbt = new bitcoin.Psbt({ network: litecoinMainnet as any });
      const signers: any[] = [];
      for (const inp of inputs) {
        if (!inp.txid || !inp.wif || !inp.value) throw new Error("Each input needs txid, value, and WIF");
        const kp = ECPair.fromWIF(inp.wif.trim(), litecoinMainnet as any);
        const pub = Buffer.from(kp.publicKey);
        const p = bitcoin.payments.p2wpkh({ pubkey: pub, network: litecoinMainnet as any });
        psbt.addInput({
          hash: inp.txid.trim(),
          index: Number(inp.vout) || 0,
          witnessUtxo: { script: p.output!, value: Math.round(Number(inp.value) * 1e8) },
        });
        signers.push(kp);
      }
      for (const out of outputs) {
        if (!out.address || !out.amount) throw new Error("Each output needs address + amount");
        psbt.addOutput({ address: out.address.trim(), value: Math.round(Number(out.amount) * 1e8) });
      }
      signers.forEach((kp, i) => {
        psbt.signInput(i, {
          publicKey: Buffer.from(kp.publicKey),
          sign: (hash: any) => Buffer.from(kp.sign(hash)),
        });
      });
      psbt.finalizeAllInputs();
      const tx = psbt.extractTransaction();
      setRaw(tx.toHex());
      setTxid(tx.getId());
      toast.success("Transaction signed");
    } catch (e) {
      toast.error("Build failed", { description: String((e as Error).message) });
    } finally {
      setBusy(false);
    }
  }

  async function pushIt() {
    setBusy(true);
    try {
      const id = await broadcastTx(raw);
      toast.success("Broadcast!", { description: id });
    } catch (e) {
      toast.error("Broadcast failed", { description: String((e as Error).message) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-1">Transaction Builder</h1>
      <p className="text-muted-foreground text-sm mb-6">Advanced: build a P2WPKH tx from raw inputs and WIF keys. LTCme signs client-side.</p>

      <section className="card-glass rounded-3xl p-6 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Inputs (UTXOs)</h2>
          <button onClick={() => setInputs([...inputs, { txid: "", vout: "0", value: "", wif: "" }])} className="text-xs text-primary inline-flex items-center gap-1">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
        <div className="space-y-3">
          {inputs.map((r, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-start">
              <input placeholder="Prev TXID" value={r.txid} onChange={(e) => update(setInputs, i, "txid", e.target.value)} className="col-span-5 rounded-lg bg-input border border-border px-2 py-1.5 text-xs font-mono" />
              <input placeholder="vout" value={r.vout} onChange={(e) => update(setInputs, i, "vout", e.target.value)} className="col-span-1 rounded-lg bg-input border border-border px-2 py-1.5 text-xs" />
              <input placeholder="Value (LTC)" value={r.value} onChange={(e) => update(setInputs, i, "value", e.target.value)} className="col-span-2 rounded-lg bg-input border border-border px-2 py-1.5 text-xs" />
              <input placeholder="WIF key" value={r.wif} onChange={(e) => update(setInputs, i, "wif", e.target.value)} className="col-span-3 rounded-lg bg-input border border-border px-2 py-1.5 text-xs font-mono" />
              <button onClick={() => setInputs(inputs.filter((_, j) => j !== i))} className="col-span-1 p-1.5 text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      </section>

      <section className="card-glass rounded-3xl p-6 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Outputs</h2>
          <button onClick={() => setOutputs([...outputs, { address: "", amount: "" }])} className="text-xs text-primary inline-flex items-center gap-1">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
        <div className="space-y-3">
          {outputs.map((r, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-start">
              <input placeholder="Address" value={r.address} onChange={(e) => update(setOutputs, i, "address", e.target.value)} className="col-span-8 rounded-lg bg-input border border-border px-2 py-1.5 text-xs font-mono" />
              <input placeholder="LTC" value={r.amount} onChange={(e) => update(setOutputs, i, "amount", e.target.value)} className="col-span-3 rounded-lg bg-input border border-border px-2 py-1.5 text-xs" />
              <button onClick={() => setOutputs(outputs.filter((_, j) => j !== i))} className="col-span-1 p-1.5 text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      </section>

      <div className="flex gap-2">
        <button onClick={build} disabled={busy} className="rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium btn-glow disabled:opacity-50 inline-flex items-center gap-2">
          <Hammer className="h-4 w-4" /> Build & sign
        </button>
        {raw && (
          <button onClick={pushIt} disabled={busy} className="rounded-full border border-primary text-primary px-5 py-2.5 text-sm font-medium disabled:opacity-50">
            Broadcast
          </button>
        )}
      </div>

      {raw && (
        <div className="mt-6 card-glass rounded-2xl p-4">
          <div className="text-xs text-muted-foreground">TXID</div>
          <div className="font-mono text-xs break-all mb-3">{txid}</div>
          <div className="text-xs text-muted-foreground">Raw hex</div>
          <div className="font-mono text-xs break-all bg-muted p-3 rounded-lg mt-1">{raw}</div>
        </div>
      )}
    </div>
  );

  function update<T>(setter: React.Dispatch<React.SetStateAction<T[]>>, i: number, k: keyof T, v: string) {
    setter((prev) => prev.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  }
}