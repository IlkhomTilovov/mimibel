-- Create a function that calls generate-sitemap edge function via pg_net
CREATE OR REPLACE FUNCTION public.trigger_sitemap_regeneration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Call the generate-sitemap edge function via pg_net
  PERFORM net.http_post(
    url := 'https://rdjfkysapjqcprdrrmdo.supabase.co/functions/v1/generate-sitemap',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkamZreXNhcGpxY3ByZHJybWRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4ODY3NjQsImV4cCI6MjA4ODQ2Mjc2NH0.Am17OJZqJSsONotgGlF2JFfzaG3uTyUYVsfiaNaFlJY'
    ),
    body := '{}'::jsonb
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger on products table (insert, update, delete)
CREATE TRIGGER sitemap_on_product_change
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.trigger_sitemap_regeneration();

-- Trigger on categories table (insert, update, delete)
CREATE TRIGGER sitemap_on_category_change
AFTER INSERT OR UPDATE OR DELETE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.trigger_sitemap_regeneration();