
-- Enable pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Enable pg_cron for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Update the trigger function with correct project URL
CREATE OR REPLACE FUNCTION public.trigger_sitemap_regeneration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM net.http_post(
    url := 'https://pmvgvaqwjjamqmisgeyb.supabase.co/functions/v1/generate-sitemap',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtdmd2YXF3amphbXFtaXNnZXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MTM5NjIsImV4cCI6MjA4OTM4OTk2Mn0.vVflM2TVznNqhghILk786_t2TktQTOto0B_IwbAnI-o'
    ),
    body := '{}'::jsonb
  );
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create triggers on products table
CREATE TRIGGER sitemap_regen_on_product_insert
  AFTER INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_sitemap_regeneration();

CREATE TRIGGER sitemap_regen_on_product_update
  AFTER UPDATE ON public.products
  FOR EACH ROW
  WHEN (OLD.is_active IS DISTINCT FROM NEW.is_active 
    OR OLD.is_indexed IS DISTINCT FROM NEW.is_indexed 
    OR OLD.slug IS DISTINCT FROM NEW.slug
    OR OLD.name_uz IS DISTINCT FROM NEW.name_uz)
  EXECUTE FUNCTION public.trigger_sitemap_regeneration();

CREATE TRIGGER sitemap_regen_on_product_delete
  AFTER DELETE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_sitemap_regeneration();

-- Create triggers on categories table
CREATE TRIGGER sitemap_regen_on_category_insert
  AFTER INSERT ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_sitemap_regeneration();

CREATE TRIGGER sitemap_regen_on_category_update
  AFTER UPDATE ON public.categories
  FOR EACH ROW
  WHEN (OLD.is_active IS DISTINCT FROM NEW.is_active 
    OR OLD.is_indexed IS DISTINCT FROM NEW.is_indexed 
    OR OLD.slug IS DISTINCT FROM NEW.slug
    OR OLD.name_uz IS DISTINCT FROM NEW.name_uz)
  EXECUTE FUNCTION public.trigger_sitemap_regeneration();

CREATE TRIGGER sitemap_regen_on_category_delete
  AFTER DELETE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_sitemap_regeneration();
