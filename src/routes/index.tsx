import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: RootGate,
  head: () => ({
    meta: [
      { title: "LTCme.click — AI-powered Litecoin self-custody wallet" },
      {
        name: "description",
        content:
          "Non-custodial Litecoin wallet with a built-in AI companion. Send, receive, buy, and cash out LTC easily.",
      },
      { property: "og:title", content: "LTCme.click — AI-powered Litecoin self-custody wallet" },
      { property: "og:url", content: "https://ltcme.click/" },
      {
        property: "og:description",
        content:
          "Non-custodial Litecoin wallet with a built-in AI companion. Send, receive, buy and cash out LTC.",
      },
    ],
    links: [{ rel: "canonical", href: "https://ltcme.click/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "LTCme.click",
          url: "https://ltcme.click/",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Web",
          description:
            "Non-custodial Litecoin wallet with a built-in AI companion. Send, receive, buy, and cash out LTC.",
        }),
      },
    ],
  }),
});

function RootGate() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/wallets", replace: true });
    });
  }, [navigate]);
  return (
    <main className="min-h-screen px-6 py-16 max-w-3xl mx-auto text-foreground">
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
        LTCme.click — AI-powered Litecoin self-custody wallet
      </h1>
      <p className="mt-6 text-lg text-muted-foreground">
        LTCme.click is a non-custodial Litecoin wallet with a built-in AI
        companion. Import unlimited Litecoin wallets, send and receive LTC on
        mainnet, buy Litecoin with a card, cash out LTC to a debit card, and
        get expert Litecoin help — all in one place.
      </p>
      <h2 className="mt-10 text-2xl font-semibold">What you can do on LTCme.click</h2>
      <ul className="mt-4 space-y-2 text-muted-foreground list-disc pl-6">
        <li>Create or import Litecoin wallets from a BIP39 seed phrase or WIF key.</li>
        <li>Send and receive LTC on Litecoin mainnet with live fee estimates.</li>
        <li>Buy Litecoin with a debit or credit card via trusted on-ramps.</li>
        <li>Cash out Litecoin to a debit card through supported off-ramps.</li>
        <li>Ask the built-in AI companion anything about Litecoin, wallets, or transactions.</li>
      </ul>
      <p className="mt-10">
        <a
          href="/auth"
          className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Sign in to open your Litecoin wallet
        </a>
      </p>
    </main>
  );
}

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ltcg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.78 0.14 230)" />
          <stop offset="100%" stopColor="oklch(0.88 0.11 220)" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill="url(#ltcg)" />
      <path d="M15.2 11h4.4l-1.8 8.2 3.5-1 -0.7 3 -3.5 1 -0.9 4.1H26v3.4H12.6l1.6-7.4 -2.6 0.7 0.7-3 2.6-0.7L15.2 11z" fill="oklch(0.14 0.04 240)" />
    </svg>
  );
}
