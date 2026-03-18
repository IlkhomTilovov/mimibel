ALTER TABLE public.products ADD COLUMN IF NOT EXISTS fur_length text[] DEFAULT '{}'::text[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS application text[] DEFAULT '{}'::text[];