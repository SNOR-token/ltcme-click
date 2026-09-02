import { LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { PlansInline } from "@/components/PlansInline";
import type { ProAccess } from "@/lib/pro";

export function HeightenedSecurityOverlay({
  state,
  title,
}: {
  state: ProAccess;
  title: string;
}) {
  if (state.loading || state.hasAccess) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-background/85 backdrop-blur-md">
      <div className="min-h-full flex items-start justify-center p-4 pt-16 md:pt-24">
        <div className="w-full max-w-xl rounded-3xl border border-primary/40 bg-card shadow-2xl neon-edge p-5 md:p-7 space-y-5">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-primary/30 bg-primary/10 p-3">
              <LockKeyhole className="h-6 w-6 text-primary" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-neon-gradient">
                  Heightened Security
                </h2>
                <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  $1.99 / month
                </span>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                {title} is included with your LTCme Heightened Security subscription.
              </p>
            </div>
          </div>

          <div className="grid gap-2 text-sm">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background/40 px-3 py-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Unlimited LTCme AI after your 10 free messages
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-border bg-background/40 px-3 py-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              PRO · Multisig · PQ Lab · Transaction Builder
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Wallet, Send, Receive, Buy/Sell and Tools remain free. Payment is
            Litecoin-only. Send the displayed LTC amount, then paste the
            transaction ID below to confirm activation.
          </p>

          <PlansInline compact />
        </div>
      </div>
    </div>
  );
}
