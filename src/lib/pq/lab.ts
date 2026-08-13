// Experimental post-quantum lab helpers.
//
// IMPORTANT: nothing in this module touches Litecoin consensus. Keys and
// signatures produced here are test artifacts only. Litecoin mainnet
// transactions are NOT post-quantum protected today.
import { ml_dsa44, ml_dsa65, ml_dsa87 } from "@noble/post-quantum/ml-dsa.js";
import { slh_dsa_sha2_128f, slh_dsa_sha2_128s } from "@noble/post-quantum/slh-dsa.js";
import { utf8ToBytes } from "@noble/hashes/utils.js";

export interface PqScheme {
  id: string;
  name: string;
  family: "ML-DSA" | "SLH-DSA";
  note: string;
  impl: any;
}

export const PQ_SCHEMES: PqScheme[] = [
  { id: "ml-dsa-44", name: "ML-DSA-44", family: "ML-DSA", note: "FIPS 204, NIST level 2", impl: ml_dsa44 },
  { id: "ml-dsa-65", name: "ML-DSA-65", family: "ML-DSA", note: "FIPS 204, NIST level 3", impl: ml_dsa65 },
  { id: "ml-dsa-87", name: "ML-DSA-87", family: "ML-DSA", note: "FIPS 204, NIST level 5", impl: ml_dsa87 },
  { id: "slh-dsa-128f", name: "SLH-DSA-SHA2-128f", family: "SLH-DSA", note: "FIPS 205, fast variant", impl: slh_dsa_sha2_128f },
  { id: "slh-dsa-128s", name: "SLH-DSA-SHA2-128s", family: "SLH-DSA", note: "FIPS 205, small variant", impl: slh_dsa_sha2_128s },
];

export function getScheme(id: string): PqScheme {
  return PQ_SCHEMES.find((s) => s.id === id) ?? PQ_SCHEMES[0];
}

export function hex(b: Uint8Array, max = 32): string {
  const slice = b.slice(0, max);
  const h = Array.from(slice, (x) => x.toString(16).padStart(2, "0")).join("");
  return b.length > max ? `${h}… (${b.length} bytes)` : h;
}

export function keygen(id: string) {
  const s = getScheme(id);
  const seed = crypto.getRandomValues(new Uint8Array(s.family === "ML-DSA" ? 32 : 48));
  const keys = s.impl.keygen(seed);
  return { publicKey: keys.publicKey as Uint8Array, secretKey: keys.secretKey as Uint8Array };
}

export function sign(id: string, secretKey: Uint8Array, message: string) {
  return getScheme(id).impl.sign(secretKey, utf8ToBytes(message)) as Uint8Array;
}

export function verify(id: string, publicKey: Uint8Array, message: string, sig: Uint8Array) {
  try {
    return getScheme(id).impl.verify(publicKey, utf8ToBytes(message), sig) as boolean;
  } catch {
    return false;
  }
}

export const CLASSICAL_SIG_BYTES = 72;
export const CLASSICAL_PUBKEY_BYTES = 33;

/** Simulate a hypothetical future PQ input cost. Illustrative only. */
export function simulateFee(pqSigBytes: number, pqPubBytes: number, inputs: number, feeRate: number) {
  const classicalVb = 10 + (inputs * (CLASSICAL_SIG_BYTES + CLASSICAL_PUBKEY_BYTES)) / 4 + 31;
  const pqVb = 10 + (inputs * (pqSigBytes + pqPubBytes)) / 4 + 31;
  return {
    classicalVb: Math.ceil(classicalVb),
    pqVb: Math.ceil(pqVb),
    classicalSats: Math.ceil(classicalVb * feeRate),
    pqSats: Math.ceil(pqVb * feeRate),
  };
}

export const PQ_PROPOSALS = [
  {
    title: "BIP-360: Pay to Quantum Resistant Hash (P2QRH)",
    chain: "Bitcoin",
    status: "Draft",
    url: "https://github.com/bitcoin/bips/blob/master/bip-0360.mediawiki",
    summary:
      "Proposes a new output type committing to post-quantum public keys — the leading concrete PQ output proposal Litecoin would likely track.",
  },
  {
    title: "NIST FIPS 204 (ML-DSA)",
    chain: "Standards",
    status: "Final",
    url: "https://csrc.nist.gov/pubs/fips/204/final",
    summary: "Module-lattice digital signature standard. The signature scheme most proposals build on.",
  },
  {
    title: "NIST FIPS 205 (SLH-DSA)",
    chain: "Standards",
    status: "Final",
    url: "https://csrc.nist.gov/pubs/fips/205/final",
    summary: "Stateless hash-based signatures — conservative security, much larger signatures.",
  },
  {
    title: "Litecoin Core releases & MWEB",
    chain: "Litecoin",
    status: "Ongoing",
    url: "https://github.com/litecoin-project/litecoin/releases",
    summary:
      "Litecoin has no activated post-quantum output type. Track Core releases for any future PQ soft fork.",
  },
];

export const PQ_DISCLAIMER =
  "Experimental sandbox. Keys and signatures generated here are test artifacts and are never attached to Litecoin transactions. Litecoin mainnet transactions are not post-quantum protected today, and no wallet can make them so until a network upgrade activates.";
