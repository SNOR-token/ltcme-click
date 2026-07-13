// Encrypted browser storage for wallet keys.
import type { Encrypted } from "./crypto";
import type { AddressType, WalletMeta } from "./wallet";

const KEY = "ltcme.wallets.v1";

export interface StoredWallet {
  meta: WalletMeta;
  // Encrypted mnemonic OR wif OR (for watch-only) plaintext xpub/address stored in meta
  secret?: Encrypted;
  addresses: { address: string; path?: string; index?: number }[];
}

export interface WalletStore {
  version: 1;
  wallets: StoredWallet[];
}

export function loadStore(): WalletStore {
  if (typeof window === "undefined") return { version: 1, wallets: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { version: 1, wallets: [] };
    return JSON.parse(raw);
  } catch {
    return { version: 1, wallets: [] };
  }
}

export function saveStore(s: WalletStore) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function upsertWallet(w: StoredWallet) {
  const s = loadStore();
  const i = s.wallets.findIndex((x) => x.meta.id === w.meta.id);
  if (i >= 0) s.wallets[i] = w;
  else s.wallets.push(w);
  saveStore(s);
}

export function removeWallet(id: string) {
  const s = loadStore();
  s.wallets = s.wallets.filter((w) => w.meta.id !== id);
  saveStore(s);
}

export function getWallet(id: string): StoredWallet | undefined {
  return loadStore().wallets.find((w) => w.meta.id === id);
}

export type { AddressType };