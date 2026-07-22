// Browser-only Litecoin wallet helpers. Keep this module free of bitcoinjs-lib
// and Node Buffer imports so Create/Import can never trip Buffer.alloc during
// route evaluation. Transaction signing imports bitcoinjs only on the Send page.
import * as scureBip39 from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { HDKey } from "@scure/bip32";
import { base58check, bech32 } from "@scure/base";
import { sha256 } from "@noble/hashes/sha2.js";
import { ripemd160 } from "@noble/hashes/legacy.js";
import ecc from "@bitcoinerlab/secp256k1";
import { litecoinMainnet, LTC } from "./network";

const b58check = base58check(sha256);

export type AddressType = "bech32" | "legacy" | "p2sh";

export interface DerivedAddress {
  path: string;
  address: string;
  pubkey: string;
  index: number;
  change: boolean;
}

export interface WalletKeys {
  // For HD wallets
  mnemonic?: string;
  // For single-key imports
  wif?: string;
}

export interface WalletMeta {
  id: string;
  name: string;
  kind: "hd" | "single" | "watch";
  addressType: AddressType;
  createdAt: number;
  // For watch-only: xpub or single address
  xpub?: string;
  address?: string;
}

export function generateMnemonic(strength: 128 | 256 = 128): string {
  return scureBip39.generateMnemonic(wordlist, strength);
}

export function validateMnemonic(m: string): boolean {
  return scureBip39.validateMnemonic(m.trim(), wordlist);
}

function purposeFor(t: AddressType): number {
  return t === "bech32" ? 84 : t === "p2sh" ? 49 : 44;
}

export function deriveFromMnemonic(
  mnemonic: string,
  addressType: AddressType,
  count = 5,
  account = 0,
  passphrase = "",
): DerivedAddress[] {
  const seed = scureBip39.mnemonicToSeedSync(mnemonic.trim(), passphrase);
  const root = HDKey.fromMasterSeed(seed, {
    private: litecoinMainnet.bip32.private,
    public: litecoinMainnet.bip32.public,
  });
  const purpose = purposeFor(addressType);
  const basePath = `m/${purpose}'/${LTC.bip44CoinType}'/${account}'/0`;
  const branch = root.derive(basePath);
  const out: DerivedAddress[] = [];
  for (let i = 0; i < count; i++) {
    const child = branch.deriveChild(i);
    if (!child.publicKey) throw new Error("Derivation failed");
    const pub = child.publicKey;
    out.push({
      path: `${basePath}/${i}`,
      address: addressFromPubkey(pub, addressType),
      pubkey: bytesToHex(pub),
      index: i,
      change: false,
    });
  }
  return out;
}

export interface DerivedAddressTagged extends DerivedAddress {
  addressType: AddressType;
}

// Derive addresses across all three standard Litecoin BIP levels:
//   BIP44 → m/44'/2'/…  → legacy   L…
//   BIP49 → m/49'/2'/…  → p2sh-segwit M…
//   BIP84 → m/84'/2'/…  → native segwit ltc1…
// This mirrors what Electrum-LTC / Litewallet / Trezor Suite do so an
// imported seed surfaces every address a user might already have funds on.
export function deriveAllStandards(
  mnemonic: string,
  countPerType = 3,
  account = 0,
  passphrase = "",
): DerivedAddressTagged[] {
  const types: AddressType[] = ["bech32", "p2sh", "legacy"];
  const out: DerivedAddressTagged[] = [];
  for (const t of types) {
    for (const d of deriveFromMnemonic(mnemonic, t, countPerType, account, passphrase)) {
      out.push({ ...d, addressType: t });
    }
  }
  return out;
}

export function addressFromPubkey(pubkey: Uint8Array, addressType: AddressType): string {
  const pubkeyHash = hash160(pubkey);
  if (addressType === "bech32") {
    return bech32.encode(litecoinMainnet.bech32, [0, ...bech32.toWords(pubkeyHash)]);
  }
  if (addressType === "p2sh") {
    const redeemScript = concatBytes(Uint8Array.of(0x00, 0x14), pubkeyHash);
    return b58check.encode(concatBytes(Uint8Array.of(litecoinMainnet.scriptHash), hash160(redeemScript)));
  }
  return b58check.encode(concatBytes(Uint8Array.of(litecoinMainnet.pubKeyHash), pubkeyHash));
}

export function addressFromWif(wif: string, addressType: AddressType): { address: string; pubkey: string } {
  const trimmed = wif.trim();
  const decoded = b58check.decode(trimmed);
  if (decoded[0] !== litecoinMainnet.wif) {
    throw new Error("Not a Litecoin WIF key (wrong version byte).");
  }
  // Compressed keys are 34 bytes total (1 version + 32 priv + 0x01), uncompressed are 33.
  if (decoded.length !== 34 && decoded.length !== 33) {
    throw new Error("Invalid WIF length.");
  }
  const priv = decoded.slice(1, 33);
  const compressed = decoded.length === 34 ? decoded[33] === 0x01 : false;
  const pubkey = ecc.pointFromScalar(priv, compressed);
  if (!pubkey) throw new Error("Invalid WIF private key.");
  const pub = pubkey instanceof Uint8Array ? pubkey : new Uint8Array(pubkey);
  return { address: addressFromPubkey(pub, addressType), pubkey: bytesToHex(pub) };
}

export function validateAddress(addr: string): { valid: boolean; type?: AddressType } {
  try {
    const s = addr.trim();
    if (s.toLowerCase().startsWith(`${litecoinMainnet.bech32}1`)) {
      const decoded = bech32.decode(s.toLowerCase());
      const [version, ...programWords] = decoded.words;
      const program = bech32.fromWords(programWords);
      if (decoded.prefix === litecoinMainnet.bech32 && version === 0 && (program.length === 20 || program.length === 32)) {
        return { valid: true, type: "bech32" };
      }
      return { valid: false };
    }
    const decoded = b58check.decode(s);
    if (decoded.length !== 21) return { valid: false };
    if (decoded[0] === litecoinMainnet.pubKeyHash) {
      return { valid: true, type: "legacy" };
    }
    if (decoded[0] === litecoinMainnet.scriptHash || decoded[0] === 0x05) {
      return { valid: true, type: "p2sh" };
    }
    return { valid: false };
  } catch {
    return { valid: false };
  }
}

export function newId(): string {
  return "w_" + crypto.getRandomValues(new Uint8Array(8)).reduce((s, b) => s + b.toString(16).padStart(2, "0"), "");
}

function bytesToHex(u: Uint8Array): string {
  let s = "";
  for (let i = 0; i < u.length; i++) s += u[i].toString(16).padStart(2, "0");
  return s;
}

function hash160(bytes: Uint8Array): Uint8Array {
  return ripemd160(sha256(bytes));
}

function concatBytes(...chunks: Uint8Array[]): Uint8Array {
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

// -------- KeyPair helpers (replacement for ECPair, no Buffer needed) --------
export interface KeyPair {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  compressed: boolean;
  sign(hash: Uint8Array): Uint8Array;
}

export function keyPairFromPrivate(priv: Uint8Array, compressed = true): KeyPair {
  const pub = ecc.pointFromScalar(priv, compressed);
  if (!pub) throw new Error("Invalid private key");
  const publicKey = pub instanceof Uint8Array ? pub : new Uint8Array(pub);
  return {
    privateKey: priv,
    publicKey,
    compressed,
    sign(hash: Uint8Array) {
      const sig = ecc.sign(hash, priv);
      return sig instanceof Uint8Array ? sig : new Uint8Array(sig);
    },
  };
}

export function keyPairFromWif(wif: string): KeyPair {
  const decoded = b58check.decode(wif.trim());
  if (decoded[0] !== litecoinMainnet.wif) throw new Error("Not a Litecoin WIF key.");
  if (decoded.length !== 34 && decoded.length !== 33) throw new Error("Invalid WIF length.");
  const priv = decoded.slice(1, 33);
  const compressed = decoded.length === 34 ? decoded[33] === 0x01 : false;
  return keyPairFromPrivate(priv, compressed);
}

// Re-export helpers for transaction/signing modules.
export { HDKey, scureBip39 };