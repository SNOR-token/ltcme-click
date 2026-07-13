import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LogoMark } from "./index";
import { BigGhost } from "@/components/Pacman";
import { Wallet, Send, Download, Wrench, Hammer, LogOut, CreditCard, Banknote } from "lucide-react";
export const Route = createFileRoute("/_authenticated")({
  component: Shell,
});

function Shell() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (!data.session) {
        navigate({ to: "/auth" });
        return;
      }
      setEmail(data.session.user.email ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/auth" });
      else setEmail(session.user.email ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  if (!ready) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Unlocking…</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav email={email} />
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
      <LegalFooter />
    </div>
  );
}

function LegalFooter() {
  return (
    <footer className="border-t border-border/60 bg-background/60 px-6 py-6 text-xs text-muted-foreground">
      <div className="max-w-5xl mx-auto space-y-3">
        <p>
          <strong className="text-foreground">Disclaimer:</strong> LTCme.click is a non-custodial software tool provided "as is" without warranties of any kind. You alone control your seed phrase, private keys, and funds. LTCme.click accepts no liability for any loss, theft, damage, tax consequence, missed transaction, network failure, third-party service outage, user error, or any direct, indirect, incidental, consequential, or punitive damages arising from use of this site, the wallet, the AI assistant, or any linked service. Nothing here is financial, legal, tax, or investment advice. Litecoin transactions are irreversible. Use at your own risk. See our{" "}
          <Link to="/terms" className="text-primary hover:underline">Terms</Link> and{" "}
          <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
        </p>
        <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-border/40">
          <div>© 2026 LTCme.click. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <Link to="/support" className="hover:text-foreground">Support</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function TopNav({ email }: { email: string | null }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const tabs = [
    { to: "/wallets", label: "Wallet", icon: Wallet },
    { to: "/send", label: "Send", icon: Send },
    { to: "/receive", label: "Receive", icon: Download },
    { to: "/buy", label: "Buy / Sell", icon: Banknote },
    { to: "/tx-builder", label: "TX Builder", icon: Hammer },
    { to: "/tools", label: "Tools", icon: Wrench },
    { to: "/pricing", label: "Plans", icon: CreditCard },
  ] as const;
  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/70 backdrop-blur-md">
      <div className="flex items-center gap-4 px-4 md:px-6 h-14">
        <Link to="/wallets" className="flex items-center gap-2 shrink-0">
          <LogoMark />
          <span className="font-semibold tracking-tight hidden sm:inline">LTCme.click</span>
        </Link>
        <nav className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {tabs.map(({ to, label, icon: Icon }) => {
            const active = pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition whitespace-nowrap ${
                  active
                    ? "bg-primary text-primary-foreground btn-glow"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/60"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground shrink-0">
          <span className="max-w-[160px] truncate">{email}</span>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth" });
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 hover:text-foreground hover:bg-card/60"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </div>
    </header>
  );
}