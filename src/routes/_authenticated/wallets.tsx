import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, KeyRound, Eye, Trash2, Copy, Wallet as WalletIcon, RefreshCw, Send, Download, Bot, Sprout, Shield } from "lucide-react";
import { formatLtc } from "@/lib/ltc/network";
import { loadStore, upsertWallet, removeWallet, type StoredWallet } from "@/lib/ltc/storage";
import { getBalances } from "@/lib/ltc/api";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/wallets")({
  head: () => ({
    meta: [
      { title: "Wallets — LTCme.click" },
      { name: "description", content: "Manage your non-custodial Litecoin wallets. Create, import, and view balances — keys stay encrypted in your browser." },
      { property: "og:title", content: "Wallets — LTCme.click" },
      { property: "og:description", content: "Manage your non-custodial Litecoin wallets. Create, import, and view balances — keys stay encrypted in your browser." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WalletsPage,
});

async function loadWalletHelpers() {
  return import("@/lib/ltc/wallet");
}

function WalletsPage() {
  const [wallets, setWallets] = useState<StoredWallet[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [openDialog, setOpenDialog] = useState<null | "create" | "import" | "watch">(null);

  function reload() {
    setWallets(loadStore().wallets);
  }
  useEffect(() => {
    reload();
  }, []);

  async function refreshBalances() {
    setRefreshing(true);
    try {
      const addrs = wallets.flatMap((w) => w.addresses.map((a) => a.address));
      const uniq = Array.from(new Set(addrs));
      if (uniq.length === 0) return;
      const b = await getBalances(uniq);
      setBalances(b);
    } catch (e) {
      toast.error("Couldn't fetch balances", { description: String((e as Error).message) });
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (wallets.length > 0) refreshBalances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallets.length]);

  // Constant balance polling via the mainnet public RPC (litecoinspace.org).
  useEffect(() => {
    if (wallets.length === 0) return;
    const id = setInterval(refreshBalances, 30_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallets.length]);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Your Litecoin</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Non-custodial. Seed phrases stay in this browser only — back them up yourself.
          </p>
        </div>
        <button onClick={refreshBalances} disabled={refreshing} className="rounded-full border border-border bg-card/60 px-4 py-2 text-sm inline-flex items-center gap-2 hover:bg-card">
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <section className="card-glass rounded-3xl p-6 mb-6">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Total balance</div>
        <div className="text-4xl font-bold mt-1">
          {formatLtc(
            wallets.reduce((s, w) => s + w.addresses.reduce((t, a) => t + (balances[a.address] ?? 0), 0), 0),
          )}{" "}
          <span className="text-lg font-medium text-muted-foreground">LTC</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <QuickLink to="/send" icon={<Send className="h-4 w-4" />} label="Send" primary />
          <QuickLink to="/receive" icon={<Download className="h-4 w-4" />} label="Receive" />
          <QuickLink to="/ai" icon={<Bot className="h-4 w-4" />} label="Ask AI" />
          <QuickLink to="/earn" icon={<Sprout className="h-4 w-4" />} label="Explore Earn" />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Next step: use a fresh receive address for each payment.
        </p>
      </section>

      <div className="grid md:grid-cols-3 gap-3 mb-8">
        <ActionCard icon={<Plus />} title="Create new" body="Generate a fresh 12-word seed" onClick={() => setOpenDialog("create")} />
        <ActionCard icon={<KeyRound />} title="Import" body="Recover from seed phrase or WIF" onClick={() => setOpenDialog("import")} />
        <ActionCard icon={<Eye />} title="Watch-only" body="Track an address without keys" onClick={() => setOpenDialog("watch")} />
      </div>

      {wallets.length === 0 ? (
        <div className="card-glass rounded-3xl p-12 text-center">
          <WalletIcon className="h-10 w-10 mx-auto text-primary mb-4" />
          <h3 className="text-lg font-semibold">No wallets yet</h3>
          <p className="text-sm text-muted-foreground mt-2">Create a fresh Litecoin wallet or import one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {wallets.map((w) => {
            const total = w.addresses.reduce((s, a) => s + (balances[a.address] ?? 0), 0);
            return (
              <div key={w.meta.id} className="card-glass rounded-2xl p-5 flex items-center gap-4">
                <div className="h-11 w-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                  <WalletIcon />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium truncate">{w.meta.name}</div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {w.meta.kind}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {w.meta.addressType}
                    </span>
                  </div>
                  <div className="mt-1 text-xs font-mono text-muted-foreground truncate">
                    {w.addresses[0]?.address}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatLtc(total)} LTC</div>
                  <div className="text-[11px] text-muted-foreground">{w.addresses.length} addr</div>
                </div>
                <div className="flex items-center gap-1">
                  <Link to="/send" search={{ walletId: w.meta.id } as never} className="rounded-lg px-3 py-1.5 text-xs bg-primary text-primary-foreground">Send</Link>
                  <Link to="/receive" search={{ walletId: w.meta.id } as never} className="rounded-lg px-3 py-1.5 text-xs border border-border">Receive</Link>
                  <button
                    onClick={() => {
                      if (confirm(`Remove "${w.meta.name}"? Make sure you have the seed backed up.`)) {
                        removeWallet(w.meta.id);
                        reload();
                      }
                    }}
                    className="p-2 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {openDialog === "create" && <CreateDialog onClose={() => { setOpenDialog(null); reload(); }} />}
      {openDialog === "import" && <ImportDialog onClose={() => { setOpenDialog(null); reload(); }} />}
      {openDialog === "watch" && <WatchDialog onClose={() => { setOpenDialog(null); reload(); }} />}
    </div>
  );
}

function ActionCard({ icon, title, body, onClick }: any) {
  return (
    <button onClick={onClick} className="card-glass rounded-2xl p-5 text-left hover:border-primary/50 transition">
      <div className="h-9 w-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center mb-3">{icon}</div>
      <div className="font-medium">{title}</div>
      <div className="text-xs text-muted-foreground mt-1">{body}</div>
    </button>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="card-glass rounded-3xl p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function CreateDialog({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"generate" | "confirm">("generate");
  const [name, setName] = useState("My Litecoin Wallet");
  const [mnemonic, setMnemonic] = useState<string>("");
  const [bip39Passphrase, setBip39Passphrase] = useState("");
  const [showBipPass, setShowBipPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  async function regenerate() {
    setGenError(null);
    setMnemonic("");
    try {
      const { generateMnemonic } = await loadWalletHelpers();
      const m = generateMnemonic(128);
      if (!m || m.split(" ").filter(Boolean).length !== 12) {
        throw new Error("Generator returned an invalid phrase.");
      }
      setMnemonic(m);
    } catch (e) {
      console.error("[wallet] regenerate failed", e);
      setGenError((e as Error)?.message || String(e) || "Failed to generate seed phrase.");
    }
  }

  useEffect(() => {
    regenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    if (!name.trim()) return toast.error("Name required");
    setSaving(true);
    try {
      const { deriveAllStandards, newId } = await loadWalletHelpers();
      const derived = deriveAllStandards(mnemonic, 3, 0, bip39Passphrase);
      const secret = JSON.stringify({ mnemonic, passphrase: bip39Passphrase || "" });
      upsertWallet({
        meta: {
          id: newId(),
          name: name.trim(),
          kind: "hd",
          addressType: "bech32",
          createdAt: Date.now(),
        },
        secret,
        addresses: derived.map((d) => ({ address: d.address, path: d.path, index: d.index })),
      });
      toast.success("Wallet created");
      onClose();
    } catch (e) {
      toast.error("Failed to create wallet", { description: String((e as Error).message) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Create new wallet" onClose={onClose}>
      {step === "generate" ? (
        <>
          <p className="text-sm text-muted-foreground mb-3">
            Write these 12 words down on paper. Anyone with them can spend your LTC. LTCme never sees or stores them.
          </p>
          <div className="grid grid-cols-3 gap-2 mb-4 bg-muted/50 p-4 rounded-xl min-h-[8rem]">
            {genError ? (
              <div className="col-span-3 text-sm text-destructive">
                {genError}
              </div>
            ) : mnemonic ? (
              mnemonic.split(" ").map((w, i) => (
                <div key={i} className="text-sm">
                  <span className="text-muted-foreground text-xs mr-1">{i + 1}.</span>
                  {w}
                </div>
              ))
            ) : (
              <div className="col-span-3 text-sm text-muted-foreground">
                Generating your seed phrase…
              </div>
            )}
          </div>
          <div className="flex justify-between items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!mnemonic) return;
                navigator.clipboard.writeText(mnemonic);
                toast.success("Copied to clipboard");
              }}
              disabled={!mnemonic}
              className="text-sm text-primary inline-flex items-center gap-1 disabled:opacity-40"
            >
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={regenerate}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Regenerate
              </button>
              <button
                onClick={() => setStep("confirm")}
                disabled={!mnemonic}
                className="rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm btn-glow disabled:opacity-40"
              >
                I've written it down →
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <Field label="Wallet name" value={name} onChange={setName} />
          <button
            type="button"
            onClick={() => setShowBipPass((v) => !v)}
            className="text-xs text-primary hover:underline"
          >
            {showBipPass ? "Hide" : "Add"} optional BIP39 passphrase (25th word)
          </button>
          {showBipPass && (
            <Field
              label="BIP39 passphrase (optional)"
              type="password"
              value={bip39Passphrase}
              onChange={setBip39Passphrase}
            />
          )}
          <div className="flex justify-between pt-2">
            <button onClick={() => setStep("generate")} className="text-sm text-muted-foreground">← Back</button>
            <button onClick={save} disabled={saving} className="rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm btn-glow disabled:opacity-50">
              {saving ? "Saving…" : "Save wallet"}
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

function ImportDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("Imported wallet");
  const [phrase, setPhrase] = useState("");
  const [bip39Passphrase, setBip39Passphrase] = useState("");
  const [showBipPass, setShowBipPass] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) return toast.error("Name required");
    const raw = phrase.trim();
    if (!raw) return toast.error("Enter a seed phrase or WIF");
    if (raw.length > 2000) {
      return toast.error("Input too long", {
        description: "Paste only your 12/24-word seed phrase or a single WIF key.",
      });
    }
    setSaving(true);
    try {
      const trimmed = raw.split(/\s+/).join(" ").toLowerCase();
      const words = trimmed.split(" ");
      const wordCount = words.length;
      const { validateMnemonic, deriveAllStandards, addressFromWif, newId } = await loadWalletHelpers();

      const looksLikeMnemonic = wordCount === 12 || wordCount === 15 || wordCount === 18 || wordCount === 21 || wordCount === 24;
      if (looksLikeMnemonic) {
        if (!validateMnemonic(trimmed)) throw new Error("Invalid mnemonic (checksum failed).");
        // Derive BIP44 (L…), BIP49 (M…), BIP84 (ltc1…) so an imported seed
        // surfaces every standard address the user might already have funds on.
        const derived = deriveAllStandards(trimmed, 3, 0, bip39Passphrase);
        const secret = JSON.stringify({ mnemonic: trimmed, passphrase: bip39Passphrase || "" });
        upsertWallet({
          meta: { id: newId(), name: name.trim(), kind: "hd", addressType: "bech32", createdAt: Date.now() },
          secret,
          addresses: derived.map((d) => ({ address: d.address, path: d.path, index: d.index })),
        });
      } else {
        // Treat as WIF — validate length/charset early so bs58 doesn't try to allocate a giant buffer.
        const wif = raw.replace(/\s+/g, "");
        if (wif.length < 50 || wif.length > 55 || !/^[1-9A-HJ-NP-Za-km-z]+$/.test(wif)) {
          throw new Error("That doesn't look like a seed phrase (12/24 words) or a WIF key.");
        }
        const { address } = addressFromWif(wif, "bech32");
        upsertWallet({
          meta: { id: newId(), name: name.trim(), kind: "single", addressType: "bech32", createdAt: Date.now() },
          secret: wif,
          addresses: [{ address }],
        });
      }
      toast.success("Wallet imported");
      onClose();
    } catch (e) {
      toast.error("Import failed", { description: String((e as Error).message) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Import wallet" onClose={onClose}>
      <p className="text-xs text-muted-foreground mb-3">Paste a 12/24-word seed phrase OR a WIF private key. Stored locally in this browser only — never sent anywhere.</p>
      <Field label="Wallet name" value={name} onChange={setName} />
      <label className="text-xs text-muted-foreground mt-3 block">Seed phrase or WIF</label>
      <textarea
        value={phrase}
        onChange={(e) => setPhrase(e.target.value)}
        rows={3}
        placeholder="12 or 24 words separated by spaces, or a WIF starting with T…"
        className="w-full mt-1 rounded-xl bg-input border border-border px-3 py-2 text-sm font-mono"
      />
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setShowBipPass((v) => !v)}
          className="text-xs text-primary hover:underline"
        >
          {showBipPass ? "Hide" : "Add"} optional BIP39 passphrase (25th word)
        </button>
        {showBipPass && (
          <div className="mt-2">
            <Field
              label="BIP39 passphrase (optional — leave empty if you didn't use one)"
              type="password"
              value={bip39Passphrase}
              onChange={setBip39Passphrase}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Only fill this if your original wallet was created with a BIP39 passphrase.
            </p>
          </div>
        )}
      </div>
      <div className="flex justify-end mt-4">
        <button onClick={save} disabled={saving} className="rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm btn-glow disabled:opacity-50">
          {saving ? "Importing…" : "Import"}
        </button>
      </div>
    </ModalShell>
  );
}

function WatchDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("Watched wallet");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const { validateAddress, newId } = await loadWalletHelpers();
      const v = validateAddress(address);
      if (!v.valid) throw new Error("Invalid Litecoin address");
      upsertWallet({
        meta: {
          id: newId(),
          name: name.trim() || "Watched",
          kind: "watch",
          addressType: v.type ?? "bech32",
          createdAt: Date.now(),
          address: address.trim(),
        },
        addresses: [{ address: address.trim() }],
      });
      toast.success("Watching address");
      onClose();
    } catch (e) {
      toast.error("Failed", { description: String((e as Error).message) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Add watch-only address" onClose={onClose}>
      <Field label="Label" value={name} onChange={setName} />
      <div className="mt-3">
        <Field label="Litecoin address" value={address} onChange={setAddress} placeholder="ltc1... / M... / L..." mono />
      </div>
      <div className="flex justify-end mt-4">
        <button onClick={save} disabled={saving} className="rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm btn-glow disabled:opacity-50">
          {saving ? "Adding…" : "Add"}
        </button>
      </div>
    </ModalShell>
  );
}

function Field({
  label, value, onChange, type = "text", placeholder, mono,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; mono?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full mt-1 rounded-xl bg-input border border-border px-3 py-2 text-sm ${mono ? "font-mono" : ""}`}
      />
    </label>
  );
}
function QuickLink({
  to,
  icon,
  label,
  primary,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
        primary
          ? "bg-primary text-primary-foreground btn-glow hover:opacity-90"
          : "border border-border bg-card/60 hover:bg-card"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
