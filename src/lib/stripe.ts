/** Stripe client removed — pay with Litecoin via claimLtcPayment. */
export function getStripe(): Promise<null> {
  return Promise.resolve(null);
}
export function getStripeEnvironment(): "sandbox" | "live" {
  return "live";
}
