// Watch-only vaults. Public addresses only — no keys, no spending authority.
import { useCallback, useEffect, useState } from "react";
import type { NetMode } from "./network-mode";

export const VAULT_CATEGORIES = [
  "Hardware wallet",
  "Cold storage",
  "Business",
  "Donation",
  "Family",
  "Other public address",
] as const;

export type VaultCategory = (typeof VAULT_CATEGORIES)[number];

export interface WatchEntry {
  id: string;
  address: string;
  label: string;
  category: VaultCategory;
  network: NetMode;
  note?: string;
  createdAt: number;
}

const KEY = "ltcme.watchonly.v1";

export function loadWatch(): WatchEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as WatchEntry[];
  } catch {
    return [];
  }
}

function save(list: WatchEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("ltcme:watch"));
}

export function addWatch(e: Omit<WatchEntry, "id" | "createdAt">) {
  const list = loadWatch();
  if (list.some((x) => x.address === e.address && x.network === e.network)) return;
  list.push({ ...e, id: crypto.randomUUID(), createdAt: Date.now() });
  save(list);
}

export function updateWatch(id: string, patch: Partial<WatchEntry>) {
  save(loadWatch().map((x) => (x.id === id ? { ...x, ...patch } : x)));
}

export function removeWatch(id: string) {
  save(loadWatch().filter((x) => x.id !== id));
}

export function useWatchList(network: NetMode) {
  const [list, setList] = useState<WatchEntry[]>([]);
  const refresh = useCallback(() => setList(loadWatch()), []);
  useEffect(() => {
    refresh();
    window.addEventListener("ltcme:watch", refresh);
    return () => window.removeEventListener("ltcme:watch", refresh);
  }, [refresh]);
  return { all: list, entries: list.filter((x) => x.network === network), refresh };
}
