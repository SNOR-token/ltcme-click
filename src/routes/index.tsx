import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EmailAuth } from "@/components/EmailAuth";
import { PacmanBanner } from "@/components/Pacman";

export const Route = createFileRoute("/")({
  component: RootGate,
  head: () => ({
    meta: [
      { title: "LTCme.click — Agentic Litecoin & Post-Quantum-Ready Wallet" },
      {
        name: "description",
        content:
          "Securing your financial future. A friendly self-custody Litecoin wallet with an AI security partner, Quantum Guard and Earn tools.",
      },
      { property: "og:title", content: "LTCme.click — Agentic Litecoin & Post-Quantum-Ready Wallet" },
      { property: "og:url", content: "https://ltcme.click/" },
      {
        property: "og:description",
        content:
          "Securing your financial future. Self-custody Litecoin wallet with an AI security partner, Quantum Guard and Earn tools.",
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
            "Securing your financial future. Self-custody Litecoin wallet with an AI security partner, Quantum Guard and Earn tools.",
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
    <div className="min-h-screen flex flex-col">
      <PacmanBanner />
      <main className="flex-1 px-6 py-10 max-w-5xl w-full mx-auto grid gap-10 md:grid-cols-2 md:items-center">
        <section className="text-foreground">
          <div className="flex items-center gap-3 mb-6">
            <LogoMark size={44} />
            <span className="text-xl font-semibold gradient-text">LTCme.click</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            The Agentic Litecoin &amp; Post-Quantum-Ready Wallet
          </h1>
          <p className="mt-2 text-lg font-medium gradient-text">Securing your financial future.</p>
          <p className="mt-4 text-base text-muted-foreground">
            A simple, friendly Litecoin wallet that helps everyday LTC holders keep
            their funds safe as technology changes. Import unlimited wallets, send and
            receive LTC, buy or cash out with a card, and let an AI security partner
            watch your wallet — without ever touching your keys.
          </p>
          <h2 className="mt-8 text-lg font-semibold">What you can do</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground list-disc pl-6">
            <li>Create or import wallets from a BIP39 seed or WIF key.</li>
            <li>Send and receive LTC on mainnet with live fee estimates.</li>
            <li>Buy Litecoin with a debit or credit card.</li>
            <li>Cash out LTC to a debit card via supported off-ramps.</li>
            <li>Check wallet health with Quantum Guard, and explore Earn options.</li>
            <li>Ask the built-in AI companion anything about Litecoin.</li>
          </ul>
        </section>

        <section className="card-glass rounded-3xl p-8 md:p-10 text-center">
          <div className="flex justify-center mb-5">
            <LogoMark size={56} />
          </div>
          <h2 className="text-2xl font-bold">
            <span className="gradient-text">Sign in</span>
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The Agentic Litecoin &amp; Post-Quantum-Ready Wallet.
          </p>
          <EmailAuth onSignedIn={() => navigate({ to: "/wallets" })} />
          <p className="mt-5 text-xs text-muted-foreground">
            Your Litecoin keys are generated in your browser and stored locally on this device only. LTCme never sees them — back up your seed phrase yourself. Optionally protect your seed with a BIP39 passphrase (25th word).
          </p>
          <p className="mt-3 text-[11px] text-muted-foreground">
            By continuing you agree to our{" "}
            <Link to="/terms" className="text-primary hover:underline">Terms</Link> and{" "}
            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
          </p>
        </section>
      </main>
      <PacmanBanner />
      <footer className="px-6 py-4 text-[11px] text-muted-foreground flex items-center justify-between flex-wrap gap-2 border-t border-border/40">
        <span>© 2026 LTCme.click</span>
        <span className="flex items-center gap-4">
          <Link to="/support" className="hover:text-foreground">Support</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-foreground">Terms of Service</Link>
        </span>
      </footer>
    </div>
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
