// Litecoin mainnet blockchain data via public APIs.
// Primary: Blockchair (no key needed, generous free tier).
// Docs: https://blockchair.com/api/docs

const BC = "https://api.blockchair.com/litecoin";

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

async function bcFetch<T = any>(path: string): Promise<T> {
  const res = await fetch(`${BC}${path}`);
  if (!res.ok) throw new Error(`Blockchair ${res.status}`);
  const j = await res.json();
  if (j.context?.error) throw new Error(j.context.error);
  return j;
}

export async function getAddressInfo(address: string): Promise<AddressInfo> {
  const j = await bcFetch<any>(`/dashboards/address/${address}?limit=1`);
  const d = j.data?.[address]?.address;
  return {
    address,
    balanceSats: d?.balance ?? 0,
    txCount: d?.transaction_count ?? 0,
  };
}

export async function getBalances(addresses: string[]): Promise<Record<string, number>> {
  if (addresses.length === 0) return {};
  const j = await bcFetch<any>(`/dashboards/addresses/${addresses.join(",")}`);
  const out: Record<string, number> = {};
  const set = j.data?.addresses ?? {};
  addresses.forEach((a) => {
    out[a] = set[a]?.balance ?? 0;
  });
  return out;
}

export async function getUtxos(address: string): Promise<Utxo[]> {
  const j = await bcFetch<any>(`/outputs?q=recipient(${address}),is_spent(false)&limit=100`);
  const rows = j.data ?? [];
  return rows.map((r: any) => ({
    txid: r.transaction_hash,
    vout: r.index,
    value: r.value,
    script: r.script_hex,
    address,
  }));
}

export async function getRawTx(txid: string): Promise<string> {
  const j = await bcFetch<any>(`/raw/transaction/${txid}`);
  const d = j.data?.[txid];
  return d?.raw_transaction ?? "";
}

export interface TxSummary {
  txid: string;
  time: number;
  balanceChangeSats: number;
  confirmations: number;
}

export async function getRecentTxs(address: string, limit = 15): Promise<TxSummary[]> {
  const j = await bcFetch<any>(`/dashboards/address/${address}?limit=${limit}`);
  const d = j.data?.[address];
  const txs: string[] = d?.transactions ?? [];
  return txs.map((txid) => ({
    txid,
    time: 0,
    balanceChangeSats: 0,
    confirmations: 0,
  }));
}

export async function estimateFeeRate(): Promise<number> {
  // sats/vbyte
  try {
    const j = await bcFetch<any>(`/stats`);
    const rate = j.data?.suggested_transaction_fee_per_byte_sat;
    if (typeof rate === "number" && rate > 0) return Math.max(1, Math.ceil(rate));
  } catch {}
  return 10;
}

export async function broadcastTx(rawHex: string): Promise<string> {
  const res = await fetch(`${BC}/push/transaction`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ data: rawHex }),
  });
  const j = await res.json();
  if (!res.ok || j.context?.error) {
    throw new Error(j.context?.error || `Broadcast failed (${res.status})`);
  }
  return j.data?.transaction_hash ?? "";
}