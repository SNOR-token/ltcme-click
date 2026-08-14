// Litecoin multisig (m-of-n) — creation, address derivation, PSBT build/sign/finalize.
// Fully client-side and non-custodial. Cosigner keys are account-level extended
// public keys (xpub / Ltub / tpub) or raw compressed public keys.
import "@/lib/buffer-polyfill";
import * as bitcoin from "bitcoinjs-lib";
import { HDKey } from "@scure/bip32";
import { base58check } from "@scure/base";
import { sha256 } from "@noble/hashes/sha2.js";
import * as scureBip39 from "@scure/bip39";
import { Buffer } from "buffer";
import coinSelect from "coinselect";
import { litecoinMainnet } from "./network";
import { litecoinTestnet, getNetworkMode, type NetMode } from "./network-mode";
import { validateMnemonic, keyPairFromPrivate } from "./wallet";
import { getUtxos, getRawTx, estimateFeeRate } from "./api";
import { useSyncExternalStore } from "react";

const b58check = base58check(sha256);

export type MultisigScript = "p2wsh" | "p2sh-p2wsh" | "p2sh";

export interface Cosigner {
  id: string;
  label: string;
  /** Extended public key (any common flavour) or 33-byte hex pubkey. */
  key: string;
  /** Optional origin path, informational + used when signing with a seed. */
  path?: string;
}

export interface MultisigWallet {
  id: string;
  name: string;
  m: number;
  script: MultisigScript;
  network: NetMode;
  cosigners: Cosigner[];
  createdAt: number;
}

export const DEFAULT_ACCOUNT_PATH = "m/48'/2'/0'/2'";

export function net() {
  return (getNetworkMode() === "testnet" ? litecoinTestnet : litecoinMainnet) as any;
}

// ---------------------------------------------------------------- key parsing

const XPUB_VERSION = 0x0488b21e;

function u32(bytes: Uint8Array) {
  return ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
}

/** Known account-level *public* extended key versions across LTC/BTC flavours. */
const KNOWN_PUB_VERSIONS = new Set([
  0x0488b21e, // xpub
  0x019da462, // Ltub
  0x01b26ef6, // Mtub (LTC p2sh-segwit)
  0x04b24746, // zpub
  0x049d7cb2, // ypub
  0x043587cf, // tpub
  0x044a5262, // upub
  0x045f1cf6, // vpub
  0x0436f6e1, // ttub (LTC testnet)
]);

export function isHexPubkey(s: string) {
  return /^0[23][0-9a-fA-F]{64}$/.test(s.trim());
}

/** Normalise any supported extended public key into an HDKey. */
export function parseExtendedPub(key: string): HDKey {
  const raw = b58check.decode(key.trim());
  if (raw.length !== 78) throw new Error("Not a valid extended key.");
  const version = u32(raw);
  if (!KNOWN_PUB_VERSIONS.has(version)) throw new Error("Unsupported extended key version (need a public key, not private).");
  const copy = Uint8Array.from(raw);
  copy[0] = (XPUB_VERSION >>> 24) & 0xff;
  copy[1] = (XPUB_VERSION >>> 16) & 0xff;
  copy[2] = (XPUB_VERSION >>> 8) & 0xff;
  copy[3] = XPUB_VERSION & 0xff;
  return HDKey.fromExtendedKey(b58check.encode(copy));
}

export function validateCosignerKey(key: string): { valid: boolean; error?: string } {
  const s = key.trim();
  if (!s) return { valid: false, error: "Key is required." };
  if (isHexPubkey(s)) return { valid: true };
  try {
    parseExtendedPub(s);
    return { valid: true };
  } catch (e: any) {
    return { valid: false, error: e?.message ?? "Invalid key." };
  }
}

function cosignerPubkey(c: Cosigner, change: 0 | 1, index: number): Uint8Array {
  const s = c.key.trim();
  if (isHexPubkey(s)) return Uint8Array.from(Buffer.from(s, "hex"));
  const node = parseExtendedPub(s).derive(`m/${change}/${index}`);
  if (!node.publicKey) throw new Error("Derivation failed for cosigner " + c.label);
  return node.publicKey;
}

// ------------------------------------------------------------ address scripts

export interface DerivedMultisig {
  address: string;
  index: number;
  change: 0 | 1;
  witnessScript?: Buffer;
  redeemScript?: Buffer;
  output: Buffer;
  pubkeys: Buffer[];
}

export function deriveMultisigAddress(w: MultisigWallet, index: number, change: 0 | 1 = 0): DerivedMultisig {
  const network = net();
  const pubkeys = w.cosigners
    .map((c) => Buffer.from(cosignerPubkey(c, change, index)))
    .sort((a, b) => a.compare(b)); // BIP67 deterministic ordering
  const p2ms = bitcoin.payments.p2ms({ m: w.m, pubkeys, network });

  if (w.script === "p2wsh") {
    const p = bitcoin.payments.p2wsh({ redeem: p2ms, network });
    return { address: p.address!, index, change, witnessScript: p2ms.output!, output: p.output!, pubkeys };
  }
  if (w.script === "p2sh-p2wsh") {
    const p2wsh = bitcoin.payments.p2wsh({ redeem: p2ms, network });
    const p = bitcoin.payments.p2sh({ redeem: p2wsh, network });
    return {
      address: p.address!,
      index,
      change,
      witnessScript: p2ms.output!,
      redeemScript: p2wsh.output!,
      output: p.output!,
      pubkeys,
    };
  }
  const p = bitcoin.payments.p2sh({ redeem: p2ms, network });
  return { address: p.address!, index, change, redeemScript: p2ms.output!, output: p.output!, pubkeys };
}

export function deriveMany(w: MultisigWallet, count = 5, change: 0 | 1 = 0): DerivedMultisig[] {
  return Array.from({ length: count }, (_, i) => deriveMultisigAddress(w, i, change));
}

/** Output descriptor string (Bitcoin Core / Sparrow compatible shape). */
export function descriptor(w: MultisigWallet): string {
  const keys = w.cosigners
    .map((c) => (isHexPubkey(c.key) ? c.key.trim() : `${c.key.trim()}/<0;1>/*`))
    .join(",");
  const inner = `sortedmulti(${w.m},${keys})`;
  if (w.script === "p2wsh") return `wsh(${inner})`;
  if (w.script === "p2sh-p2wsh") return `sh(wsh(${inner}))`;
  return `sh(${inner})`;
}

// ------------------------------------------------------------------- storage

const KEY = "ltcme.multisig.v1";
const listeners = new Set<() => void>();
let cache: MultisigWallet[] | null = null;

function emit() {
  cache = null;
  listeners.forEach((l) => l());
}

export function loadMultisig(): MultisigWallet[] {
  if (typeof window === "undefined") return [];
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? "[]") as MultisigWallet[];
  } catch {
    cache = [];
  }
  return cache;
}

function persist(list: MultisigWallet[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  emit();
}

export function saveMultisig(w: MultisigWallet) {
  const list = loadMultisig().slice();
  const i = list.findIndex((x) => x.id === w.id);
  if (i >= 0) list[i] = w;
  else list.push(w);
  persist(list);
}

export function deleteMultisig(id: string) {
  persist(loadMultisig().filter((w) => w.id !== id));
}

export function useMultisigWallets(network: NetMode): MultisigWallet[] {
  const all = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    loadMultisig,
    () => [] as MultisigWallet[],
  );
  return all.filter((w) => w.network === network);
}

export function newMsId() {
  return "ms_" + crypto.getRandomValues(new Uint8Array(6)).reduce((s, b) => s + b.toString(16).padStart(2, "0"), "");
}

// ------------------------------------------------------------------ spending

export interface SpendRequest {
  wallet: MultisigWallet;
  toAddress: string;
  amountSats: number;
  feeRate?: number;
  scanDepth?: number;
}

/** Build an unsigned PSBT spending from the wallet's derived addresses. */
export async function buildMultisigPsbt(req: SpendRequest): Promise<{ psbtBase64: string; feeSats: number }> {
  const depth = req.scanDepth ?? 10;
  const feeRate = req.feeRate ?? (await estimateFeeRate());
  const derived: DerivedMultisig[] = [
    ...deriveMany(req.wallet, depth, 0),
    ...deriveMany(req.wallet, depth, 1),
  ];
  const byAddress = new Map(derived.map((d) => [d.address, d]));

  const utxos: (Utxoish & { address: string })[] = [];
  for (const d of derived) {
    const list = await getUtxos(d.address);
    for (const u of list) utxos.push({ txid: u.txid, vout: u.vout, value: u.value, address: d.address });
  }
  if (!utxos.length) throw new Error("This multisig wallet has no spendable coins yet.");

  const { inputs, outputs, fee } = coinSelect(
    utxos.map((u) => ({ ...u, txId: u.txid })),
    [{ address: req.toAddress, value: req.amountSats }],
    feeRate,
  );
  if (!inputs || !outputs) throw new Error("Not enough funds for this amount + fee.");

  const psbt = new bitcoin.Psbt({ network: net() });
  for (const inp of inputs) {
    const d = byAddress.get(inp.address)!;
    if (req.wallet.script === "p2sh") {
      const rawHex = await getRawTx(inp.txid);
      psbt.addInput({
        hash: inp.txid,
        index: inp.vout,
        nonWitnessUtxo: Buffer.from(rawHex, "hex"),
        redeemScript: d.redeemScript!,
      });
    } else {
      psbt.addInput({
        hash: inp.txid,
        index: inp.vout,
        witnessUtxo: { script: d.output, value: inp.value },
        witnessScript: d.witnessScript!,
        ...(d.redeemScript ? { redeemScript: d.redeemScript } : {}),
      });
    }
  }
  const changeAddress = deriveMultisigAddress(req.wallet, 0, 1).address;
  for (const out of outputs) {
    psbt.addOutput({ address: out.address ?? changeAddress, value: out.value });
  }
  return { psbtBase64: psbt.toBase64(), feeSats: fee };
}

interface Utxoish {
  txid: string;
  vout: number;
  value: number;
}

/**
 * Sign a PSBT with a cosigner seed (BIP39 mnemonic). Derives candidate keys
 * from the given account path and signs every input whose witness/redeem
 * script contains a matching public key.
 */
export function signMultisigPsbt(
  psbtBase64: string,
  mnemonic: string,
  opts: { accountPath?: string; passphrase?: string; scanDepth?: number } = {},
): { psbtBase64: string; signedInputs: number } {
  const m = mnemonic.trim();
  if (!validateMnemonic(m)) throw new Error("Enter a valid BIP39 seed phrase for this cosigner.");
  const depth = opts.scanDepth ?? 20;
  const accountPath = opts.accountPath || DEFAULT_ACCOUNT_PATH;
  const seed = scureBip39.mnemonicToSeedSync(m, opts.passphrase ?? "");
  const network = net();
  const root = HDKey.fromMasterSeed(seed, { private: network.bip32.private, public: network.bip32.public });
  const account = root.derive(accountPath);

  const candidates = new Map<string, ReturnType<typeof keyPairFromPrivate>>();
  for (const change of [0, 1]) {
    const branch = account.deriveChild(change);
    for (let i = 0; i < depth; i++) {
      const child = branch.deriveChild(i);
      if (!child.privateKey || !child.publicKey) continue;
      const kp = keyPairFromPrivate(child.privateKey, true);
      candidates.set(Buffer.from(kp.publicKey).toString("hex"), kp);
    }
  }

  const psbt = bitcoin.Psbt.fromBase64(psbtBase64, { network });
  let signed = 0;
  for (let i = 0; i < psbt.data.inputs.length; i++) {
    const inp = psbt.data.inputs[i];
    const script = inp.witnessScript ?? inp.redeemScript;
    if (!script) continue;
    const decoded = bitcoin.payments.p2ms({ output: script, network });
    const mine = (decoded.pubkeys ?? []).find((pk) => candidates.has(Buffer.from(pk).toString("hex")));
    if (!mine) continue;
    const kp = candidates.get(Buffer.from(mine).toString("hex"))!;
    psbt.signInput(i, {
      publicKey: Buffer.from(kp.publicKey),
      sign: (hash: Buffer) => Buffer.from(kp.sign(hash)),
    });
    signed++;
  }
  if (!signed) throw new Error("This seed does not match any cosigner key in the PSBT (check the account path).");
  return { psbtBase64: psbt.toBase64(), signedInputs: signed };
}

/** Try to finalize a PSBT and return the broadcastable raw transaction. */
export function finalizeMultisigPsbt(psbtBase64: string): { rawHex: string; txid: string } {
  const psbt = bitcoin.Psbt.fromBase64(psbtBase64, { network: net() });
  psbt.finalizeAllInputs();
  const tx = psbt.extractTransaction();
  return { rawHex: tx.toHex(), txid: tx.getId() };
}

/** How many signatures each input currently holds. */
export function psbtSignatureCounts(psbtBase64: string): number[] {
  const psbt = bitcoin.Psbt.fromBase64(psbtBase64, { network: net() });
  return psbt.data.inputs.map((i) => i.partialSig?.length ?? 0);
}

/** Derive the account-level extended public key to hand to other cosigners. */
export function accountXpubFromMnemonic(mnemonic: string, accountPath = DEFAULT_ACCOUNT_PATH, passphrase = ""): string {
  const m = mnemonic.trim();
  if (!validateMnemonic(m)) throw new Error("Enter a valid BIP39 seed phrase.");
  const seed = scureBip39.mnemonicToSeedSync(m, passphrase);
  const network = net();
  const root = HDKey.fromMasterSeed(seed, { private: network.bip32.private, public: network.bip32.public });
  return root.derive(accountPath).publicExtendedKey;
}