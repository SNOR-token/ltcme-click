import { describe, it, expect } from "vitest";
import {
  policyFingerprint,
  validatePolicyShape,
  formatFingerprint,
  buildPolicy,
} from "../multisig-policy";
import type { MultisigWallet } from "../multisig";

function wallet(partial: Partial<MultisigWallet> & Pick<MultisigWallet, "m" | "cosigners">): MultisigWallet {
  return {
    id: "ms_test",
    name: "test",
    script: "p2wsh",
    network: "mainnet",
    createdAt: 0,
    ...partial,
  };
}

const KEY_A =
  "xpub6BosfCnifzxcFwrSzQiqu2DBVBYAdbDyxcUU9iU3X6hxZxqdPXwJ8V2nP3XqJqZ8exampleKEYA00000000000000000000000000";
// Use real-looking compressed pubkeys for unit tests of shape/fingerprint
const PUB1 = "02" + "11".repeat(32);
const PUB2 = "03" + "22".repeat(32);
const PUB3 = "02" + "33".repeat(32);

describe("validatePolicyShape", () => {
  it("rejects fewer than 2 cosigners", () => {
    expect(() =>
      validatePolicyShape({ m: 1, script: "p2wsh", cosigners: [{ id: "1", label: "A", key: PUB1 }] }),
    ).toThrow(/at least 2/);
  });

  it("rejects m > n", () => {
    expect(() =>
      validatePolicyShape({
        m: 3,
        script: "p2wsh",
        cosigners: [
          { id: "1", label: "A", key: PUB1 },
          { id: "2", label: "B", key: PUB2 },
        ],
      }),
    ).toThrow(/Invalid M-of-N/);
  });

  it("rejects duplicate keys", () => {
    expect(() =>
      validatePolicyShape({
        m: 2,
        script: "p2wsh",
        cosigners: [
          { id: "1", label: "A", key: PUB1 },
          { id: "2", label: "B", key: PUB1 },
        ],
      }),
    ).toThrow(/Duplicate/);
  });

  it("accepts valid 2-of-3", () => {
    expect(() =>
      validatePolicyShape({
        m: 2,
        script: "p2wsh",
        cosigners: [
          { id: "1", label: "A", key: PUB1 },
          { id: "2", label: "B", key: PUB2 },
          { id: "3", label: "C", key: PUB3 },
        ],
      }),
    ).not.toThrow();
  });
});

describe("policyFingerprint", () => {
  const base = wallet({
    m: 2,
    cosigners: [
      { id: "1", label: "A", key: PUB1 },
      { id: "2", label: "B", key: PUB2 },
      { id: "3", label: "C", key: PUB3 },
    ],
  });

  it("is stable for same policy", () => {
    const a = policyFingerprint(base);
    const b = policyFingerprint(base);
    expect(a).toBe(b);
    expect(a).toHaveLength(16);
  });

  it("is order-independent for cosigner list", () => {
    const reordered = wallet({
      m: 2,
      cosigners: [
        { id: "3", label: "C", key: PUB3 },
        { id: "1", label: "A", key: PUB1 },
        { id: "2", label: "B", key: PUB2 },
      ],
    });
    expect(policyFingerprint(reordered)).toBe(policyFingerprint(base));
  });

  it("changes when m changes", () => {
    const other = wallet({ ...base, m: 3 });
    expect(policyFingerprint(other)).not.toBe(policyFingerprint(base));
  });

  it("formatFingerprint produces groups", () => {
    const fp = policyFingerprint(base);
    expect(formatFingerprint(fp)).toMatch(/^[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}$/);
  });

  it("buildPolicy returns descriptor and fingerprint", () => {
    const p = buildPolicy(base);
    expect(p.n).toBe(3);
    expect(p.m).toBe(2);
    expect(p.descriptor).toContain("sortedmulti");
    expect(p.fingerprint).toHaveLength(16);
  });
});
