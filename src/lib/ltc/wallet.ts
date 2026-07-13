// Browser-only Litecoin wallet helpers. Import from client components only.
import * as bitcoin from "bitcoinjs-lib";
import BIP32Factory from "bip32";
import * as bip39 from "bip39";
import ecc from "@bitcoinerlab/secp256k1";
import { ECPairFactory } from "ecpair";
import { Buffer } from "buffer";
import { litecoinMainnet, LTC } from "./network";

// Buffer polyfill for browser deps that expect a global Buffer.
if (typeof (globalThis as any).Buffer === "undefined") {
  (globalThis as any).Buffer = Buffer;
}

bitcoin.initEccLib(ecc as any);
const bip32 = BIP32Factory(ecc as any);
const ECPair = ECPairFactory(ecc as any);

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
  return bip39.generateMnemonic(strength);
}

export function validateMnemonic(m: string): boolean {
  return bip39.validateMnemonic(m.trim());
}

function purposeFor(t: AddressType): number {
  return t === "bech32" ? 84 : t === "p2sh" ? 49 : 44;
}

export function deriveFromMnemonic(
  mnemonic: string,
  addressType: AddressType,
  count = 5,
  account = 0,
): DerivedAddress[] {
  const seed = bip39.mnemonicToSeedSync(mnemonic.trim());
  const root = bip32.fromSeed(seed, litecoinMainnet as any);
  const purpose = purposeFor(addressType);
  const basePath = `m/${purpose}'/${LTC.bip44CoinType}'/${account}'/0`;
  const branch = root.derivePath(basePath);
  const out: DerivedAddress[] = [];
  for (let i = 0; i < count; i++) {
    const child = branch.derive(i);
    const address = addressFromPubkey(Buffer.from(child.publicKey), addressType);
    out.push({
      path: `${basePath}/${i}`,
      address,
      pubkey: Buffer.from(child.publicKey).toString("hex"),
      index: i,
      change: false,
    });
  }
  return out;
}

export function addressFromPubkey(pubkey: Buffer, addressType: AddressType): string {
  if (addressType === "bech32") {
    return bitcoin.payments.p2wpkh({ pubkey, network: litecoinMainnet as any }).address!;
  }
  if (addressType === "p2sh") {
    return bitcoin.payments.p2sh({
      redeem: bitcoin.payments.p2wpkh({ pubkey, network: litecoinMainnet as any }),
      network: litecoinMainnet as any,
    }).address!;
  }
  return bitcoin.payments.p2pkh({ pubkey, network: litecoinMainnet as any }).address!;
}

export function addressFromWif(wif: string, addressType: AddressType): { address: string; pubkey: string } {
  const kp = ECPair.fromWIF(wif.trim(), litecoinMainnet as any);
  const pubkey = Buffer.from(kp.publicKey);
  return { address: addressFromPubkey(pubkey, addressType), pubkey: pubkey.toString("hex") };
}

export function validateAddress(addr: string): { valid: boolean; type?: AddressType } {
  try {
    const s = addr.trim();
    if (s.startsWith("ltc1")) {
      bitcoin.address.toOutputScript(s, litecoinMainnet as any);
      return { valid: true, type: "bech32" };
    }
    if (s.startsWith("M") || s.startsWith("3")) {
      bitcoin.address.toOutputScript(s, litecoinMainnet as any);
      return { valid: true, type: "p2sh" };
    }
    if (s.startsWith("L")) {
      bitcoin.address.toOutputScript(s, litecoinMainnet as any);
      return { valid: true, type: "legacy" };
    }
    return { valid: false };
  } catch {
    return { valid: false };
  }
}

export function newId(): string {
  return "w_" + crypto.getRandomValues(new Uint8Array(8)).reduce((s, b) => s + b.toString(16).padStart(2, "0"), "");
}

// Re-export helpers for tx builder
export { bitcoin, bip32, ECPair };