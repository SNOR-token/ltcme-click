
ALTER TABLE public.subscriptions ALTER COLUMN status TYPE text USING status::text;
ALTER TABLE public.subscriptions ALTER COLUMN tier TYPE text USING tier::text;
ALTER TABLE public.subscriptions ALTER COLUMN tier DROP NOT NULL;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id text UNIQUE;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS price_id text;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS product_id text;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT 'sandbox';
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS current_period_start timestamptz;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.has_active_ai_sub(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id
      AND status IN ('active','trialing','past_due')
      AND (current_period_end IS NULL OR current_period_end > now())
  );
$function$;
