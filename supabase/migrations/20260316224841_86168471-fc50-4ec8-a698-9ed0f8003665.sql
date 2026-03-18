
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS target_keyword text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS keyword_variations text[] DEFAULT '{}'::text[];
