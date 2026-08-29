import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LogoMark } from "./index";
import { Wallet, Send, Download, Wrench, LogOut, Banknote, Users, ChevronDown, MoreHorizontal } from "lucide-react";
import { NetworkToggle } from "@/components/ProGate";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Wallet stays as the primary visible tab; everything else folds into "More".
  const moreTabs = [
    { to: "/send", label: "Send", icon: Send },
    { to: "/receive", label: "Receive", icon: Download },
    { to: "/buy", label: "Buy / Sell", icon: Banknote },
    { to: "/multisig", label: "Multisig", icon: Users },
    { to: "/tools", label: "Tools", icon: Wrench },
  ] as const;

  const walletActive = pathname.startsWith("/wallets");
  const moreActive = moreTabs.some((t) => pathname.startsWith(t.to));
  const activeMore = moreTabs.find((t) => pathname.startsWith(t.to));

  function signOut() {
    supabase.auth.signOut().then(() => navigate({ to: "/auth" }));
  }

  return (
    <header className="sticky top-0 z-20 hairline bg-background/80 backdrop-blur-xl">
      <div className="px-4 md:px-6 py-2.5 flex items-center gap-3">
        <Link to="/wallets" className="flex items-center gap-2 shrink-0">
          <LogoMark />
          <span className="font-semibold tracking-tight hidden sm:inline">LTCme<span className="text-primary">.click</span></span>
        </Link>
        <nav className="flex-1 flex items-center gap-1.5 min-w-0">
          <Link
            to="/wallets"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition whitespace-nowrap ${
              walletActive
                ? "bg-primary/15 text-primary neon-edge"
                : "text-muted-foreground hover:text-foreground hover:bg-card/60"
            }`}
          >
            <Wallet className="h-4 w-4" />
            Wallet
          </Link>

          {/* "More" dropdown: collapses the remaining tabs */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition whitespace-nowrap ${
                  moreActive
                    ? "bg-primary/15 text-primary neon-edge"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/60"
                }`}
              >
                {activeMore ? <activeMore.icon className="h-4 w-4" /> : <MoreHorizontal className="h-4 w-4" />}
                <span>{activeMore ? activeMore.label : "More"}</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Wallet tools</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {moreTabs.map(({ to, label, icon: Icon }) => {
                const active = pathname.startsWith(to);
                return (
                  <DropdownMenuItem key={to} asChild>
                    <Link
                      to={to}
                      className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm cursor-pointer ${
                        active ? "text-primary" : "text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <NetworkToggle />
        <button
          onClick={signOut}
          aria-label="Sign out"
          className="md:hidden inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
        <div className="hidden md:flex flex-col items-end leading-tight">
          <button
            onClick={signOut}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
          {email && <span className="text-[10px] text-muted-foreground/70 truncate max-w-[180px]">{email}</span>}
        </div>
      </div>
    </header>
  );
}
