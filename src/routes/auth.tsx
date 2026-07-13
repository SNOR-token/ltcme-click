import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { LogoMark } from "./index";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — LTCme.click" }] }),
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
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="card-glass rounded-3xl p-10 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <LogoMark size={48} />
        </div>
        <h1 className="text-2xl font-bold">Sign in to LTCme.click</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Free account. Required to unlock the wallet and the LTCme AI companion.
        </p>
        <button
          disabled={loading}
          onClick={signIn}
          className="mt-8 w-full rounded-full bg-primary text-primary-foreground px-6 py-3 font-medium btn-glow hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? "Opening Google…" : "Continue with Google"}
        </button>
        {err && <p className="mt-4 text-sm text-destructive">{err}</p>}
        <p className="mt-6 text-xs text-muted-foreground">
          Your Litecoin keys are generated in your browser and encrypted with a password you choose. LTCme never sees them.
        </p>
        <Link to="/" className="mt-6 inline-block text-xs text-muted-foreground hover:text-foreground">
          ← Back home
        </Link>
      </div>
    </div>
  );
}