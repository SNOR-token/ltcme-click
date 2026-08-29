// Browser-local wallet storage (non-custodial).
// Secrets are stored only inside an encrypted vault (AES-GCM + PBKDF2).
// Legacy plaintext records are detected and must be migrated by the user
// with a vault password before continued use.
import type { AddressType, WalletMeta } from "./wallet";
import {
  type VaultRecord,
  isVaultRecord,
  isLegacyPlaintextSecret,
  createVault,
  unlockVault,
  parseLegacySecret,
  type VaultPayload,
} from "./vault";

const KEY = "ltcme.wallets.v1";
const KEY_V2 = "ltcme.wallets.v2";

export interface StoredWallet {
  meta: WalletMeta;
  /**
   * Encrypted vault (v2). Prefer this.
   * Legacy: optional plaintext string (mnemonic JSON or WIF) — must migrate.
   */
  vault?: VaultRecord;
  /** @deprecated Plaintext secret — only present on unmigrated wallets. */
  secret?: string;
  addresses: { address: string; path?: string; index?: number }[];
}

export interface WalletStore {
  version: 1 | 2;
  wallets: StoredWallet[];
}

function emptyStore(): WalletStore {
  return { version: 2, wallets: [] };
}

export function loadStore(): WalletStore {
  if (typeof window === "undefined") return emptyStore();
  try {
    // Prefer v2 key; fall back to v1 for migration detection.
    const rawV2 = localStorage.getItem(KEY_V2);
    if (rawV2) {
      const parsed = JSON.parse(rawV2) as WalletStore;
      if (parsed && Array.isArray(parsed.wallets)) return { version: 2, wallets: parsed.wallets };
    }
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as WalletStore;
    if (!parsed || !Array.isArray(parsed.wallets)) return emptyStore();
    return { version: 1, wallets: parsed.wallets };
  } catch {
    return emptyStore();
  }
}

export function saveStore(s: WalletStore) {
  const next: WalletStore = { version: 2, wallets: s.wallets };
  localStorage.setItem(KEY_V2, JSON.stringify(next));
  // Keep v1 in sync without plaintext if possible (strip secrets for residual v1).
  // After full migration we can remove KEY; for now write sanitized v1 for older tabs.
  try {
    const sanitized: WalletStore = {
      version: 2,
      wallets: s.wallets.map((w) => ({
        meta: w.meta,
        addresses: w.addresses,
        ...(w.vault ? { vault: w.vault } : {}),
        // Never write plaintext secret to storage once vault exists
        ...(!w.vault && w.secret ? { secret: w.secret } : {}),
      })),
    };
    localStorage.setItem(KEY, JSON.stringify(sanitized));
  } catch {
    // ignore quota / private mode
  }
}

export function upsertWallet(w: StoredWallet) {
  const s = loadStore();
  const i = s.wallets.findIndex((x) => x.meta.id === w.meta.id);
  // Refuse to persist plaintext if a vault is available for this write
  const safe: StoredWallet = { ...w };
  if (safe.vault && safe.secret) {
    delete safe.secret;
  }
  if (i >= 0) s.wallets[i] = safe;
  else s.wallets.push(safe);
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

/** True if this wallet still has a plaintext secret that needs migration. */
export function needsVaultMigration(w: StoredWallet): boolean {
  if (w.meta.kind === "watch") return false;
  if (w.vault && isVaultRecord(w.vault)) return false;
  return isLegacyPlaintextSecret(w.secret);
}

/**
 * Encrypt a secret into a vault and persist the wallet without plaintext.
 */
export async function storeEncryptedSecret(
  wallet: StoredWallet,
  password: string,
  payload: VaultPayload,
): Promise<StoredWallet> {
  const vault = await createVault(password, payload);
  const next: StoredWallet = {
    meta: wallet.meta,
    addresses: wallet.addresses,
    vault,
  };
  upsertWallet(next);
  return next;
}

/**
 * Unlock vault and return secret material for signing. Caller must not persist
 * the result and should drop references after use.
 */
export async function unlockWalletSecret(
  wallet: StoredWallet,
  password: string,
): Promise<{ mnemonicOrWif: string; passphrase: string; kind: "hd" | "single" }> {
  if (wallet.vault && isVaultRecord(wallet.vault)) {
    const payload = await unlockVault(password, wallet.vault);
    if (payload.kind === "single") {
      return { mnemonicOrWif: payload.secret, passphrase: "", kind: "single" };
    }
    try {
      const p = JSON.parse(payload.secret) as { mnemonic: string; passphrase?: string };
      return {
        mnemonicOrWif: p.mnemonic,
        passphrase: typeof p.passphrase === "string" ? p.passphrase : "",
        kind: "hd",
      };
    } catch {
      return { mnemonicOrWif: payload.secret, passphrase: "", kind: "hd" };
    }
  }

  // Legacy path — only allowed during migration; still requires password to re-encrypt.
  if (wallet.secret && isLegacyPlaintextSecret(wallet.secret)) {
    const legacy = parseLegacySecret(wallet.secret, wallet.meta.kind);
    if (!legacy) throw new Error("Cannot unlock this wallet.");
    // Migrate in place
    await storeEncryptedSecret(wallet, password, legacy);
    return unlockWalletSecret({ ...wallet, vault: (await createVault(password, legacy)), secret: undefined }, password);
  }

  throw new Error("No encrypted vault found. Migrate this wallet with a password first.");
}

/**
 * One-shot migration: encrypt existing plaintext and wipe it from storage.
 */
export async function migrateWalletToVault(wallet: StoredWallet, password: string): Promise<StoredWallet> {
  if (!wallet.secret || !isLegacyPlaintextSecret(wallet.secret)) {
    if (wallet.vault) return wallet;
    throw new Error("Nothing to migrate.");
  }
  const legacy = parseLegacySecret(wallet.secret, wallet.meta.kind);
  if (!legacy) throw new Error("Unsupported legacy secret format.");
  return storeEncryptedSecret(wallet, password, legacy);
}

export type { AddressType, VaultPayload, VaultRecord };
