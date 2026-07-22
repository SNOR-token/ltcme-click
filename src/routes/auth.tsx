import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { LogoMark } from "./index";
import { PacmanBanner } from "@/components/Pacman";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — LTCme.click AI-powered Litecoin wallet" },
      { name: "description", content: "Sign in to LTCme.click to manage your non-custodial Litecoin wallet and chat with the built-in AI companion." },
      { property: "og:title", content: "Sign in — LTCme.click AI-powered Litecoin wallet" },
      { property: "og:description", content: "Sign in to LTCme.click to manage your non-custodial Litecoin wallet and chat with the built-in AI companion." },
      { property: "og:url", content: "https://ltcme.click/auth" },
    ],
    links: [{ rel: "canonical", href: "https://ltcme.click/auth" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/wallets" });
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
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="card-glass rounded-3xl p-10 max-w-md w-full text-center">
          <div className="flex justify-center mb-6">
            <LogoMark size={56} />
          </div>
          <h1 className="text-3xl font-bold">
            <span className="gradient-text">LTCme.click — AI-powered Litecoin wallet</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Litecoin's AI-powered self-custody wallet.
          </p>
          <button
            disabled={loading}
            onClick={signIn}
            className="mt-8 w-full rounded-full bg-white text-slate-900 px-6 py-3 font-medium hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-3 shadow-lg"
          >
            <GoogleGlyph />
            {loading ? "Opening Google…" : "Continue with Google"}
          </button>
          {err && <p className="mt-4 text-sm text-destructive">{err}</p>}
          <p className="mt-6 text-xs text-muted-foreground">
            Your Litecoin keys are generated in your browser and stored locally on this device only. LTCme never sees them — back up your seed phrase yourself. Optionally protect your seed with a BIP39 passphrase (25th word).
          </p>
          <p className="mt-4 text-[11px] text-muted-foreground">
            By continuing you agree to our{" "}
            <Link to="/terms" className="text-primary hover:underline">Terms</Link> and{" "}
            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
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