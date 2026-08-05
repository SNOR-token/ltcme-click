import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function EmailAuth({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

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
            disabled={loading}
            className="w-full rounded-full bg-primary text-primary-foreground px-6 py-3 font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Sending code…" : "Continue with email"}
          </button>
        </form>
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