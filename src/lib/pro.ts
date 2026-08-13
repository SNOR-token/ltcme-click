// Deterministic Pro entitlement gate.
//
// Rules (enforced in code, never by AI prompt):
//  - Testnet: every Pro feature is unlocked, free, forever (full product demo).
//  - Mainnet: Pro features require an active subscription.
//  - Expiring a subscription never disables the basic wallet.
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getAiEntitlement } from "@/lib/ai.functions";
import { useNetworkMode } from "@/lib/ltc/network-mode";

export interface ProState {
  loading: boolean;
  isTestnet: boolean;
  hasActiveSub: boolean;
  everSubscribed: boolean;
  expired: boolean;
  /** True when Pro features may be used right now. */
  pro: boolean;
  freeUsed: number;
  freeLimit: number;
}

export const PRO_EXPIRED_MESSAGE =
  "Quantum Guard Pro has ended. Your free Litecoin wallet remains fully operational. Renew to restore continuous monitoring, advanced AI analysis, alerts and protection planning.";

export function useProAccess(): ProState {
  const [mode] = useNetworkMode();
  const isTestnet = mode === "testnet";
  const fetchEnt = useServerFn(getAiEntitlement);
  const [state, setState] = useState<{
    loading: boolean;
    hasActiveSub: boolean;
    everSubscribed: boolean;
    freeUsed: number;
    freeLimit: number;
  }>({ loading: true, hasActiveSub: false, everSubscribed: false, freeUsed: 0, freeLimit: 5 });

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        if (alive) setState((s) => ({ ...s, loading: false }));
        return;
      }
      fetchEnt()
        .then((e: any) => {
          if (!alive) return;
          setState({
            loading: false,
            hasActiveSub: !!e.hasActiveSub,
            everSubscribed: !!e.everSubscribed,
            freeUsed: e.freeUsed ?? 0,
            freeLimit: e.freeLimit ?? 5,
          });
        })
        .catch(() => alive && setState((s) => ({ ...s, loading: false })));
    });
    return () => {
      alive = false;
    };
  }, [fetchEnt]);

  return {
    loading: state.loading,
    isTestnet,
    hasActiveSub: state.hasActiveSub,
    everSubscribed: state.everSubscribed,
    expired: state.everSubscribed && !state.hasActiveSub,
    pro: isTestnet || state.hasActiveSub,
    freeUsed: state.freeUsed,
    freeLimit: state.freeLimit,
  };
}
