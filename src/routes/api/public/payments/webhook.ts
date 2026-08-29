/**
 * Stripe webhooks removed — Heightened Security is Litecoin-only.
 * Kept as a no-op route so existing clients get a clear response until routeTree is regenerated.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async () =>
        new Response(
          JSON.stringify({
            error: "Stripe payments are disabled. Use Litecoin payment verification in the app.",
          }),
          { status: 410, headers: { "content-type": "application/json" } },
        ),
      GET: async () =>
        new Response(
          JSON.stringify({ status: "gone", message: "Use Litecoin claim flow" }),
          { status: 410, headers: { "content-type": "application/json" } },
        ),
    },
  },
});
