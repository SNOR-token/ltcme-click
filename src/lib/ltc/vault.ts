// Encrypted vault for wallet secrets. Secrets are never persisted in plaintext.
// Uses PBKDF2 (250k iterations) + AES-GCM via Web Crypto (same primitives as crypto.ts).
import { encryptString, decryptString, type Encrypted } from "./crypto";

export const VAULT_VERSION = 2 as const;

/** Persisted envelope — ciphertext only; no mnemonic/WIF/passphrase in cleartext. */
export interface VaultRecord {
  v: typeof VAULT_VERSION;
  /** Authenticated encrypted payload (AES-GCM). */
  enc: Encrypted;
  /** Non-secret metadata for UX (never contains key material). */
  lockedAt?: number;
}

export interface VaultPayload {
  /** HD: { mnemonic, passphrase? }. Single-key: { wif }. */
  secret: string;
  kind: "hd" | "single";
}

/**
 * Create an encrypted vault from a password and secret payload.
 * Password should be a user-chosen app unlock password (not the BIP39 passphrase).
 */
export async function createVault(password: string, payload: VaultPayload): Promise<VaultRecord> {
  if (!password || password.length < 8) {
    throw new Error("Vault password must be at least 8 characters.");
  }
  const plain = JSON.stringify(payload);
  const enc = await encryptString(plain, password);
  return { v: VAULT_VERSION, enc, lockedAt: Date.now() };
}

/**
 * Unlock a vault. Throws on wrong password or tampered ciphertext.
 */
export async function unlockVault(password: string, record: VaultRecord): Promise<VaultPayload> {
  if (record.v !== VAULT_VERSION) {
    throw new Error("Unsupported vault version. Update the app to open this wallet.");
  }
  const plain = await decryptString(record.enc, password);
  const parsed = JSON.parse(plain) as VaultPayload;
  if (!parsed || typeof parsed.secret !== "string" || (parsed.kind !== "hd" && parsed.kind !== "single")) {
    throw new Error("Vault contents are invalid.");
  }
  return parsed;
}

/** True if a stored value looks like an encrypted vault (v2), not legacy plaintext. */
export function isVaultRecord(value: unknown): value is VaultRecord {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    v.v === VAULT_VERSION &&
    typeof v.enc === "object" &&
    v.enc !== null &&
    typeof (v.enc as Encrypted).s === "string" &&
    typeof (v.enc as Encrypted).n === "string" &&
    typeof (v.enc as Encrypted).c === "string"
  );
}

/**
 * Detect legacy plaintext secrets (pre-vault).
 * - HD was stored as JSON string {mnemonic, passphrase}
 * - Single-key was raw WIF
 */
export function isLegacyPlaintextSecret(secret: string | undefined): boolean {
  if (!secret || typeof secret !== "string") return false;
  // Encrypted vault is stored as a JSON object in the new schema, not as a plain string secret field.
  // Legacy: either starts with { and has mnemonic, or looks like WIF.
  if (secret.startsWith("{")) {
    try {
      const p = JSON.parse(secret);
      return typeof p?.mnemonic === "string";
    } catch {
      return false;
    }
  }
  // Compressed/uncompressed Litecoin WIF heuristic
  return /^[5KLTc9][1-9A-HJ-NP-Za-km-z]{50,51}$/.test(secret.trim());
}

/** Parse legacy plaintext secret into VaultPayload for migration. */
export function parseLegacySecret(secret: string, kind: "hd" | "single" | "watch"): VaultPayload | null {
  if (kind === "watch") return null;
  if (kind === "single") {
    return { secret: secret.trim(), kind: "single" };
  }
  try {
    const p = JSON.parse(secret);
    if (typeof p?.mnemonic === "string") {
      const payload: { mnemonic: string; passphrase?: string } = { mnemonic: p.mnemonic };
      if (typeof p.passphrase === "string" && p.passphrase) payload.passphrase = p.passphrase;
      return { secret: JSON.stringify(payload), kind: "hd" };
    }
  } catch {
    // Treat as raw mnemonic
    return { secret: JSON.stringify({ mnemonic: secret.trim(), passphrase: "" }), kind: "hd" };
  }
  return null;
}
