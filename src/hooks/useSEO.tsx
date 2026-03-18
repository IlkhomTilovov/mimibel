import { useEffect } from 'react';
import { useSystemSettings } from '@/hooks/useSystemSettings';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  noindex?: boolean;
  nofollow?: boolean;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

export function useSEO({
  title,
  description,
  keywords,
  noindex = false,
  nofollow = false,
  canonical,
  ogTitle,
  ogDescription,
  ogImage,
}: SEOProps) {
  const { settings, loading: settingsLoading, getSEOTitle, getSEODescription, getPrimaryDomain } = useSystemSettings();

  useEffect(() => {
    // Don't set any SEO values until settings are loaded
    if (settingsLoading || !settings) return;

    // Generate title — only from real data, no hardcoded fallbacks
    const pageTitle = title 
      ? getSEOTitle(title) 
      : (settings.seo_title || settings.site_name || '');
    
    if (pageTitle) {
      document.title = pageTitle;
    }

    // Helper to update or create meta tag
    const updateMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`);
      
      if (content) {
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute(attr, name);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      } else if (meta) {
        meta.remove();
      }
    };

    // Use provided description or fallback to system settings
    const metaDescription = description || getSEODescription();
    if (metaDescription) {
      updateMeta('description', metaDescription);
    }

    if (keywords) {
      updateMeta('keywords', keywords);
    }

    // Robots meta
    const robotsContent = [
      noindex ? 'noindex' : 'index',
      nofollow ? 'nofollow' : 'follow',
    ].join(', ');
    updateMeta('robots', robotsContent);

    // Canonical URL - use primary domain from settings
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    const baseUrl = getPrimaryDomain();
    const canonicalUrl = canonical || (baseUrl + window.location.pathname);
    
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // Open Graph tags
    updateMeta('og:title', ogTitle || pageTitle, true);
    updateMeta('og:description', ogDescription || metaDescription, true);
    updateMeta('og:url', canonicalUrl, true);
    if (ogImage) {
      updateMeta('og:image', ogImage, true);
    }
    updateMeta('og:type', 'website', true);
    updateMeta('og:site_name', settings.site_name || '', true);

    // Twitter Card
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', ogTitle || pageTitle);
    updateMeta('twitter:description', ogDescription || metaDescription);
    if (ogImage) {
      updateMeta('twitter:image', ogImage);
    }

    // Cleanup function
    return () => {};
  }, [title, description, keywords, noindex, nofollow, canonical, ogTitle, ogDescription, ogImage, settings, settingsLoading]);
}

export default useSEO;
