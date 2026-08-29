/** Stripe server SDK removed. */
export type StripeEnv = "sandbox" | "live";
export function getStripeSecretKey(_env: StripeEnv): string {
  throw new Error("Stripe is disabled. Use Litecoin payment verification.");
}
export function createStripeClient(_env: StripeEnv): never {
  throw new Error("Stripe is disabled. Use Litecoin payment verification.");
}
export function getStripeErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
