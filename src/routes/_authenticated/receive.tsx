import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check } from "lucide-react";
import { loadStore } from "@/lib/ltc/storage";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/receive")({
  head: () => ({ meta: [{ title: "Receive LTC — LTCme.click" }] }),
  validateSearch: (s) => z.object({ walletId: z.string().optional() }).parse(s),
  component: ReceivePage,
});

function ReceivePage() {
  const { walletId } = Route.useSearch();
  const [selected, setSelected] = useState<string | undefined>(walletId);
  const [wallets, setWallets] = useState(loadStore().wallets);
  const [selectedAddr, setSelectedAddr] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => setWallets(loadStore().wallets), []);
  const wallet = useMemo(() => wallets.find((w) => w.meta.id === selected) ?? wallets[0], [wallets, selected]);

  useEffect(() => {
    if (wallet) setSelectedAddr(wallet.addresses[0]?.address ?? "");
  }, [wallet]);

  if (!wallet) {
    return <div className="p-10 text-muted-foreground">No wallets yet. Create one first.</div>;
  }

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-neon-gradient">Receive Litecoin</h1>
      <p className="text-muted-foreground text-sm mb-6">Share this address to receive LTC. It's derived from your wallet's seed.</p>

      <div className="card-glass rounded-3xl p-6">
        <label className="text-xs text-muted-foreground">Wallet</label>
        <select
          value={wallet.meta.id}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full mt-1 rounded-xl bg-input border border-border px-3 py-2 text-sm mb-4"
        >
          {wallets.map((w) => (
            <option key={w.meta.id} value={w.meta.id}>{w.meta.name}</option>
          ))}
        </select>

        <label className="text-xs text-muted-foreground">Address</label>
        <select
          value={selectedAddr}
          onChange={(e) => setSelectedAddr(e.target.value)}
          className="w-full mt-1 rounded-xl bg-input border border-border px-3 py-2 text-sm mb-4 font-mono"
        >
          {wallet.addresses.map((a) => (
            <option key={a.address} value={a.address}>{a.address}</option>
          ))}
        </select>

        <div className="flex flex-col items-center gap-4">
          {selectedAddr && (
            <div className="bg-white p-4 rounded-2xl">
              <QRCodeSVG value={`litecoin:${selectedAddr}`} size={220} />
            </div>
          )}
          <div className="w-full bg-muted/50 rounded-xl px-4 py-3 text-xs font-mono break-all text-center">
            {selectedAddr}
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(selectedAddr);
              setCopied(true);
              toast.success("Address copied");
              setTimeout(() => setCopied(false), 2000);
            }}
            className="rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm btn-glow inline-flex items-center gap-2"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy address"}
          </button>
        </div>
      </div>
    </div>
  );
}