-- Create storage bucket for sitemap
INSERT INTO storage.buckets (id, name, public) VALUES ('sitemap', 'sitemap', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to sitemap bucket
CREATE POLICY "Public can read sitemap" ON storage.objects FOR SELECT TO public USING (bucket_id = 'sitemap');

-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;