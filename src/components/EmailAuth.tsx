import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function EmailAuth({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function signInWithGoogle() {
    setErr(null);
    setNote(null);
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth`,
      },
    });
    if (error) {
      setGoogleLoading(false);
      setErr(error.message);
    }
  }

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setErr(null);
    setNote(null);
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setErr("Enter a valid email address.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: clean,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setStage("code");
    setNote(`We sent a 6-digit confirmation code to ${clean}.`);
  }

  async function verify(e?: React.FormEvent) {
    e?.preventDefault();
    setErr(null);
    const token = code.trim();
    if (token.length < 6) {
      setErr("Enter the 6-digit code from your email.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token,
      type: "email",
    });
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    onSignedIn();
  }

  return (
    <div className="mt-6 text-left">
      {stage === "email" ? (
        <>
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={loading || googleLoading}
            className="w-full rounded-full bg-white text-slate-900 border border-slate-300 px-6 py-3 font-medium hover:bg-slate-100 transition disabled:opacity-50 flex items-center justify-center gap-3"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
            >
              <path
                fill="#4285F4"
                d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z"
              />
              <path
                fill="#34A853"
                d="M12 22c2.7 0 4.98-.9 6.63-2.36l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"
              />
              <path
                fill="#FBBC05"
                d="M6.39 13.93A6.02 6.02 0 0 1 6.07 12c0-.67.12-1.32.32-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.55l3.35-2.62Z"
              />
              <path
                fill="#EA4335"
                d="M12 5.94c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z"
              />
            </svg>
            {googleLoading ? "Opening Google…" : "Continue with Google"}
          </button>

          <div className="my-4 flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={sendCode} className="space-y-3">
            <label className="block text-xs text-muted-foreground" htmlFor="auth-email">
              Email address
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl bg-background/60 border border-border px-4 py-3 text-sm outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full rounded-full bg-primary text-primary-foreground px-6 py-3 font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Sending code…" : "Continue with email"}
            </button>
          </form>
        </>
      ) : (
        <form onSubmit={verify} className="space-y-3">
          <label className="block text-xs text-muted-foreground" htmlFor="auth-code">
            Confirmation code
          </label>
          <input
            id="auth-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(ev) => setCode(ev.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            className="w-full rounded-xl bg-background/60 border border-border px-4 py-3 text-center text-lg tracking-[0.4em] outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary text-primary-foreground px-6 py-3 font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Verifying…" : "Confirm & sign in"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStage("email");
              setCode("");
              setNote(null);
              setErr(null);
            }}
            className="w-full text-xs text-muted-foreground hover:text-foreground"
          >
            Use a different email
          </button>
        </form>
      )}
      {note && <p className="mt-3 text-xs text-muted-foreground">{note}</p>}
      {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
    </div>
  );
}
