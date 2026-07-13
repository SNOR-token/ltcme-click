import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: RootGate,
});

function RootGate() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      navigate({ to: data.session ? "/wallets" : "/auth", replace: true });
    });
  }, [navigate]);
  return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground">
      Loading LTCme.click…
    </div>
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
