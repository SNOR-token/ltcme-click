-- Litecoin payment claims for Heightened Security (replaces Stripe).
CREATE TABLE IF NOT EXISTS public.ltc_payment_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  txid TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('monthly', 'yearly')),
  amount_sats BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  confirmations INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  UNIQUE (txid)
);

CREATE INDEX IF NOT EXISTS idx_ltc_claims_user ON public.ltc_payment_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_ltc_claims_txid ON public.ltc_payment_claims(txid);

ALTER TABLE public.ltc_payment_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own claims read" ON public.ltc_payment_claims
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

GRANT SELECT ON public.ltc_payment_claims TO authenticated;
GRANT ALL ON public.ltc_payment_claims TO service_role;

-- Allow provider default to litecoin
ALTER TABLE public.subscriptions ALTER COLUMN provider SET DEFAULT 'litecoin';
