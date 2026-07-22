import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { PacmanBanner } from "@/components/Pacman";

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
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/wallets", replace: true });
    });
  }, [navigate]);

  async function signIn() {
    setErr(null);
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
      extraParams: { prompt: "select_account" },
    });
    setLoading(false);
    if (result.error) {
      setErr(String((result.error as any)?.message ?? result.error));
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/wallets" });
  }

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
            AI-powered Litecoin self-custody wallet
          </h1>
          <p className="mt-4 text-base text-muted-foreground">
            Non-custodial Litecoin wallet with a built-in AI companion. Import
            unlimited wallets, send and receive LTC, buy with a card, cash out
            to a debit card, and get expert Litecoin help — all in one place.
          </p>
          <h2 className="mt-8 text-lg font-semibold">What you can do</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground list-disc pl-6">
            <li>Create or import wallets from a BIP39 seed or WIF key.</li>
            <li>Send and receive LTC on mainnet with live fee estimates.</li>
            <li>Buy Litecoin with a debit or credit card.</li>
            <li>Cash out LTC to a debit card via supported off-ramps.</li>
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
            Litecoin's AI-powered self-custody wallet.
          </p>
          <button
            disabled={loading}
            onClick={signIn}
            className="mt-6 w-full rounded-full bg-white text-slate-900 px-6 py-3 font-medium hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-3 shadow-lg"
          >
            <GoogleGlyph />
            {loading ? "Opening Google…" : "Continue with Google"}
          </button>
          {err && <p className="mt-4 text-sm text-destructive">{err}</p>}
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

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.7 2.5 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.7 17.7 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.6c-.5 3-2.2 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.2-10.2 7.2-17.3z"/>
      <path fill="#FBBC05" d="M10.5 28.6c-1-2.9-1-6.1 0-9L2.6 13.3c-3.4 6.8-3.4 14.8 0 21.4l7.9-6.1z"/>
      <path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.3-5.5l-7.5-5.8c-2.1 1.4-4.8 2.3-7.8 2.3-6.3 0-11.6-4.2-13.5-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/>
    </svg>
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
