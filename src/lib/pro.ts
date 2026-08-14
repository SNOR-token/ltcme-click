// Deterministic Pro entitlement gate (mainnet only).
//
// Rules (enforced in code, never by AI prompt):
//  - Every account gets a 3-day free trial of the AI column + advanced features.
//  - After the trial, those features require an active subscription.
//  - Expiring a trial or subscription never disables the basic wallet.
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getAiEntitlement, TRIAL_DAYS } from "@/lib/ai.functions";

export { TRIAL_DAYS };

export interface ProState {
  loading: boolean;
  signedIn: boolean;
  hasActiveSub: boolean;
  everSubscribed: boolean;
  inTrial: boolean;
  trialDaysLeft: number;
  /** Trial finished (or subscription lapsed) and no active subscription. */
  expired: boolean;
  /** True when Pro features may be used right now. */
  pro: boolean;
}

export const PRO_EXPIRED_MESSAGE =
  "Your free access has ended. Your free Litecoin wallet remains fully operational — sending, receiving and your wallet status stay free. Subscribe to restore the AI column, continuous monitoring, advanced tools and protection planning.";

const INITIAL: ProState = {
  loading: true,
  signedIn: false,
  hasActiveSub: false,
  everSubscribed: false,
  inTrial: false,
  trialDaysLeft: 0,
  expired: false,
  pro: false,
};

export function useProAccess(): ProState {
  const fetchEnt = useServerFn(getAiEntitlement);
  const [state, setState] = useState<ProState>(INITIAL);

  useEffect(() => {
    let alive = true;
    async function load() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        if (alive) setState({ ...INITIAL, loading: false });
        return;
      }
      try {
        const e = await fetchEnt();
        if (!alive) return;
        setState({
          loading: false,
          signedIn: true,
          hasActiveSub: !!e.hasActiveSub,
          everSubscribed: !!e.everSubscribed,
          inTrial: !!e.inTrial,
          trialDaysLeft: e.trialDaysLeft ?? 0,
          expired: !e.hasActiveSub && !e.inTrial,
          pro: !!e.hasActiveSub || !!e.inTrial,
        });
      } catch {
        if (alive) setState((s) => ({ ...s, loading: false, signedIn: true }));
      }
    }
    load();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") load();
      if (event === "SIGNED_OUT") setState({ ...INITIAL, loading: false });
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [fetchEnt]);

  return state;
}
