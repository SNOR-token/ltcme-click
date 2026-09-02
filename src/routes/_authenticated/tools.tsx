import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, X, Copy } from "lucide-react";
import { toast } from "sonner";
import { estimateFeeRate, broadcastTx, getAddressInfo } from "@/lib/ltc/api";
import { formatLtc } from "@/lib/ltc/network";

export const Route = createFileRoute("/_authenticated/tools")({
  head: () => ({
    meta: [
      { title: "Tools — LTCme.click" },
      { name: "description", content: "Client-side Litecoin utilities: address validation, WIF-to-address, mnemonic tools, unit converter — all run in your browser." },
      { property: "og:title", content: "Litecoin Tools — LTCme.click" },
      { property: "og:description", content: "Client-side Litecoin utilities: address validation, WIF-to-address, mnemonic tools, unit converter — all run in your browser." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ToolsPage,
});

function ToolsPage() {
  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-4">
      <h1 className="text-3xl font-bold mb-2 text-neon-gradient">Tools</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Client-side Litecoin utilities. Everything except explicit lookups runs entirely in your browser.
      </p>
      <AddressValidator />
      <AddressLookup />
      <WifToAddress />
      <MnemonicDerivation />
      <MnemonicGenerator />
      <UnitConverter />
      <FeeEstimator />
      <BroadcastRaw />
      <HexAscii />
    </div>
  );
}

function AddressValidator() {
  const [v, setV] = useState("");
  const [res, setRes] = useState<{ valid: boolean; type?: string } | null>(null);
  async function check() {
    const { validateAddress } = await import("@/lib/ltc/wallet");
    setRes(validateAddress(v));
  }
  return (
    <section className="card-glass rounded-2xl p-5">
      <h2 className="font-semibold mb-3">Address validator</h2>
      <div className="flex gap-2">
        <input value={v} onChange={(e) => setV(e.target.value)} placeholder="ltc1... / M... / L..." className="flex-1 rounded-lg bg-input border border-border px-3 py-2 text-sm font-mono" />
        <button onClick={check} className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm btn-glow">Check</button>
      </div>
      {res && (
        <div className={`mt-3 text-sm inline-flex items-center gap-2 ${res.valid ? "text-[color:var(--success)]" : "text-destructive"}`}>
          {res.valid ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          {res.valid ? `Valid Litecoin address (${res.type})` : "Not a valid Litecoin mainnet address"}
        </div>
      )}
    </section>
  );
}

function WifToAddress() {
  const [wif, setWif] = useState("");
  const [type, setType] = useState<"bech32" | "legacy" | "p2sh">("bech32");
  const [out, setOut] = useState<{ address: string; pubkey: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function derive() {
    setErr(null);
    setOut(null);
    try {
      const { addressFromWif } = await import("@/lib/ltc/wallet");
      setOut(addressFromWif(wif, type));
    } catch (e) {
      setErr(String((e as Error).message));
    }
  }

  return (
    <section className="card-glass rounded-2xl p-5">
      <h2 className="font-semibold mb-3">WIF → address</h2>
      <div className="grid grid-cols-4 gap-2">
        <input value={wif} onChange={(e) => setWif(e.target.value)} placeholder="WIF private key" className="col-span-2 rounded-lg bg-input border border-border px-3 py-2 text-sm font-mono" />
        <select value={type} onChange={(e) => setType(e.target.value as any)} className="rounded-lg bg-input border border-border px-3 py-2 text-sm">
          <option value="bech32">bech32 (ltc1)</option>
          <option value="p2sh">p2sh (M)</option>
          <option value="legacy">legacy (L)</option>
        </select>
        <button onClick={derive} className="rounded-full bg-primary text-primary-foreground text-sm btn-glow">Derive</button>
      </div>
      {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
      {out && (
        <div className="mt-3 text-xs font-mono space-y-1">
          <div><span className="text-muted-foreground">Address:</span> {out.address}</div>
          <div><span className="text-muted-foreground">Pubkey:</span> {out.pubkey}</div>
        </div>
      )}
    </section>
  );
}

function MnemonicDerivation() {
  const [phrase, setPhrase] = useState("");
  const [addresses, setAddresses] = useState<{ path: string; address: string }[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function derive() {
    setErr(null);
    setAddresses([]);
    try {
      const { validateMnemonic, deriveFromMnemonic } = await import("@/lib/ltc/wallet");
      if (!validateMnemonic(phrase)) throw new Error("Invalid mnemonic");
      const rows = deriveFromMnemonic(phrase, "bech32", 10, 0);
      setAddresses(rows);
    } catch (e) {
      setErr(String((e as Error).message));
    }
  }
  return (
    <section className="card-glass rounded-2xl p-5">
      <h2 className="font-semibold mb-3">Mnemonic → addresses</h2>
      <p className="text-xs text-muted-foreground mb-2">Derives m/84'/2'/0'/0/0..9. Never share your seed. This runs locally.</p>
      <textarea rows={2} value={phrase} onChange={(e) => setPhrase(e.target.value)} placeholder="12 or 24 words" className="w-full rounded-lg bg-input border border-border px-3 py-2 text-sm font-mono" />
      <button onClick={derive} className="mt-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm btn-glow">Derive addresses</button>
      {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
      {addresses.length > 0 && (
        <div className="mt-3 space-y-1">
          {addresses.map((a) => (
            <div key={a.path} className="flex gap-3 text-xs font-mono">
              <span className="text-muted-foreground shrink-0 w-32">{a.path}</span>
              <span className="truncate">{a.address}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function copy(text: string) {
  navigator.clipboard.writeText(text).then(() => toast.success("Copied"));
}

function MnemonicGenerator() {
  const [words, setWords] = useState<string>("");
  const [strength, setStrength] = useState<128 | 256>(128);
  async function gen() {
    const { generateMnemonic } = await import("@/lib/ltc/wallet");
    setWords(generateMnemonic(strength));
  }
  return (
    <section className="card-glass rounded-2xl p-5">
      <h2 className="font-semibold mb-3">Generate mnemonic</h2>
      <div className="flex items-center gap-2">
        <select
          value={strength}
          onChange={(e) => setStrength(Number(e.target.value) as 128 | 256)}
          className="rounded-lg bg-input border border-border px-3 py-2 text-sm"
        >
          <option value={128}>12 words</option>
          <option value={256}>24 words</option>
        </select>
        <button onClick={gen} className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm btn-glow">Generate</button>
        {words && (
          <button onClick={() => copy(words)} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <Copy className="h-3.5 w-3.5" /> Copy
          </button>
        )}
      </div>
      {words && (
        <div className="mt-3 rounded-lg bg-muted p-3 text-sm font-mono break-words">{words}</div>
      )}
      <p className="mt-2 text-[11px] text-muted-foreground">Backup on paper. Never paste this into any website but your own wallet.</p>
    </section>
  );
}

function UnitConverter() {
  const [ltc, setLtc] = useState("");
  const [sats, setSats] = useState("");
  function fromLtc(v: string) {
    setLtc(v);
    const n = Number(v);
    setSats(Number.isFinite(n) ? String(Math.round(n * 1e8)) : "");
  }
  function fromSats(v: string) {
    setSats(v);
    const n = Number(v);
    setLtc(Number.isFinite(n) ? String(n / 1e8) : "");
  }
  return (
    <section className="card-glass rounded-2xl p-5">
      <h2 className="font-semibold mb-3">Unit converter · LTC ⇄ litoshi</h2>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-muted-foreground">
          LTC
          <input value={ltc} onChange={(e) => fromLtc(e.target.value)} placeholder="0.05" className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm font-mono" />
        </label>
        <label className="text-xs text-muted-foreground">
          Litoshi (sats)
          <input value={sats} onChange={(e) => fromSats(e.target.value)} placeholder="5000000" className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm font-mono" />
        </label>
      </div>
    </section>
  );
}

function FeeEstimator() {
  const [rate, setRate] = useState<number | null>(null);
  const [vbytes, setVbytes] = useState("140");
  const [loading, setLoading] = useState(false);
  async function load() {
    setLoading(true);
    try { setRate(await estimateFeeRate()); }
    catch (e) { toast.error("Fee lookup failed", { description: String((e as Error).message) }); }
    finally { setLoading(false); }
  }
  const totalSats = rate ? rate * Math.max(1, Number(vbytes) || 0) : 0;
  return (
    <section className="card-glass rounded-2xl p-5">
      <h2 className="font-semibold mb-3">Fee estimator</h2>
      <div className="flex items-center gap-2">
        <button onClick={load} disabled={loading} className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm btn-glow disabled:opacity-50">
          {loading ? "Loading…" : "Fetch current rate"}
        </button>
        {rate != null && <span className="text-sm">{rate} sat/vB</span>}
        <label className="text-xs text-muted-foreground ml-4">
          Tx size (vbytes)
          <input value={vbytes} onChange={(e) => setVbytes(e.target.value)} className="ml-2 w-24 rounded-lg bg-input border border-border px-2 py-1 text-sm font-mono" />
        </label>
      </div>
      {rate != null && (
        <div className="mt-3 text-sm">
          Estimated fee: <span className="font-mono">{totalSats.toLocaleString()} sats</span>{" "}
          <span className="text-muted-foreground">({formatLtc(totalSats)} LTC)</span>
        </div>
      )}
    </section>
  );
}

function BroadcastRaw() {
  const [hex, setHex] = useState("");
  const [txid, setTxid] = useState("");
  const [busy, setBusy] = useState(false);
  async function push() {
    setBusy(true); setTxid("");
    try { setTxid(await broadcastTx(hex.trim())); toast.success("Broadcast!"); }
    catch (e) { toast.error("Broadcast failed", { description: String((e as Error).message) }); }
    finally { setBusy(false); }
  }
  return (
    <section className="card-glass rounded-2xl p-5">
      <h2 className="font-semibold mb-3">Broadcast raw transaction</h2>
      <textarea value={hex} onChange={(e) => setHex(e.target.value)} rows={3} placeholder="0200000001…" className="w-full rounded-lg bg-input border border-border px-3 py-2 text-xs font-mono mb-2" />
      <button onClick={push} disabled={busy || !hex.trim()} className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm btn-glow disabled:opacity-50">
        {busy ? "Broadcasting…" : "Broadcast"}
      </button>
      {txid && <div className="mt-3 text-xs font-mono break-all">TXID: {txid}</div>}
    </section>
  );
}

function HexAscii() {
  const [hex, setHex] = useState("");
  const [ascii, setAscii] = useState("");
  function toAscii(v: string) {
    setHex(v);
    try {
      const clean = v.replace(/\s/g, "");
      if (!/^[0-9a-fA-F]*$/.test(clean) || clean.length % 2) { setAscii(""); return; }
      let out = "";
      for (let i = 0; i < clean.length; i += 2) out += String.fromCharCode(parseInt(clean.slice(i, i + 2), 16));
      setAscii(out);
    } catch { setAscii(""); }
  }
  function toHex(v: string) {
    setAscii(v);
    setHex(Array.from(v).map((c) => c.charCodeAt(0).toString(16).padStart(2, "0")).join(""));
  }
  return (
    <section className="card-glass rounded-2xl p-5">
      <h2 className="font-semibold mb-3">Hex ⇄ ASCII</h2>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-muted-foreground">
          Hex
          <input value={hex} onChange={(e) => toAscii(e.target.value)} className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-xs font-mono" />
        </label>
        <label className="text-xs text-muted-foreground">
          ASCII
          <input value={ascii} onChange={(e) => toHex(e.target.value)} className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-xs font-mono" />
        </label>
      </div>
    </section>
  );
}

function AddressLookup() {
  const [addr, setAddr] = useState("");
  const [info, setInfo] = useState<{ balance: number; txs: number } | null>(null);
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true); setInfo(null);
    try {
      const r = await getAddressInfo(addr.trim());
      setInfo({ balance: r.balanceSats, txs: r.txCount });
    } catch (e) { toast.error("Lookup failed", { description: String((e as Error).message) }); }
    finally { setBusy(false); }
  }
  return (
    <section className="card-glass rounded-2xl p-5">
      <h2 className="font-semibold mb-3">Address balance lookup</h2>
      <div className="flex gap-2">
        <input value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="ltc1... / M... / L..." className="flex-1 rounded-lg bg-input border border-border px-3 py-2 text-sm font-mono" />
        <button onClick={go} disabled={busy || !addr.trim()} className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm btn-glow disabled:opacity-50">
          {busy ? "Loading…" : "Lookup"}
        </button>
      </div>
      {info && (
        <div className="mt-3 text-sm">
          Balance: <span className="font-mono">{formatLtc(info.balance)} LTC</span> · Tx count: <span className="font-mono">{info.txs.toLocaleString()}</span>
        </div>
      )}
    </section>
  );
}