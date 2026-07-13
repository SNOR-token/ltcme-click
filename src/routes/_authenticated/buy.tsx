import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, ExternalLink, Info } from "lucide-react";
import { loadStore } from "@/lib/ltc/storage";

export const Route = createFileRoute("/_authenticated/buy")({
  head: () => ({
    meta: [
      { title: "Buy & Sell Litecoin — LTCme.click" },
      { name: "description", content: "Buy Litecoin with card or bank, and cash out LTC to a debit card, through vetted third-party on/off-ramps." },
    ],
  }),
  component: BuyPage,
});

type Mode = "buy" | "sell";

function BuyPage() {
  const [mode, setMode] = useState<Mode>("buy");
  const wallets = useMemo(() => loadStore().wallets, []);
  const defaultAddress = wallets[0]?.addresses[0]?.address ?? "";

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Buy & Sell Litecoin</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Litecoin-only on- and off-ramps via trusted third-party providers.
        LTCme.click never touches your fiat or your LTC on these routes — you
        transact directly with the provider.
      </p>

      <div className="inline-flex rounded-full border border-border bg-card/40 p-1 mb-6">
        <TabBtn active={mode === "buy"} onClick={() => setMode("buy")} icon={<ArrowDownToLine className="h-4 w-4" />} label="Buy LTC" />
        <TabBtn active={mode === "sell"} onClick={() => setMode("sell")} icon={<ArrowUpFromLine className="h-4 w-4" />} label="Cash out to card" />
      </div>

      {mode === "buy" ? <BuyPanel receiveAddress={defaultAddress} /> : <SellPanel />}

      <div className="mt-8 rounded-2xl border border-border bg-card/40 p-4 text-xs text-muted-foreground flex gap-2">
        <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
        <div>
          <p className="mb-1"><span className="text-foreground font-medium">Disclosure.</span> These providers are independent third parties. Their fees, exchange rates, KYC requirements, and payout times are set by them, not LTCme.click. LTCme.click may receive an affiliate share on some links; using them does not change your price. Always confirm the destination address is one of your own before paying.</p>
        </div>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
        active ? "bg-primary text-primary-foreground btn-glow" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function BuyPanel({ receiveAddress }: { receiveAddress: string }) {
  // Changelly Buy widget supports LTC-only lock via query params and requires
  // no partner key for basic embedding.
  const changellySrc = `https://widget.changelly.com?from=usd,eur,gbp&to=ltc&amount=200&fromDefault=usd&toDefault=ltc&merchant_id=changelly&payment_id=&v=3&type=no-rev-share&color=59a6ff&headerId=1&logo=hide&buyButtonTextId=2${receiveAddress ? `&address=${encodeURIComponent(receiveAddress)}` : ""}`;

  const providers: Provider[] = [
    {
      name: "MoonPay",
      href: `https://buy.moonpay.com?defaultCurrencyCode=ltc${receiveAddress ? `&walletAddress=${encodeURIComponent(receiveAddress)}` : ""}`,
      blurb: "Card, Apple Pay, Google Pay, or bank transfer. Widely available worldwide.",
    },
    {
      name: "Transak",
      href: `https://global.transak.com/?cryptoCurrencyList=LTC&defaultCryptoCurrency=LTC${receiveAddress ? `&walletAddress=${encodeURIComponent(receiveAddress)}` : ""}`,
      blurb: "Debit/credit card, bank transfer, or local rails in 160+ countries.",
    },
    {
      name: "Guardarian",
      href: `https://guardarian.com/calculator/v1?type=narrow&default_fiat_currency=USD&default_crypto_currency=LTC${receiveAddress ? `&payout_address=${encodeURIComponent(receiveAddress)}` : ""}`,
      blurb: "Non-custodial fiat-to-LTC swap. Card, SEPA, or bank wire.",
    },
    {
      name: "Simplex (via Changelly)",
      href: "https://www.changelly.com/buy-ltc",
      blurb: "Instant card purchases of LTC via Simplex's payment rails.",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="card-glass rounded-3xl p-4 md:p-6">
        <div className="text-xs text-muted-foreground mb-3">
          Buy directly in the embedded Changelly widget below. Your wallet address is pre-filled when possible.
        </div>
        <div className="rounded-2xl overflow-hidden bg-black/30 border border-border">
          <iframe
            title="Changelly Buy Litecoin"
            src={changellySrc}
            className="w-full"
            style={{ height: 560, border: 0 }}
            allow="clipboard-write; payment"
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Other Litecoin on-ramps</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {providers.map((p) => <ProviderCard key={p.name} {...p} />)}
        </div>
      </div>
    </div>
  );
}

function SellPanel() {
  const providers: Provider[] = [
    {
      name: "MoonPay Sell",
      href: "https://sell.moonpay.com?defaultBaseCurrencyCode=ltc",
      blurb: "Sell LTC and cash out to a debit card, Apple Pay, or bank account. Widest debit-card support.",
      highlight: "Best for debit card payout",
    },
    {
      name: "Guardarian Sell",
      href: "https://guardarian.com/calculator/v1?type=narrow&default_fiat_currency=USD&default_crypto_currency=LTC&direction=sell",
      blurb: "Sell LTC for USD, EUR, or GBP paid out to a bank card or SEPA.",
    },
    {
      name: "Changelly Sell",
      href: "https://sell.changelly.com/?from=ltc&to=usd",
      blurb: "Sell LTC to fiat and receive to card. Rates aggregated from multiple providers.",
    },
    {
      name: "Kraken (bank + card)",
      href: "https://www.kraken.com/prices/litecoin",
      blurb: "Regulated exchange. Deposit LTC, sell, and withdraw to a linked bank or Visa debit card.",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="card-glass rounded-3xl p-4 md:p-6 text-sm">
        <div className="font-medium mb-1">Cash out LTC to a debit card</div>
        <p className="text-muted-foreground text-xs">
          Send your LTC from LTCme.click to the deposit address the provider gives you, then withdraw the fiat balance to your debit card. Payout speed and card support depend on the provider and your country.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {providers.map((p) => <ProviderCard key={p.name} {...p} />)}
      </div>
    </div>
  );
}

interface Provider {
  name: string;
  href: string;
  blurb: string;
  highlight?: string;
}

function ProviderCard({ name, href, blurb, highlight }: Provider) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="card-glass rounded-2xl p-4 group hover:border-primary transition block"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold flex items-center gap-2">
            {name}
            {highlight && (
              <span className="text-[10px] uppercase tracking-wider rounded-full bg-primary/15 text-primary px-2 py-0.5">
                {highlight}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{blurb}</p>
        </div>
        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
      </div>
    </a>
  );
}