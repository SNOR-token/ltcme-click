// Network mode (mainnet / testnet) — a single deterministic source of truth.
// Testnet unlocks every Pro feature for free so the product can be fully
// evaluated before subscribing. Mainnet Pro features require a subscription.
import { useSyncExternalStore } from "react";

export type NetMode = "mainnet" | "testnet";

const KEY = "ltcme.network.v1";
const listeners = new Set<() => void>();

function read(): NetMode {
  if (typeof window === "undefined") return "mainnet";
  return localStorage.getItem(KEY) === "testnet" ? "testnet" : "mainnet";
}

let current: NetMode = read();

export function getNetworkMode(): NetMode {
  return current;
}

export function setNetworkMode(m: NetMode) {
  current = m;
  if (typeof window !== "undefined") localStorage.setItem(KEY, m);
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useNetworkMode(): [NetMode, (m: NetMode) => void] {
  const mode = useSyncExternalStore(subscribe, getNetworkMode, () => "mainnet" as NetMode);
  return [mode, setNetworkMode];
}

export const API_BASES: Record<NetMode, string> = {
  mainnet: "https://litecoinspace.org/api",
  testnet: "https://litecoinspace.org/testnet/api",
};

export function apiBase(): string {
  return API_BASES[current];
}

export const TESTNET_NOTICE = "LITECOIN TESTNET — These coins have no monetary value.";

// Litecoin testnet4 chain parameters (bitcoinjs-lib shape).
export const litecoinTestnet = {
  messagePrefix: "\x19Litecoin Signed Message:\n",
  bech32: "tltc",
  bip32: { public: 0x043587cf, private: 0x04358394 },
  pubKeyHash: 0x6f,
  scriptHash: 0x3a,
  wif: 0xef,
};
