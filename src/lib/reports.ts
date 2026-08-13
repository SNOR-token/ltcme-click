// Report helpers. All report generation runs in the browser from public
// chain data; nothing here touches wallet secrets.
export function toCsv(rows: (string | number)[][]): string {
  return rows
    .map((r) =>
      r
        .map((c) => {
          const s = String(c ?? "");
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\n");
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const LABEL_KEY = "ltcme.labels.v1";

export function loadLabels(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(LABEL_KEY) || "{}");
  } catch {
    return {};
  }
}

export function setLabel(key: string, value: string) {
  const l = loadLabels();
  if (value) l[key] = value;
  else delete l[key];
  localStorage.setItem(LABEL_KEY, JSON.stringify(l));
}

export const TAX_DISCLAIMER =
  "Historical value estimates and any gain/loss figures are estimates only, generated from public price data. They are not tax advice. Confirm all figures with a qualified accountant before filing.";
