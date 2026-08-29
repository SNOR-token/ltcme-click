import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Shield } from "lucide-react";
import { PlansInline } from "@/components/PlansInline";
import { getMyEntitlement } from "@/lib/payments.functions";
import {
  useProAccess,
  TRIAL_DAYS,
  PRO_EXPIRED_MESSAGE,
  type ProAccess,
} from "@/lib/pro";

export { useProAccess, TRIAL_DAYS, PRO_EXPIRED_MESSAGE };
export type { ProAccess };

export function NetworkToggle() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-1 text-[11px] text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      Litecoin Mainnet
    </span>
  );
}

export function useHeightenedSecurity() {
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(false);
  const getEnt = useServerFn(getMyEntitlement);

  async function refresh() {
    setLoading(true);
    try {
      const ent = await getEnt();
      setActive(!!ent.active);
    } catch {
      setActive(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return { loading, active, refresh };
}

export function HeightenedSecurityGate({
  children,
  featureLabel = "this Heightened Security feature",
}: {
  children: ReactNode;
  featureLabel?: string;
}) {
  return <ProLock featureLabel={featureLabel}>{children}</ProLock>;
}

export function TrialBadge(props: { state?: ProAccess } = {}) {
  const local = useProAccess();
  const pro = props.state ?? local;
  if (pro.loading) return null;
  if (pro.pro || pro.isPro) {
    return (
      <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
        Heightened Security
      </span>
    );
  }
  if (pro.expired) {
    return (
      <span className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600">
        Expired
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
      Free tier
    </span>
  );
}

export function ProExpiredNotice(props: { state?: ProAccess; className?: string }) {
  const local = useProAccess();
  const pro = props.state ?? local;
  const className = props.className ?? "";
  if (pro.pro || pro.isPro || !pro.expired) return null;
  return (
    <div
      className={`rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground ${className}`}
    >
      <p className="font-medium text-foreground">Heightened Security expired</p>
      <p className="mt-1">{PRO_EXPIRED_MESSAGE}</p>
      <div className="mt-3">
        <PlansInline compact />
      </div>
    </div>
  );
}

export function ProLock(props: {
  children: ReactNode;
  state?: ProAccess;
  featureLabel?: string;
  title?: string;
  purpose?: string;
  unlocks?: string[];
  preview?: ReactNode;
}) {
  const local = useProAccess();
  const pro = props.state ?? local;
  const featureLabel = props.featureLabel ?? "this feature";

  if (pro.loading) {
    return (
      <div className="rounded-2xl border border-border bg-card/40 p-6 text-sm text-muted-foreground">
        Checking subscription…
      </div>
    );
  }

  if (pro.pro || pro.isPro) return <>{props.children}</>;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex items-start gap-3">
        <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="text-sm font-medium">{props.title ?? "Heightened Security required"}</div>
          <p className="text-xs text-muted-foreground">
            {props.purpose ??
              `Unlock ${featureLabel} by paying with Litecoin ($5.99/month equivalent). Core wallet stays free.`}
          </p>
          {props.unlocks && props.unlocks.length > 0 && (
            <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
              {props.unlocks.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          )}
          {props.preview && <div className="pt-1 opacity-80 pointer-events-none">{props.preview}</div>}
        </div>
      </div>
      <PlansInline />
    </div>
  );
}
