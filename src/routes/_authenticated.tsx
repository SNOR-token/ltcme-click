import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LogoMark } from "./index";
import { Wallet, Send, Download, Wrench, Hammer, LogOut, Banknote, Shield, Eye, FileSpreadsheet, FlaskConical, Sprout, Users } from "lucide-react";
import { NetworkToggle, TrialBadge } from "@/components/ProGate";
import { useProAccess, TRIAL_DAYS, PRO_EXPIRED_MESSAGE } from "@/lib/pro";
import { PlansInline } from "@/components/PlansInline";
import { ProValueGrid } from "@/components/ProValue";
export const Route = createFileRoute("/_authenticated")({
  component: Shell,
});

/** Routes that require an active trial or subscription. */
const PRO_ROUTES = ["/tx-builder", "/multisig", "/vaults", "/reports", "/pq-lab", "/earn", "/ai"];

function Shell() {
  const navigate = useNavigate();
  const pro = useProAccess();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const gated = PRO_ROUTES.some((r) => pathname.startsWith(r));
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
      <TopNav email={email} pro={pro} />
      <main className="flex-1 min-w-0">
        {gated && !pro.loading && !pro.pro ? <ProRouteLock /> : <Outlet />}
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

function ProRouteLock() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-5">
      <span className="eyebrow">Quantum Guard Pro</span>
      <h1 className="text-2xl font-bold">This is a Pro feature</h1>
      <p className="text-sm text-muted-foreground">{PRO_EXPIRED_MESSAGE}</p>
      <ProValueGrid />
      <PlansInline />
      <p className="text-[11px] text-muted-foreground">
        Every account includes {TRIAL_DAYS} days of full access. Your wallet, sending, receiving and buying stay free forever.
      </p>
    </div>
  );
}

function TopNav({ email, pro }: { email: string | null; pro: ReturnType<typeof useProAccess> }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const tabs = [
    { to: "/wallets", label: "Wallet", icon: Wallet },
    { to: "/send", label: "Send", icon: Send },
    { to: "/receive", label: "Receive", icon: Download },
    { to: "/buy", label: "Buy / Sell", icon: Banknote },
    { to: "/guard", label: "Quantum Guard", icon: Shield },
    { to: "/earn", label: "Earn", icon: Sprout },
  ] as const;
  const secondary = [
    { to: "/tx-builder", label: "AI Tx Builder", icon: Hammer },
    { to: "/multisig", label: "Multisig", icon: Users },
    { to: "/vaults", label: "Vaults", icon: Eye },
    { to: "/reports", label: "Reports", icon: FileSpreadsheet },
    { to: "/tools", label: "Tools", icon: Wrench },
    { to: "/pq-lab", label: "PQ Lab", icon: FlaskConical },
  ] as const;
  return (
    <header className="sticky top-0 z-20 hairline bg-background/80 backdrop-blur-xl">
      <div className="px-4 md:px-6 py-2.5 flex items-center gap-3">
        <Link to="/wallets" className="flex items-center gap-2 shrink-0">
          <LogoMark />
          <span className="font-semibold tracking-tight hidden sm:inline">LTCme<span className="text-primary">.click</span></span>
        </Link>
        <nav className="flex-1 flex items-center gap-1 flex-wrap min-w-0">
          {tabs.map(({ to, label, icon: Icon }) => {
            const active = pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition whitespace-nowrap ${
                  active
                    ? "bg-primary/15 text-primary neon-edge"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/60"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <TrialBadge state={pro} />
        <NetworkToggle />
        <div className="hidden md:flex flex-col items-end leading-tight">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth" });
            }}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
          {email && <span className="text-[10px] text-muted-foreground/70 truncate max-w-[180px]">{email}</span>}
        </div>
      </div>
      <div className="px-4 md:px-6 pb-2 flex items-center gap-1 flex-wrap">
        <span className="eyebrow mr-1">Advanced</span>
        {secondary.map(({ to, label, icon: Icon }) => {
          const active = pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] transition ${
                active ? "text-primary bg-primary/10" : "text-muted-foreground/80 hover:text-foreground"
              }`}
            >
              <Icon className="h-3 w-3" />
              {label}
            </Link>
          );
        })}
        <div className="md:hidden ml-auto flex items-center gap-2">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth" });
            }}
            className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-3 w-3" /> Sign out
          </button>
        </div>
      </div>
    </header>
  );
}