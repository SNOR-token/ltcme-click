import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyEntitlement } from "@/lib/payments.functions";

export const TRIAL_DAYS = 7;

export const PRO_EXPIRED_MESSAGE =
  "Heightened Security is not active. Pay with Litecoin on the paywall to unlock premium tools. Core wallet send/receive/recovery stay free.";

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
  const getEnt = useServerFn(getMyEntitlement);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const ent = await getEnt();
      const active = !!ent.active;
      setIsPro(active);
      setEverSubscribed(!!ent.everSubscribed);
      setExpired(!active && !!ent.everSubscribed);
      setPeriodEnd(ent.currentPeriodEnd);
      setTier(ent.tier);
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
