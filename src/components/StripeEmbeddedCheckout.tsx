import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCheckoutSession } from "@/lib/payments.functions";
import { useServerFn } from "@tanstack/react-start";
import { useCallback } from "react";

export function StripeEmbeddedCheckoutModal({
  priceId,
  onClose,
}: {
  priceId: string;
  onClose: () => void;
}) {
  const create = useServerFn(createCheckoutSession);
  const fetchClientSecret = useCallback(async () => {
    const result = await create({
      data: {
        priceId,
        environment: getStripeEnvironment(),
        returnUrl: `${window.location.origin}/ai?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("No client secret returned");
    return result.clientSecret;
  }, [create, priceId]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-2xl w-full max-w-lg my-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-background border border-border shadow flex items-center justify-center text-sm hover:border-primary"
          aria-label="Close"
        >
          ✕
        </button>
        <div id="checkout" className="rounded-2xl overflow-hidden">
          <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    </div>
  );
}