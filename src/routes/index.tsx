import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EmailAuth } from "@/components/EmailAuth";
import { PacmanBanner } from "@/components/Pacman";
import { ProValueGrid } from "@/components/ProValue";
import { Wallet, Send, ShieldCheck, Bot, Banknote, Sprout } from "lucide-react";

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
      <PacmanBanner compact />
      <main className="flex-1 px-6 py-12 max-w-6xl w-full mx-auto">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <section className="text-foreground">
            <div className="flex items-center gap-3 mb-6">
              <LogoMark size={44} />
              <span className="text-xl font-semibold">LTCme<span className="text-primary">.click</span></span>
            </div>
            <span className="eyebrow">Self-custody · Litecoin only</span>
            <h1 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight leading-[1.05]">
              The Agentic Litecoin &amp;<br className="hidden md:block" /> Post-Quantum-Ready Wallet
            </h1>
            <p className="mt-3 text-lg font-medium gradient-text">Securing your financial future.</p>
            <p className="mt-5 text-base text-muted-foreground leading-relaxed">
              LTCme.click is a real Litecoin wallet you fully control. Keys are generated and stored
              in your browser — never on our servers. An always-on AI agent sits beside every screen
              to explain what you're doing, watch your addresses for exposure, and prepare
              transactions you approve and sign yourself.
            </p>
            <div className="mt-7 grid sm:grid-cols-2 gap-2.5">
              {[
                { icon: Wallet, t: "Unlimited wallets", d: "Create or import BIP39 seeds and WIF keys. BIP44, BIP49 and BIP84 addresses." },
                { icon: Send, t: "Send & receive", d: "Live mainnet balances, fee estimates and address validation." },
                { icon: Banknote, t: "Buy & cash out", d: "Card on-ramps and off-ramps to a debit card via vetted partners." },
                { icon: ShieldCheck, t: "Quantum Guard", d: "Plain-language wallet health: Protected, Needs Attention or Higher Exposure." },
                { icon: Sprout, t: "Earn", d: "Compare vetted third-party LTC yield. Litecoin has no native staking." },
                { icon: Bot, t: "Agentic AI", d: "Always-on Litecoin agent. It can never see keys or move funds." },
              ].map((f) => (
                <div key={f.t} className="rounded-xl card-glass p-3.5">
                  <div className="flex items-center gap-2">
                    <f.icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{f.t}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">{f.d}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="card-glass neon-edge rounded-3xl p-8 md:p-10 text-center">
            <div className="flex justify-center mb-5">
              <LogoMark size={56} />
            </div>
            <h2 className="text-2xl font-bold">
              <span className="gradient-text">Sign in</span>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Email code only. No password, no wallet connect, no tracking pixels.
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
        </div>

        <section className="mt-16">
          <span className="eyebrow">Free vs Quantum Guard Pro</span>
          <h2 className="mt-2 text-2xl font-bold">The wallet is free. Pro is the intelligence layer.</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            Creating wallets, sending, receiving, buying and checking your wallet status are free forever, and
            never expire. Quantum Guard Pro ($4.99/mo, $9.99/3mo, $19.99/yr) adds the agent and the monitoring
            around it. Every new account starts with a 3-day free trial of everything Pro does.
          </p>
          <div className="mt-5">
            <ProValueGrid />
          </div>
          <p className="mt-4 text-[11px] text-muted-foreground max-w-2xl">
            Post-quantum-ready means LTCme helps you reduce key-exposure today and experiment with post-quantum
            signatures in the PQ Lab. Litecoin mainnet transactions themselves are not post-quantum protected yet.
          </p>
        </section>
      </main>
      <PacmanBanner compact />
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
