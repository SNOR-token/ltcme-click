import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, X, Hammer, Copy, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { broadcastTx } from "@/lib/ltc/api";
import { ensureBuffer } from "@/lib/buffer-polyfill";

export const Route = createFileRoute("/_authenticated/tx-builder")({
  head: () => ({ meta: [{ title: "TX Builder — LTCme.click" }] }),
  component: TxBuilderPage,
});

interface Row { txid: string; vout: string; value: string; wif: string; }
interface OutRow { address: string; amount: string; }

interface Preset {
  name: string;
  desc: string;
  inputs: Row[];
  outputs: OutRow[];
}

const PRESETS: Preset[] = [
  {
    name: "Single UTXO → 1 recipient + change",
    desc: "The most common shape. Spend one UTXO, send LTC to a friend, return change to yourself.",
    inputs: [{ txid: "<prev_txid_hex>", vout: "0", value: "0.10000000", wif: "<your_wif>" }],
    outputs: [
      { address: "ltc1qexamplerecipient00000000000000000000000", amount: "0.09000000" },
      { address: "ltc1qexamplechangeaddress00000000000000000000", amount: "0.00990000" },
    ],
  },
  {
    name: "Batch payout · 1 UTXO → 3 recipients",
    desc: "Split a single UTXO across multiple recipients in one transaction (cheaper than 3 separate txs).",
    inputs: [{ txid: "<prev_txid_hex>", vout: "0", value: "1.00000000", wif: "<your_wif>" }],
    outputs: [
      { address: "ltc1qrecipient1000000000000000000000000000000", amount: "0.30000000" },
      { address: "ltc1qrecipient2000000000000000000000000000000", amount: "0.30000000" },
      { address: "ltc1qrecipient3000000000000000000000000000000", amount: "0.39900000" },
    ],
  },
  {
    name: "Consolidate · 3 UTXOs → 1 address",
    desc: "Sweep many small UTXOs into one output. Great for cleaning up dust before a big send.",
    inputs: [
      { txid: "<txid_a>", vout: "0", value: "0.02000000", wif: "<wif_a>" },
      { txid: "<txid_b>", vout: "1", value: "0.05000000", wif: "<wif_b>" },
      { txid: "<txid_c>", vout: "0", value: "0.08000000", wif: "<wif_c>" },
    ],
    outputs: [{ address: "ltc1qconsolidated0000000000000000000000000000", amount: "0.14900000" }],
  },
  {
    name: "Sweep single WIF → new bech32",
    desc: "Move all funds off a paper key onto a modern SegWit address.",
    inputs: [{ txid: "<prev_txid_hex>", vout: "0", value: "0.25000000", wif: "<paper_wallet_wif>" }],
    outputs: [{ address: "ltc1qyournewsegwitaddress0000000000000000000", amount: "0.24990000" }],
  },
  {
    name: "Donation · 1 UTXO → 2 recipients (no change)",
    desc: "Send exact amounts with no leftover. Any remainder becomes miner fee.",
    inputs: [{ txid: "<prev_txid_hex>", vout: "0", value: "0.50000000", wif: "<your_wif>" }],
    outputs: [
      { address: "ltc1qcharityaddress00000000000000000000000000", amount: "0.25000000" },
      { address: "ltc1qanotheraddress00000000000000000000000000", amount: "0.24990000" },
    ],
  },
];

function TxBuilderPage() {
  const [inputs, setInputs] = useState<Row[]>([{ txid: "", vout: "0", value: "", wif: "" }]);
  const [outputs, setOutputs] = useState<OutRow[]>([{ address: "", amount: "" }]);
  const [raw, setRaw] = useState<string>("");
  const [txid, setTxid] = useState<string>("");
  const [busy, setBusy] = useState(false);

  function loadPreset(p: Preset) {
    setInputs(p.inputs.map((r) => ({ ...r })));
    setOutputs(p.outputs.map((r) => ({ ...r })));
    setRaw("");
    setTxid("");
    toast.info(`Loaded preset: ${p.name}`, { description: "Replace placeholders with real values before signing." });
  }

  function copyIt(text: string) {
    navigator.clipboard.writeText(text).then(() => toast.success("Copied"));
  }

  const inSum = inputs.reduce((s, r) => s + (Number(r.value) || 0), 0);
  const outSum = outputs.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const feeEst = Math.max(0, inSum - outSum);

  async function build() {
    setBusy(true);
    try {
      ensureBuffer();
      const [bitcoin, { keyPairFromWif }] = await Promise.all([
        import("bitcoinjs-lib"),
        import("@/lib/ltc/wallet"),
      ]);
      const { litecoinMainnet } = await import("@/lib/ltc/network");
      bitcoin.initEccLib({} as Parameters<typeof bitcoin.initEccLib>[0]);
      const psbt = new bitcoin.Psbt({ network: litecoinMainnet as any });
      const signers: Array<{ pub: Uint8Array; sign: (h: Uint8Array) => Uint8Array }> = [];
      for (const inp of inputs) {
        if (!inp.txid || !inp.wif || !inp.value) throw new Error("Each input needs txid, value, and WIF");
        const kp = keyPairFromWif(inp.wif.trim());
        const p = bitcoin.payments.p2wpkh({ pubkey: kp.publicKey as unknown as Buffer, network: litecoinMainnet as any });
        psbt.addInput({
          hash: inp.txid.trim(),
          index: Number(inp.vout) || 0,
          witnessUtxo: { script: p.output!, value: Math.round(Number(inp.value) * 1e8) },
        });
        signers.push({ pub: kp.publicKey, sign: (h) => kp.sign(h) });
      }
      for (const out of outputs) {
        if (!out.address || !out.amount) throw new Error("Each output needs address + amount");
        psbt.addOutput({ address: out.address.trim(), value: Math.round(Number(out.amount) * 1e8) });
      }
      signers.forEach((s, i) => {
        psbt.signInput(i, {
          publicKey: s.pub as unknown as Buffer,
          sign: (hash: Buffer) => s.sign(hash as unknown as Uint8Array) as unknown as Buffer,
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
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-1">Transaction Builder</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Advanced: build a P2WPKH (ltc1) transaction from raw inputs and WIF keys. LTCme signs client-side, never sending your keys anywhere.
      </p>

      <section className="card-glass rounded-3xl p-6 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <FlaskConical className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Presets · common transaction shapes</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => loadPreset(p)}
              className="text-left rounded-2xl border border-border bg-card/60 hover:bg-card p-4 transition"
            >
              <div className="text-sm font-semibold">{p.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">{p.desc}</div>
              <div className="mt-2 text-[11px] text-primary">
                {p.inputs.length} input{p.inputs.length > 1 ? "s" : ""} → {p.outputs.length} output{p.outputs.length > 1 ? "s" : ""}
              </div>
            </button>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Presets fill placeholders like <code>&lt;prev_txid_hex&gt;</code> and <code>&lt;your_wif&gt;</code>. Replace them with real values before signing.
        </p>
      </section>

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

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="card-glass rounded-xl p-3">
          <div className="text-muted-foreground">Inputs total</div>
          <div className="font-mono">{inSum.toFixed(8)} LTC</div>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="text-muted-foreground">Outputs total</div>
          <div className="font-mono">{outSum.toFixed(8)} LTC</div>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="text-muted-foreground">Implied fee</div>
          <div className={`font-mono ${feeEst < 0 ? "text-destructive" : ""}`}>{feeEst.toFixed(8)} LTC</div>
        </div>
      </div>

      {raw && (
        <div className="mt-6 card-glass rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">TXID</div>
            <button onClick={() => copyIt(txid)} className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><Copy className="h-3 w-3" /> Copy</button>
          </div>
          <div className="font-mono text-xs break-all mb-3">{txid}</div>
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">Raw hex</div>
            <button onClick={() => copyIt(raw)} className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><Copy className="h-3 w-3" /> Copy</button>
          </div>
          <div className="font-mono text-xs break-all bg-muted p-3 rounded-lg mt-1">{raw}</div>
        </div>
      )}
    </div>
  );

  function update<T>(setter: React.Dispatch<React.SetStateAction<T[]>>, i: number, k: keyof T, v: string) {
    setter((prev) => prev.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  }
}