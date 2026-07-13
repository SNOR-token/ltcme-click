
-- Explicitly deny client-side writes to ai_usage and subscriptions.
-- These tables are only mutated by trusted server code using the service role
-- (which bypasses RLS). Adding explicit restrictive policies makes the deny
-- intent clear and satisfies write-policy coverage checks.

CREATE POLICY "no client inserts" ON public.ai_usage
  AS RESTRICTIVE FOR INSERT TO authenticated, anon WITH CHECK (false);
CREATE POLICY "no client updates" ON public.ai_usage
  AS RESTRICTIVE FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);
CREATE POLICY "no client deletes" ON public.ai_usage
  AS RESTRICTIVE FOR DELETE TO authenticated, anon USING (false);

CREATE POLICY "no client inserts" ON public.subscriptions
  AS RESTRICTIVE FOR INSERT TO authenticated, anon WITH CHECK (false);
CREATE POLICY "no client updates" ON public.subscriptions
  AS RESTRICTIVE FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);
CREATE POLICY "no client deletes" ON public.subscriptions
  AS RESTRICTIVE FOR DELETE TO authenticated, anon USING (false);
