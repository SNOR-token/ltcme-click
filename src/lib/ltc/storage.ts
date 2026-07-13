// Browser-local wallet storage (non-custodial, plaintext in localStorage).
// The user is responsible for backing up their seed phrase. There is no
// separate app password — the optional BIP39 passphrase (25th word) is the
// only extra secret and is stored alongside the mnemonic.
import type { AddressType, WalletMeta } from "./wallet";

const KEY = "ltcme.wallets.v1";

export interface StoredWallet {
  meta: WalletMeta;
  // Plaintext secret. For HD wallets: JSON string {mnemonic, passphrase}.
  // For single-key: WIF. Watch-only wallets have no secret.
  secret?: string;
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