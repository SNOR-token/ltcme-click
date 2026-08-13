// Litecoin mainnet blockchain data via the litecoinspace.org public REST API
// (mempool.space-compatible schema). No key required, community-run mainnet
// node — used for constant balance checks, UTXO fetches, and broadcasting.
// Docs: https://litecoinspace.org/docs/api/rest

import { apiBase } from "./network-mode";

const LS = () => apiBase();

export interface Utxo {
  txid: string;
  vout: number;
  value: number; // sats
  script?: string; // hex
  address: string;
}

export interface AddressInfo {
  address: string;
  balanceSats: number;
  txCount: number;
}

async function lsFetch<T = any>(path: string): Promise<T> {
  const res = await fetch(`${LS()}${path}`);
  if (!res.ok) throw new Error(`litecoinspace ${res.status}`);
  return (await res.json()) as T;
}

async function lsText(path: string): Promise<string> {
  const res = await fetch(`${LS()}${path}`);
  if (!res.ok) throw new Error(`litecoinspace ${res.status}`);
  return await res.text();
}

function balanceFromStats(d: any): number {
  const c = d?.chain_stats;
  const m = d?.mempool_stats;
  const confirmed = (c?.funded_txo_sum ?? 0) - (c?.spent_txo_sum ?? 0);
  const pending = (m?.funded_txo_sum ?? 0) - (m?.spent_txo_sum ?? 0);
  return confirmed + pending;
}

export async function getAddressInfo(address: string): Promise<AddressInfo> {
  const d = await lsFetch<any>(`/address/${address}`);
  return {
    address,
    balanceSats: balanceFromStats(d),
    txCount: (d?.chain_stats?.tx_count ?? 0) + (d?.mempool_stats?.tx_count ?? 0),
  };
}

export async function getBalances(addresses: string[]): Promise<Record<string, number>> {
  if (addresses.length === 0) return {};
  const out: Record<string, number> = {};
  await Promise.all(
    addresses.map(async (a) => {
      try {
        const d = await lsFetch<any>(`/address/${a}`);
        out[a] = balanceFromStats(d);
      } catch {
        out[a] = 0;
      }
    }),
  );
  return out;
}

export async function getUtxos(address: string): Promise<Utxo[]> {
  const rows = await lsFetch<any[]>(`/address/${address}/utxo`);
  return rows.map((r: any) => ({
    txid: r.txid,
    vout: r.vout,
    value: r.value,
    address,
  }));
}

export async function getRawTx(txid: string): Promise<string> {
  return await lsText(`/tx/${txid}/hex`);
}

export interface TxSummary {
  txid: string;
  time: number;
  balanceChangeSats: number;
  confirmations: number;
}

export async function getRecentTxs(address: string, limit = 15): Promise<TxSummary[]> {
  try {
    const rows = await lsFetch<any[]>(`/address/${address}/txs`);
    return rows.slice(0, limit).map((t) => ({
      txid: t.txid,
      time: t.status?.block_time ?? 0,
      balanceChangeSats: 0,
      confirmations: t.status?.confirmed ? 1 : 0,
    }));
  } catch {
    return [];
  }
}

export async function estimateFeeRate(): Promise<number> {
  try {
    const j = await lsFetch<any>(`/v1/fees/recommended`);
    const rate = j?.halfHourFee ?? j?.hourFee ?? j?.fastestFee;
    if (typeof rate === "number" && rate > 0) return Math.max(1, Math.ceil(rate));
  } catch {}
  return 10;
}

export async function broadcastTx(rawHex: string): Promise<string> {
  const res = await fetch(`${LS()}/tx`, {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: rawHex,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || `Broadcast failed (${res.status})`);
  return text.trim();
}

// LTC/USD spot price via CoinGecko public API. Used for the developer fee
// USD floor and for LTC-denominated subscription pricing.
export async function getLtcUsdPrice(): Promise<number> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd",
    );
    if (!res.ok) throw new Error(`price ${res.status}`);
    const j = (await res.json()) as { litecoin?: { usd?: number } };
    const p = j?.litecoin?.usd;
    if (typeof p === "number" && p > 0) return p;
  } catch {}
  return 0;
}