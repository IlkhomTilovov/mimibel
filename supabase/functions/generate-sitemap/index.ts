import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Fetch primary domain
    const { data: settingsData } = await supabaseClient
      .from('system_settings')
      .select('primary_domain')
      .limit(1)
      .single();

    const siteUrl = (settingsData?.primary_domain || 'https://mimibel.uz').replace(/\/+$/, '');

    // Fetch active & indexed categories
    const { data: categories } = await supabaseClient
      .from('categories')
      .select('slug, updated_at')
      .eq('is_active', true)
      .eq('is_indexed', true)
      .order('sort_order', { ascending: true });

    // Fetch active & indexed products
    const { data: products } = await supabaseClient
      .from('products')
      .select('id, slug, updated_at')
      .eq('is_active', true)
      .eq('is_indexed', true)
      .order('created_at', { ascending: false });

    const now = new Date().toISOString();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${siteUrl}/catalog</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${siteUrl}/about</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${siteUrl}/contact</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${siteUrl}/faq</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`;

    if (Array.isArray(categories)) {
      for (const cat of categories) {
        xml += `
  <url>
    <loc>${siteUrl}/catalog?category=${cat.slug}</loc>
    <lastmod>${cat.updated_at || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      }
    }

    if (Array.isArray(products)) {
      for (const prod of products) {
        const prodUrl = prod.slug || prod.id;
        xml += `
  <url>
    <loc>${siteUrl}/product/${prodUrl}</loc>
    <lastmod>${prod.updated_at || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      }
    }

    xml += `
</urlset>`;

    // Upload to storage bucket
    const xmlBlob = new Blob([xml], { type: 'application/xml' });
    const { error: uploadError } = await supabaseClient.storage
      .from('sitemap')
      .upload('sitemap.xml', xmlBlob, {
        contentType: 'application/xml',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(JSON.stringify({ error: uploadError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: publicUrl } = supabaseClient.storage
      .from('sitemap')
      .getPublicUrl('sitemap.xml');

    console.log('Sitemap generated and uploaded successfully:', publicUrl.publicUrl);

    return new Response(
      JSON.stringify({ success: true, url: publicUrl.publicUrl, products: products?.length || 0, categories: categories?.length || 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Generate sitemap error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
