import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LogoMark } from "./index";
import { Wallet, Send, Download, Wrench, Hammer, Sparkles, LogOut, CreditCard } from "lucide-react";
import { AiSidebar } from "@/components/AiSidebar";

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
    <div className="min-h-screen flex">
      <SideNav email={email} />
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
      <AiSidebar />
    </div>
  );
}

function SideNav({ email }: { email: string | null }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const links = [
    { to: "/wallets", label: "Wallets", icon: Wallet },
    { to: "/send", label: "Send", icon: Send },
    { to: "/receive", label: "Receive", icon: Download },
    { to: "/tx-builder", label: "TX Builder", icon: Hammer },
    { to: "/tools", label: "Tools", icon: Wrench },
    { to: "/ai", label: "LTCme AI", icon: Sparkles },
    { to: "/pricing", label: "Plans", icon: CreditCard },
  ] as const;
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border/60 bg-sidebar/60 backdrop-blur-md p-4 sticky top-0 h-screen">
      <Link to="/wallets" className="flex items-center gap-2 px-2 py-2 mb-6">
        <LogoMark />
        <span className="font-semibold tracking-tight">LTCme.click</span>
      </Link>
      <nav className="flex-1 space-y-1">
        {links.map(({ to, label, icon: Icon }) => {
          const active = pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition ${
                active
                  ? "bg-primary text-primary-foreground btn-glow"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border/60 pt-3 mt-3 text-xs text-muted-foreground">
        <div className="truncate mb-2">{email}</div>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/" });
          }}
          className="flex items-center gap-2 hover:text-foreground"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </div>
    </aside>
  );
}