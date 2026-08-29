/**
 * Canonical multisig policy normalization, fingerprinting, and PSBT policy checks.
 */
import { sha256 } from "@noble/hashes/sha2.js";
import type { MultisigScript, MultisigWallet, Cosigner } from "./multisig";
import { isHexPubkey, parseExtendedPub, deriveMultisigAddress, descriptor } from "./multisig";
import * as bitcoin from "bitcoinjs-lib";
import { Buffer } from "buffer";
import { litecoinMainnet } from "./network";

export interface CanonicalCosigner {
  label: string;
  key: string;
  path?: string;
}

export interface MultisigPolicy {
  m: number;
  n: number;
  script: MultisigScript;
  network: "mainnet";
  cosigners: CanonicalCosigner[];
  /** Human-readable descriptor */
  descriptor: string;
  /** First 16 hex chars of SHA256 over canonical JSON — for cosigner verification */
  fingerprint: string;
}

function bytesToHex(u: Uint8Array): string {
  return Array.from(u)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Stable JSON for hashing (sorted cosigner keys). */
function canonicalPayload(w: Pick<MultisigWallet, "m" | "script" | "network" | "cosigners">): string {
  const cosigners = [...w.cosigners]
    .map((c) => ({
      key: c.key.trim(),
      path: c.path?.trim() || undefined,
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
  return JSON.stringify({
    m: w.m,
    n: cosigners.length,
    script: w.script,
    network: w.network,
    cosigners,
  });
}

export function policyFingerprint(w: Pick<MultisigWallet, "m" | "script" | "network" | "cosigners">): string {
  const digest = sha256(new TextEncoder().encode(canonicalPayload(w)));
  return bytesToHex(digest).slice(0, 16);
}

export function buildPolicy(w: MultisigWallet): MultisigPolicy {
  validatePolicyShape(w);
  const cosigners: CanonicalCosigner[] = w.cosigners.map((c) => ({
    label: c.label,
    key: c.key.trim(),
    path: c.path?.trim() || undefined,
  }));
  return {
    m: w.m,
    n: cosigners.length,
    script: w.script,
    network: "mainnet",
    cosigners,
    descriptor: descriptor(w),
    fingerprint: policyFingerprint(w),
  };
}

export function validatePolicyShape(w: Pick<MultisigWallet, "m" | "cosigners" | "script">): void {
  const n = w.cosigners.length;
  if (n < 2) throw new Error("Multisig requires at least 2 cosigners (use a standard wallet for single-key).");
  if (w.m < 1 || w.m > n) throw new Error(`Invalid M-of-N: m=${w.m}, n=${n}`);
  if (w.m === 1 && n === 1) throw new Error("1-of-1 is not multisig.");
  const keys = w.cosigners.map((c) => c.key.trim());
  if (new Set(keys).size !== keys.length) throw new Error("Duplicate cosigner keys are not allowed.");
  for (const c of w.cosigners) {
    if (isHexPubkey(c.key)) continue;
    try {
      parseExtendedPub(c.key);
    } catch {
      throw new Error(`Invalid cosigner key for "${c.label}"`);
    }
  }
}

/**
 * Verify a base64 PSBT's first derived address context matches wallet policy
 * at the expected index (default 0 external).
 */
export function verifyPsbtMatchesPolicy(
  psbtBase64: string,
  wallet: MultisigWallet,
  opts: { index?: number; change?: 0 | 1 } = {},
): { ok: true; fingerprint: string; address: string } | { ok: false; error: string } {
  try {
    validatePolicyShape(wallet);
    const network = litecoinMainnet as any;
    const psbt = bitcoin.Psbt.fromBase64(psbtBase64, { network });
    if (psbt.data.inputs.length === 0) return { ok: false, error: "PSBT has no inputs." };

    const index = opts.index ?? 0;
    const change = opts.change ?? 0;
    const expected = deriveMultisigAddress(wallet, index, change);

    // Each input should reference the expected witness/redeem script when present
    for (let i = 0; i < psbt.data.inputs.length; i++) {
      const inp = psbt.data.inputs[i];
      const script = inp.witnessScript ?? inp.redeemScript;
      if (!script) continue;
      if (expected.witnessScript && script.equals(expected.witnessScript)) continue;
      if (expected.redeemScript && script.equals(expected.redeemScript)) continue;
      // Allow other indices in the same wallet by re-deriving scan
      let matched = false;
      for (let idx = 0; idx < 20 && !matched; idx++) {
        for (const ch of [0, 1] as const) {
          const d = deriveMultisigAddress(wallet, idx, ch);
          if (d.witnessScript && script.equals(d.witnessScript)) {
            matched = true;
            break;
          }
          if (d.redeemScript && script.equals(d.redeemScript)) {
            matched = true;
            break;
          }
        }
      }
      if (!matched) {
        return {
          ok: false,
          error: `Input ${i} script does not match this multisig policy (fingerprint ${policyFingerprint(wallet)}).`,
        };
      }
    }

    return {
      ok: true,
      fingerprint: policyFingerprint(wallet),
      address: expected.address,
    };
  } catch (e) {
    return { ok: false, error: String((e as Error).message || e) };
  }
}

/**
 * Count unique cosigner pubkeys that have partial signatures on each input.
 * Rejects counting the same key twice toward quorum.
 */
export function uniquePartialSigners(psbtBase64: string): number[] {
  const network = litecoinMainnet as any;
  const psbt = bitcoin.Psbt.fromBase64(psbtBase64, { network });
  return psbt.data.inputs.map((inp) => {
    const sigs = inp.partialSig ?? [];
    const pubs = new Set(sigs.map((s) => Buffer.from(s.pubkey).toString("hex")));
    return pubs.size;
  });
}

export function formatFingerprint(fp: string): string {
  // e.g. ab12-cd34-ef56-7890
  const h = fp.replace(/[^0-9a-f]/gi, "").toLowerCase().padEnd(16, "0").slice(0, 16);
  return `${h.slice(0, 4)}-${h.slice(4, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}`;
}
