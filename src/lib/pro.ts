import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAiEntitlement } from "@/lib/ai.functions";

export const TRIAL_DAYS = 0;

export const PRO_EXPIRED_MESSAGE =
  "Heightened Security is not active. Activate a Litecoin subscription to unlock the Quantum Guard security tools. Core wallet functions remain free.";

export type ProAccess = {
  loading: boolean;
  isPro: boolean;
  pro: boolean;
  hasAccess: boolean;
  expired: boolean;
  isTrial: boolean;
  inTrial: boolean;
  trialDaysLeft: number;
  periodEnd: string | null;
  tier: string | null;
  everSubscribed: boolean;
  refresh: () => void;
};

export function useProAccess(): ProAccess {
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [expired, setExpired] = useState(false);
  const [everSubscribed, setEverSubscribed] = useState(false);
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [tier, setTier] = useState<string | null>(null);

  const getEnt = useServerFn(getAiEntitlement);

  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      const ent = await getEnt();

      const active = !!ent.hasActiveSub;

      setIsPro(active);
      setEverSubscribed(!!ent.everSubscribed);
      setExpired(!active && !!ent.everSubscribed);

      // ai.functions exposes subscription status, but currentPeriodEnd/tier
      // are not part of its public return shape.
      setPeriodEnd(null);
      setTier(null);
    } catch {
      setIsPro(false);
      setEverSubscribed(false);
      setExpired(false);
      setPeriodEnd(null);
      setTier(null);
    } finally {
      setLoading(false);
    }
  }, [getEnt]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    loading,
    isPro,
    pro: isPro,
    hasAccess: isPro,
    expired,
    isTrial: false,
    inTrial: false,
    trialDaysLeft: 0,
    periodEnd,
    tier,
    everSubscribed,
    refresh,
  };
}
