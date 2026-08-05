import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EmailAuth } from "@/components/EmailAuth";
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
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/wallets" });
    });
  }, [navigate]);

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
          <EmailAuth onSignedIn={() => navigate({ to: "/wallets" })} />
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