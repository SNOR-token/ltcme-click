import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FlaskConical, AlertTriangle, ExternalLink, Loader2 } from "lucide-react";
import {
  PQ_SCHEMES,
  PQ_PROPOSALS,
  PQ_DISCLAIMER,
  CLASSICAL_PUBKEY_BYTES,
  CLASSICAL_SIG_BYTES,
  hex,
  keygen,
  sign,
  verify,
  simulateFee,
} from "@/lib/pq/lab";
import { formatLtc } from "@/lib/ltc/network";
import { useProAccess } from "@/lib/pro";
import { ProLock, NetworkToggle, ProExpiredNotice } from "@/components/ProGate";
import { HeightenedSecurityOverlay } from "@/components/HeightenedSecurityOverlay";

export const Route = createFileRoute("/_authenticated/pq-lab")({
  head: () => ({
    meta: [
      { title: "Experimental PQ Lab — LTCme.click" },
      { name: "description", content: "Generate ML-DSA and SLH-DSA test keys locally, sign test messages, compare sizes and simulate hypothetical post-quantum Litecoin fees." },
      { property: "og:title", content: "Experimental PQ Lab — LTCme.click" },
      { property: "og:description", content: "Local ML-DSA and SLH-DSA experiments, size comparisons and hypothetical fee simulations. Test artifacts only." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PqLabPage,
});

function PqLabPage() {
  const pro = useProAccess();
  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-5">
      <HeightenedSecurityOverlay
        state={pro}
        title="Experimental PQ Lab"
      />
      <div className="flex flex-wrap items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
          <FlaskConical />
        </div>
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-2xl md:text-3xl font-bold">Experimental PQ Lab</h1>
          <p className="text-sm text-muted-foreground">A separated sandbox for post-quantum signature experiments.</p>
        </div>
        <NetworkToggle />
      </div>

      <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 flex gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="text-sm space-y-1">
          <p className="font-semibold">
            PQ Lab is experimental. Litecoin mainnet does not currently support post-quantum transaction signatures.
          </p>
          <p className="text-muted-foreground text-xs">{PQ_DISCLAIMER}</p>
          <p className="text-muted-foreground text-xs">
            Nothing generated here is ever attached to a Litecoin transaction or used to create nonstandard outputs.
          </p>
        </div>
      </div>

      <ProExpiredNotice state={pro} />

      <ProLock
        state={pro}
        title="PQ signature sandbox"
        purpose="Generate ML-DSA and SLH-DSA test keys locally, sign and verify test messages, compare key and signature sizes, and demonstrate hybrid classical + post-quantum signatures on test data."
        unlocks={[
          "Local ML-DSA / SLH-DSA keygen",
          "Sign and verify test messages",
          "Key and signature size comparison",
          "Hypothetical PQ fee simulation",
          "Hybrid classical + PQ demonstration",
        ]}
        preview={<div>Sample: ML-DSA-44 public key 1312 bytes, signature 2420 bytes vs. classical 33 / 72 bytes.</div>}
      >
        <Sandbox />
      </ProLock>

      <section className="rounded-2xl border border-border bg-card/50 p-5 space-y-3">
        <h2 className="font-semibold">Legitimate upgrade proposals being tracked</h2>
        <div className="space-y-2">
          {PQ_PROPOSALS.map((p) => (
            <a
              key={p.title}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl border border-border bg-background/50 p-3 hover:border-primary"
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                {p.title}
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                <span className="ml-auto text-[10px] rounded-full border border-border px-2 py-0.5 text-muted-foreground">
                  {p.chain} · {p.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{p.summary}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

function Sandbox() {
  const [schemeId, setSchemeId] = useState(PQ_SCHEMES[0].id);
  const [busy, setBusy] = useState(false);
  const [keys, setKeys] = useState<{ publicKey: Uint8Array; secretKey: Uint8Array } | null>(null);
  const [message, setMessage] = useState("LTCme PQ Lab test message");
  const [sig, setSig] = useState<Uint8Array | null>(null);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [hybrid, setHybrid] = useState<string | null>(null);
  const [inputs, setInputs] = useState(2);
  const [feeRate, setFeeRate] = useState(5);

  function run(fn: () => void) {
    setBusy(true);
    setTimeout(() => {
      try {
        fn();
      } finally {
        setBusy(false);
      }
    }, 0);
  }

  const fee = sig && keys ? simulateFee(sig.length, keys.publicKey.length, inputs, feeRate) : null;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-card/50 p-4 space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={schemeId}
            onChange={(e) => {
              setSchemeId(e.target.value);
              setKeys(null);
              setSig(null);
              setVerified(null);
              setHybrid(null);
            }}
            className="rounded-lg bg-input border border-border px-3 py-2 text-sm"
          >
            {PQ_SCHEMES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.note}
              </option>
            ))}
          </select>
          <button
            disabled={busy}
            onClick={() => run(() => { setKeys(keygen(schemeId)); setSig(null); setVerified(null); setHybrid(null); })}
            className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Generate test keys
          </button>
        </div>

        {keys && (
          <div className="text-xs space-y-1 font-mono break-all">
            <div>
              <span className="text-muted-foreground">public ({keys.publicKey.length} B): </span>
              {hex(keys.publicKey)}
            </div>
            <div className="text-muted-foreground">
              secret ({keys.secretKey.length} B): hidden — test artifact, never leaves this page
            </div>
          </div>
        )}
      </section>

      {keys && (
        <section className="rounded-2xl border border-border bg-card/50 p-4 space-y-3">
          <input
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setSig(null);
              setVerified(null);
            }}
            className="w-full rounded-lg bg-input border border-border px-3 py-2 text-sm"
            placeholder="Test message"
          />
          <div className="flex flex-wrap gap-2">
            <button
              disabled={busy}
              onClick={() => run(() => { setSig(sign(schemeId, keys.secretKey, message)); setVerified(null); })}
              className="rounded-lg border border-border px-3 py-2 text-xs hover:border-primary"
            >
              Sign test message
            </button>
            <button
              disabled={busy || !sig}
              onClick={() => run(() => setVerified(verify(schemeId, keys.publicKey, message, sig!)))}
              className="rounded-lg border border-border px-3 py-2 text-xs hover:border-primary disabled:opacity-50"
            >
              Verify
            </button>
            <button
              disabled={busy || !sig}
              onClick={() =>
                run(() => {
                  const classical = crypto.getRandomValues(new Uint8Array(CLASSICAL_SIG_BYTES));
                  setHybrid(
                    `Hybrid bundle = classical ECDSA (${classical.length} B) + ${schemeId} (${sig!.length} B) = ${
                      classical.length + sig!.length
                    } B. Both must verify for the bundle to be accepted. Test data only.`,
                  );
                })
              }
              className="rounded-lg border border-border px-3 py-2 text-xs hover:border-primary disabled:opacity-50"
            >
              Demo hybrid signature
            </button>
          </div>
          {sig && (
            <div className="text-xs font-mono break-all">
              <span className="text-muted-foreground">signature ({sig.length} B): </span>
              {hex(sig)}
            </div>
          )}
          {verified !== null && (
            <div className={`text-xs ${verified ? "text-primary" : "text-destructive"}`}>
              {verified ? "Signature verified against the test public key." : "Verification failed."}
            </div>
          )}
          {hybrid && <div className="text-xs text-muted-foreground">{hybrid}</div>}
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card/50 p-4 space-y-3">
        <h3 className="font-semibold text-sm">Size comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-muted-foreground">
              <tr>
                <th className="text-left py-1">Scheme</th>
                <th className="text-right">Public key</th>
                <th className="text-right">Signature</th>
                <th className="text-right">vs classical</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border/60">
                <td className="py-1">ECDSA (Litecoin today)</td>
                <td className="text-right">{CLASSICAL_PUBKEY_BYTES} B</td>
                <td className="text-right">{CLASSICAL_SIG_BYTES} B</td>
                <td className="text-right">1×</td>
              </tr>
              {keys && sig && (
                <tr className="border-t border-border/60 text-primary">
                  <td className="py-1">{schemeId} (generated)</td>
                  <td className="text-right">{keys.publicKey.length} B</td>
                  <td className="text-right">{sig.length} B</td>
                  <td className="text-right">
                    {((keys.publicKey.length + sig.length) / (CLASSICAL_PUBKEY_BYTES + CLASSICAL_SIG_BYTES)).toFixed(1)}×
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!keys && <p className="text-xs text-muted-foreground">Generate keys and sign to compare against classical sizes.</p>}
      </section>

      <section className="rounded-2xl border border-border bg-card/50 p-4 space-y-3">
        <h3 className="font-semibold text-sm">Hypothetical PQ fee simulation</h3>
        <div className="flex flex-wrap gap-2 items-center text-xs">
          <label className="flex items-center gap-1.5">
            Inputs
            <input
              type="number"
              min={1}
              value={inputs}
              onChange={(e) => setInputs(Math.max(1, Number(e.target.value)))}
              className="w-16 rounded-lg bg-input border border-border px-2 py-1"
            />
          </label>
          <label className="flex items-center gap-1.5">
            sat/vB
            <input
              type="number"
              min={1}
              value={feeRate}
              onChange={(e) => setFeeRate(Math.max(1, Number(e.target.value)))}
              className="w-16 rounded-lg bg-input border border-border px-2 py-1"
            />
          </label>
        </div>
        {fee ? (
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-border bg-background/50 p-3">
              <div className="text-muted-foreground">Classical</div>
              <div>{fee.classicalVb} vB · {formatLtc(fee.classicalSats)} LTC</div>
            </div>
            <div className="rounded-xl border border-border bg-background/50 p-3">
              <div className="text-muted-foreground">Hypothetical PQ</div>
              <div>{fee.pqVb} vB · {formatLtc(fee.pqSats)} LTC</div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Generate keys and sign a message to simulate fees.</p>
        )}
        <p className="text-[11px] text-muted-foreground">
          Illustrative only. No post-quantum output type exists on Litecoin, so these figures describe a hypothetical
          future upgrade, not current network costs.
        </p>
      </section>
    </div>
  );
}
