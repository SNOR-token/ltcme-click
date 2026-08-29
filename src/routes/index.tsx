import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EmailAuth } from "@/components/EmailAuth";
import { Wallet, Send, ShieldCheck, Bot, Banknote, Smartphone, Download } from "lucide-react";

export const Route = createFileRoute("/")({
  component: RootGate,
  head: () => ({
    meta: [
      { title: "LTCme.click — Agentic Litecoin Wallet with a built-in AI" },
      {
        name: "description",
        content:
          "A friendly self-custody Litecoin wallet with an always-on AI companion, live mainnet balances, buy/sell and wallet tools.",
      },
      { property: "og:title", content: "LTCme.click — Agentic Litecoin Wallet with a built-in AI" },
      { property: "og:url", content: "https://ltcme.click/" },
      {
        property: "og:description",
        content:
          "Self-custody Litecoin wallet with an always-on AI companion, live mainnet balances, buy/sell and wallet tools.",
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
            "Self-custody Litecoin wallet with an always-on AI companion, live mainnet balances, buy/sell and wallet tools.",
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
      <main className="flex-1 px-6 py-12 max-w-6xl w-full mx-auto">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <section className="text-foreground">
            <div className="flex items-center gap-3 mb-6">
              <LogoMark size={44} />
              <span className="text-xl font-semibold">LTCme<span className="text-primary">.click</span></span>
            </div>
            <span className="eyebrow">Self-custody · Litecoin only</span>
            <h1 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight leading-[1.05]">
              The Agentic<br className="hidden md:block" /> Litecoin Wallet
            </h1>
            <p className="mt-3 text-lg font-medium gradient-text">Your Litecoin, your keys, with an AI beside you.</p>
            <p className="mt-5 text-base text-muted-foreground leading-relaxed">
              LTCme.click is a real Litecoin wallet you fully control. Keys are generated on your device
              and stored encrypted in this browser — never on our servers. An AI security copilot can
              explain transactions and readiness options, but it never receives seed phrases or private keys.
              You approve and sign every spend yourself.
            </p>
            <div className="mt-7 grid sm:grid-cols-2 gap-2.5">
              {[
                { icon: Wallet, t: "Unlimited wallets", d: "Create or import BIP39 seeds and WIF keys. BIP44, BIP49 and BIP84 addresses." },
                { icon: Send, t: "Send & receive", d: "Live mainnet balances, fee estimates and address validation." },
                { icon: Banknote, t: "Buy & cash out", d: "Card on-ramps and off-ramps to a debit card via vetted partners." },
                { icon: ShieldCheck, t: "Self-custody", d: "Keys are generated and stored in your browser. We never see them." },
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
              Your Litecoin keys are generated on this device and encrypted at rest with a vault password you choose. LTCme never sees them — back up your seed phrase yourself. Optionally also use a BIP39 passphrase (25th word).
            </p>
            <p className="mt-3 text-[11px] text-muted-foreground">
              By continuing you agree to our{" "}
              <Link to="/terms" className="text-primary hover:underline">Terms</Link> and{" "}
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
          </section>
        </div>

        <section className="mt-16">
          <span className="eyebrow">Free vs Heightened Security</span>
          <h2 className="mt-2 text-2xl font-bold">Core self-custody is free. Heightened Security is $5.99/mo.</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            Creating wallets, sending, receiving, recovery, and ordinary tools stay free forever.
            Heightened Security ($5.99/month or yearly) unlocks advanced multisig workflows, unlimited AI
            security assistance, security health checks, and quantum-readiness education. Payable by card or Litecoin.
            If a subscription ends, you keep full control of your funds.
          </p>
        </section>

        <section className="mt-12 card-glass rounded-3xl p-6 md:p-8">
          <div className="flex items-start gap-3">
            <Smartphone className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="eyebrow">Official Android APK</span>
              <h2 className="mt-1 text-xl font-bold">Download LTCme for Android</h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
                Official sideload build while Google Play review is pending. Download only from this site.
                Verify the SHA-256 checksum before installing. Do not install APKs from third parties.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <a
                  href="/downloads/LTCme.apk"
                  className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium btn-glow"
                  download
                >
                  <Download className="h-4 w-4" />
                  Download LTCme.apk
                </a>
                <div className="text-[11px] text-muted-foreground font-mono break-all">
                  SHA-256: 41377cc139ccf1e6d35789c1c6c60e72c99887099ac397e9d6b2e756c53c7160
                </div>
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Google Play: not yet published. After download, enable “Install unknown apps” for your browser,
                then open the APK. The app loads the official LTCme.click experience.
              </p>
            </div>
          </div>
        </section>
      </main>
      <footer className="px-6 py-4 text-[11px] text-muted-foreground flex items-center justify-between flex-wrap gap-2 border-t border-border/40">
        <span>© 2026 LTCme.click</span>
        <span className="flex items-center gap-4">
          <a href="/downloads/LTCme.apk" className="hover:text-foreground" download>Android APK</a>
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
