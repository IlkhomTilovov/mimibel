import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml; charset=utf-8",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Fetch primary domain from system_settings
    const { data: settingsData } = await supabaseClient
      .from('system_settings')
      .select('primary_domain')
      .limit(1)
      .single();

    // Use primary_domain from settings, or fallback to request origin
    const url = new URL(req.url);
    const fallbackUrl = `${url.protocol}//${url.host}`.replace('/functions/v1/sitemap', '');
    const rawSiteUrl = settingsData?.primary_domain || 
      (fallbackUrl.includes('supabase') ? 'https://example.com' : fallbackUrl);
    // Remove trailing slash to avoid double slashes in URLs
    const siteUrl = rawSiteUrl.replace(/\/+$/, '');

    // Fetch active categories
    const { data: categories } = await supabaseClient
      .from('categories')
      .select('slug, updated_at')
      .eq('is_active', true)
      .eq('is_indexed', true)
      .order('sort_order', { ascending: true });

    // Fetch active and indexed products
    const { data: products } = await supabaseClient
      .from('products')
      .select('id, slug, updated_at')
      .eq('is_active', true)
      .eq('is_indexed', true)
      .order('created_at', { ascending: false });

    // Generate sitemap XML
    const now = new Date().toISOString();
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Homepage -->
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Catalog -->
  <url>
    <loc>${siteUrl}/catalog</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  
  <!-- About -->
  <url>
    <loc>${siteUrl}/about</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <!-- Contact -->
  <url>
    <loc>${siteUrl}/contact</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <!-- FAQ -->
  <url>
    <loc>${siteUrl}/faq</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`;

    // Add category pages
    if (Array.isArray(categories) && categories.length > 0) {
      xml += `\n  
  <!-- Categories -->`;
      for (const category of categories) {
        const lastmod = category.updated_at || now;
        xml += `
  <url>
    <loc>${siteUrl}/catalog?category=${category.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      }
    }

    // Add product pages
    if (Array.isArray(products) && products.length > 0) {
      xml += `\n  
  <!-- Products -->`;
      for (const product of products) {
        const lastmod = product.updated_at || now;
        const productUrl = product.slug || product.id;
        xml += `
  <url>
    <loc>${siteUrl}/product/${productUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      }
    }

    xml += `
</urlset>`;

    return new Response(xml, { 
      headers: corsHeaders,
      status: 200 
    });

  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`,
      { headers: corsHeaders, status: 200 }
    );
  }
});
