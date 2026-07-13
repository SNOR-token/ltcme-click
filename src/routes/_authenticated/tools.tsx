import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tools")({
  head: () => ({ meta: [{ title: "Tools — LTCme.click" }] }),
  component: ToolsPage,
});

function ToolsPage() {
  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-4">
      <h1 className="text-3xl font-bold mb-2">Tools</h1>
      <p className="text-muted-foreground text-sm mb-6">Client-side Litecoin utilities. Nothing leaves your browser.</p>
      <AddressValidator />
      <WifToAddress />
      <MnemonicDerivation />
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