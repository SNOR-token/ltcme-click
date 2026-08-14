// Litecoin mainnet is the only supported network. Testnet was removed so a
// wallet can never silently report empty balances or a false "Protected"
// status against real mainnet funds.
export type NetMode = "mainnet";

export const NETWORK: NetMode = "mainnet";

export function getNetworkMode(): NetMode {
  return NETWORK;
}

/** Kept as a hook for call sites; always mainnet, never switchable. */
export function useNetworkMode(): [NetMode, (m: NetMode) => void] {
  return [NETWORK, () => {}];
}

export const API_BASES: Record<NetMode, string> = {
  mainnet: "https://litecoinspace.org/api",
};

export function apiBase(): string {
  return API_BASES.mainnet;
}
