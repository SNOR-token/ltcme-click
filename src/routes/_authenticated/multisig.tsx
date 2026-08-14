import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Users, Plus, Trash2, Copy, PenLine, Send, KeyRound, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useNetworkMode } from "@/lib/ltc/network-mode";
import { NetworkToggle } from "@/components/ProGate";
import { getBalances, broadcastTx } from "@/lib/ltc/api";
import { formatLtc } from "@/lib/ltc/network";
import { validateAddress } from "@/lib/ltc/wallet";
import {
  DEFAULT_ACCOUNT_PATH,
  accountXpubFromMnemonic,
  buildMultisigPsbt,
  deleteMultisig,
  deriveMany,
  descriptor,
  finalizeMultisigPsbt,
  newMsId,
  psbtSignatureCounts,
  saveMultisig,
  signMultisigPsbt,
  useMultisigWallets,
  validateCosignerKey,
  type Cosigner,
  type MultisigScript,
  type MultisigWallet,
} from "@/lib/ltc/multisig";

export const Route = createFileRoute("/_authenticated/multisig")({
  head: () => ({
    meta: [
      { title: "Multisig — LTCme.click" },
      { name: "description", content: "Create and spend from m-of-n Litecoin multisig wallets with PSBT signing, entirely in your browser." },
      { property: "og:title", content: "Multisig — LTCme.click" },
      { property: "og:description", content: "Create and spend from m-of-n Litecoin multisig wallets with PSBT signing, entirely in your browser." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MultisigPage,
});

function copy(text: string, label = "Copied") {
  navigator.clipboard.writeText(text);
  toast.success(label);
}

function MultisigPage() {
  const [mode] = useNetworkMode();
  const wallets = useMultisigWallets(mode);
  const [tab, setTab] = useState<"create" | "spend" | "keys">("create");

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center neon-edge">
          <Users />
        </div>
        <div className="flex-1 min-w-[220px]">
          <h1 className="text-2xl md:text-3xl font-bold">Multisig</h1>
          <p className="text-sm text-muted-foreground">
            Create m-of-n Litecoin wallets that need several keys to spend. Everything — key derivation, PSBT building
            and signing — happens locally in your browser.
          </p>
        </div>
        <NetworkToggle />
      </div>

      <div className="flex gap-1 p-1 rounded-xl card-glass w-fit">
        {([
          ["create", "Wallets"],
          ["spend", "Spend / PSBT"],
          ["keys", "Cosigner key"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-3 py-1.5 rounded-lg text-sm transition ${
              tab === id ? "bg-primary/15 text-primary neon-edge" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "create" && <WalletsTab wallets={wallets} network={mode} />}
      {tab === "spend" && <SpendTab wallets={wallets} />}
      {tab === "keys" && <KeysTab />}
    </div>
  );
}

// ------------------------------------------------------------------ wallets

function WalletsTab({ wallets, network }: { wallets: MultisigWallet[]; network: "mainnet" }) {
  const [name, setName] = useState("");
  const [m, setM] = useState(2);
  const [script, setScript] = useState<MultisigScript>("p2wsh");
  const [cosigners, setCosigners] = useState<Cosigner[]>([
    { id: "c1", label: "Cosigner 1", key: "", path: DEFAULT_ACCOUNT_PATH },
    { id: "c2", label: "Cosigner 2", key: "", path: DEFAULT_ACCOUNT_PATH },
    { id: "c3", label: "Cosigner 3", key: "", path: DEFAULT_ACCOUNT_PATH },
  ]);

  function setCo(id: string, patch: Partial<Cosigner>) {
    setCosigners((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function create() {
    const filled = cosigners.filter((c) => c.key.trim());
    if (filled.length < 2) return toast.error("Add at least two cosigner keys.");
    if (m < 1 || m > filled.length) return toast.error(`Threshold must be between 1 and ${filled.length}.`);
    for (const c of filled) {
      const v = validateCosignerKey(c.key);
      if (!v.valid) return toast.error(`${c.label}: ${v.error}`);
    }
    const keys = new Set(filled.map((c) => c.key.trim()));
    if (keys.size !== filled.length) return toast.error("Duplicate cosigner keys.");
    const wallet: MultisigWallet = {
      id: newMsId(),
      name: name.trim() || `${m}-of-${filled.length} multisig`,
      m,
      script,
      network,
      cosigners: filled.map((c, i) => ({ ...c, label: c.label.trim() || `Cosigner ${i + 1}` })),
      createdAt: Date.now(),
    };
    try {
      saveMultisig(wallet);
      setName("");
      setCosigners(cosigners.map((c) => ({ ...c, key: "" })));
      toast.success("Multisig wallet created.");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not create wallet.");
    }
  }

  const n = cosigners.filter((c) => c.key.trim()).length || cosigners.length;

  return (
    <div className="space-y-6">
      <section className="card-glass rounded-2xl p-5 space-y-4">
        <div className="eyebrow">New multisig wallet</div>
        <div className="grid md:grid-cols-3 gap-3">
          <label className="text-sm space-y-1 md:col-span-2">
            <span className="text-muted-foreground">Wallet name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Treasury vault"
              className="w-full rounded-lg bg-input px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="text-sm space-y-1">
            <span className="text-muted-foreground">Signatures required (m of {n})</span>
            <input
              type="number"
              min={1}
              max={cosigners.length}
              value={m}
              onChange={(e) => setM(Number(e.target.value))}
              className="w-full rounded-lg bg-input px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["p2wsh", "Native SegWit (ltc1… — recommended)"],
              ["p2sh-p2wsh", "Nested SegWit (M…)"],
              ["p2sh", "Legacy P2SH (M…)"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setScript(id)}
              className={`px-3 py-1.5 rounded-lg text-xs transition ${
                script === id ? "bg-primary/15 text-primary neon-edge" : "bg-secondary text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {cosigners.map((c, i) => (
            <div key={c.id} className="grid md:grid-cols-[170px_1fr_auto] gap-2">
              <input
                value={c.label}
                onChange={(e) => setCo(c.id, { label: e.target.value })}
                placeholder={`Cosigner ${i + 1}`}
                className="rounded-lg bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                value={c.key}
                onChange={(e) => setCo(c.id, { key: e.target.value })}
                placeholder="xpub / Ltub / tpub… or 33-byte hex public key"
                className="rounded-lg bg-input px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={() => setCosigners((cs) => (cs.length > 2 ? cs.filter((x) => x.id !== c.id) : cs))}
                className="px-2 rounded-lg text-muted-foreground hover:text-destructive"
                aria-label="Remove cosigner"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              setCosigners((cs) => [
                ...cs,
                { id: "c" + (cs.length + 1) + Date.now(), label: `Cosigner ${cs.length + 1}`, key: "", path: DEFAULT_ACCOUNT_PATH },
              ])
            }
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> Add cosigner
          </button>
        </div>

        <button onClick={create} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium btn-glow">
          Create multisig wallet
        </button>
        <p className="text-xs text-muted-foreground">
          Keys are sorted deterministically (BIP67) so every cosigner recreating this wallet gets identical addresses.
          Back up the descriptor below — you need all cosigner keys plus the threshold to ever rebuild it.
        </p>
      </section>

      {wallets.length === 0 ? (
        <p className="text-sm text-muted-foreground">No multisig wallets on {network} yet.</p>
      ) : (
        wallets.map((w) => <WalletCard key={w.id} wallet={w} />)
      )}
    </div>
  );
}

function WalletCard({ wallet }: { wallet: MultisigWallet }) {
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addresses = useMemo(() => {
    try {
      setError(null);
      return deriveMany(wallet, 5, 0);
    } catch (e: any) {
      setError(e?.message ?? "Derivation failed");
      return [];
    }
  }, [wallet]);

  async function refresh() {
    if (!addresses.length) return;
    setLoading(true);
    try {
      setBalances(await getBalances(addresses.map((a) => a.address)));
    } catch {
      toast.error("Could not reach the Litecoin network.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.id]);

  const total = Object.values(balances).reduce((a, b) => a + b, 0);

  return (
    <section className="card-glass rounded-2xl p-5 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="font-semibold">{wallet.name}</h2>
          <div className="eyebrow">
            {wallet.m}-of-{wallet.cosigners.length} · {wallet.script}
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-lg font-semibold">{formatLtc(total)} LTC</div>
          <button onClick={refresh} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
        <button
          onClick={() => {
            deleteMultisig(wallet.id);
            toast.success("Wallet removed from this device.");
          }}
          className="text-muted-foreground hover:text-destructive"
          aria-label="Delete wallet"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <div className="space-y-1">
          {addresses.map((a) => (
            <div key={a.address} className="flex items-center gap-2 text-xs font-mono">
              <span className="text-muted-foreground w-8">#{a.index}</span>
              <span className="truncate flex-1">{a.address}</span>
              <span className="text-muted-foreground">{formatLtc(balances[a.address] ?? 0, 4)}</span>
              <button onClick={() => copy(a.address, "Address copied")} className="text-muted-foreground hover:text-primary">
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => copy(descriptor(wallet), "Descriptor copied")}
        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
      >
        <Copy className="h-3.5 w-3.5" /> Copy output descriptor (backup)
      </button>
    </section>
  );
}

// -------------------------------------------------------------------- spend

function SpendTab({ wallets }: { wallets: MultisigWallet[] }) {
  const [walletId, setWalletId] = useState(wallets[0]?.id ?? "");
  const wallet = wallets.find((w) => w.id === walletId);
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [psbt, setPsbt] = useState("");
  const [seed, setSeed] = useState("");
  const [path, setPath] = useState(DEFAULT_ACCOUNT_PATH);
  const [passphrase, setPassphrase] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!wallet && wallets[0]) setWalletId(wallets[0].id);
  }, [wallets, wallet]);

  const sigCounts = useMemo(() => {
    if (!psbt.trim()) return null;
    try {
      return psbtSignatureCounts(psbt.trim());
    } catch {
      return null;
    }
  }, [psbt]);

  async function build() {
    if (!wallet) return toast.error("Create a multisig wallet first.");
    if (!validateAddress(to).valid) return toast.error("Enter a valid Litecoin address.");
    const sats = Math.round(Number(amount) * 1e8);
    if (!sats || sats < 546) return toast.error("Enter an amount above the dust limit.");
    setBusy(true);
    try {
      const res = await buildMultisigPsbt({ wallet, toAddress: to.trim(), amountSats: sats });
      setPsbt(res.psbtBase64);
      toast.success(`Unsigned PSBT built · fee ≈ ${formatLtc(res.feeSats, 8)} LTC`);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not build the transaction.");
    } finally {
      setBusy(false);
    }
  }

  function sign() {
    try {
      const res = signMultisigPsbt(psbt.trim(), seed, { accountPath: path, passphrase });
      setPsbt(res.psbtBase64);
      setSeed("");
      toast.success(`Signed ${res.signedInputs} input(s).`);
    } catch (e: any) {
      toast.error(e?.message ?? "Signing failed.");
    }
  }

  async function finalizeAndSend() {
    setBusy(true);
    try {
      const { rawHex, txid } = finalizeMultisigPsbt(psbt.trim());
      await broadcastTx(rawHex);
      toast.success(`Broadcast ${txid.slice(0, 12)}…`);
      setPsbt("");
    } catch (e: any) {
      toast.error(e?.message ?? "Not enough signatures yet.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="card-glass rounded-2xl p-5 space-y-3">
        <div className="eyebrow">1 · Build an unsigned transaction</div>
        <select
          value={walletId}
          onChange={(e) => setWalletId(e.target.value)}
          className="w-full rounded-lg bg-input px-3 py-2 text-sm outline-none"
        >
          {wallets.length === 0 && <option value="">No multisig wallets yet</option>}
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} ({w.m}-of-{w.cosigners.length})
            </option>
          ))}
        </select>
        <input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="Destination Litecoin address"
          className="w-full rounded-lg bg-input px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount in LTC"
          inputMode="decimal"
          className="w-full rounded-lg bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={build}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium btn-glow disabled:opacity-60"
        >
          <Send className="h-4 w-4" /> Build PSBT
        </button>
      </section>

      <section className="card-glass rounded-2xl p-5 space-y-3">
        <div className="eyebrow">2 · Collect signatures</div>
        <textarea
          value={psbt}
          onChange={(e) => setPsbt(e.target.value)}
          rows={5}
          placeholder="Paste a PSBT (base64) from another cosigner, or build one above"
          className="w-full rounded-lg bg-input px-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-ring"
        />
        {sigCounts && (
          <p className="text-xs text-muted-foreground">
            Signatures per input: {sigCounts.join(", ")} · threshold {wallet?.m ?? "?"}
          </p>
        )}
        <div className="grid md:grid-cols-2 gap-2">
          <input
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            placeholder="Your cosigner seed phrase (never leaves this device)"
            className="rounded-lg bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder={DEFAULT_ACCOUNT_PATH}
            className="rounded-lg bg-input px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="Optional BIP39 passphrase"
            className="rounded-lg bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={sign} className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm">
            <PenLine className="h-4 w-4" /> Sign with this seed
          </button>
          <button
            onClick={() => copy(psbt, "PSBT copied — send it to the next cosigner")}
            className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm"
          >
            <Copy className="h-4 w-4" /> Copy PSBT
          </button>
          <button
            onClick={finalizeAndSend}
            disabled={busy || !psbt.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium btn-glow disabled:opacity-60"
          >
            <Send className="h-4 w-4" /> Finalize & broadcast
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Multisig spending is irreversible. Once the threshold of signatures is collected the transaction is
          broadcast to the Litecoin network exactly as shown.
        </p>
      </section>
    </div>
  );
}

// --------------------------------------------------------------- cosigner key

function KeysTab() {
  const [seed, setSeed] = useState("");
  const [path, setPath] = useState(DEFAULT_ACCOUNT_PATH);
  const [passphrase, setPassphrase] = useState("");
  const [xpub, setXpub] = useState("");

  return (
    <section className="card-glass rounded-2xl p-5 space-y-3">
      <div className="eyebrow">Export your cosigner key</div>
      <p className="text-sm text-muted-foreground">
        Share the extended <strong>public</strong> key below with the other cosigners so they can build the same
        multisig wallet. Your seed phrase stays on this device and is never stored or sent anywhere.
      </p>
      <input
        value={seed}
        onChange={(e) => setSeed(e.target.value)}
        placeholder="Seed phrase"
        className="w-full rounded-lg bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="grid md:grid-cols-2 gap-2">
        <input
          value={path}
          onChange={(e) => setPath(e.target.value)}
          className="rounded-lg bg-input px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          placeholder="Optional BIP39 passphrase"
          className="rounded-lg bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <button
        onClick={() => {
          try {
            setXpub(accountXpubFromMnemonic(seed, path, passphrase));
            setSeed("");
          } catch (e: any) {
            toast.error(e?.message ?? "Could not derive key.");
          }
        }}
        className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium btn-glow"
      >
        <KeyRound className="h-4 w-4" /> Derive cosigner key
      </button>
      {xpub && (
        <div className="rounded-lg bg-input p-3 text-xs font-mono break-all">
          {xpub}
          <button onClick={() => copy(xpub, "Cosigner key copied")} className="ml-2 text-primary">
            copy
          </button>
        </div>
      )}
    </section>
  );
}