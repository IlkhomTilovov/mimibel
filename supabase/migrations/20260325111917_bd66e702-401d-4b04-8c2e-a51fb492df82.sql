ALTER TABLE public.orders DROP CONSTRAINT orders_status_check;
UPDATE public.orders SET status = 'sotildi' WHERE status = 'completed';
UPDATE public.orders SET status = 'sotilmadi' WHERE status = 'cancelled';
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status = ANY (ARRAY['new'::text, 'in_progress'::text, 'sotildi'::text, 'sotilmadi'::text, 'keyinroq_sotildi'::text]));