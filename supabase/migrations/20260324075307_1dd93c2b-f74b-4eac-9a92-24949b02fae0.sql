
-- Remove overly permissive anon insert policy
DROP POLICY IF EXISTS "Service can insert stock_movements" ON public.stock_movements;
