import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const PIXEL_MARKER = 'data-meta-pixel';
const TAG_MARKER = 'data-meta-verification';

export function useMetaPixel() {
  const [injected, setInjected] = useState(false);

  useEffect(() => {
    let mounted = true;

    const inject = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('key, value')
          .in('key', [
            'meta_pixel_code', 'meta_pixel_enabled',
            'meta_verification_tags', 'meta_verification_enabled',
          ]);

        if (error || !data) return;

        const map: Record<string, string> = {};
        data.forEach(r => { map[r.key] = r.value || ''; });

        // --- Meta Pixel ---
        document.querySelectorAll(`[${PIXEL_MARKER}]`).forEach(el => el.remove());

        const pixelEnabled = map['meta_pixel_enabled'] === 'true';
        const pixelCode = (map['meta_pixel_code'] || '').trim();

        if (pixelEnabled && pixelCode && mounted) {
          const scriptMatch = pixelCode.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
          const noscriptMatch = pixelCode.match(/<noscript[^>]*>([\s\S]*?)<\/noscript>/gi);

          if (scriptMatch) {
            scriptMatch.forEach(block => {
              const inner = block.replace(/<\/?script[^>]*>/gi, '').trim();
              if (inner) {
                const el = document.createElement('script');
                el.setAttribute(PIXEL_MARKER, 'true');
                el.textContent = inner;
                document.head.appendChild(el);
              }
            });
          }

          if (noscriptMatch) {
            noscriptMatch.forEach(block => {
              const el = document.createElement('noscript');
              el.setAttribute(PIXEL_MARKER, 'true');
              el.innerHTML = block.replace(/<\/?noscript[^>]*>/gi, '').trim();
              document.head.appendChild(el);
            });
          }
        }

        // --- Meta Verification Tags ---
        document.querySelectorAll(`[${TAG_MARKER}]`).forEach(el => el.remove());

        const tagsEnabled = map['meta_verification_enabled'] === 'true';
        const tagsRaw = (map['meta_verification_tags'] || '').trim();

        if (tagsEnabled && tagsRaw && mounted) {
          const lines = tagsRaw.split('\n').map(l => l.trim()).filter(Boolean);

          for (const line of lines) {
            // Only allow <meta> tags for security
            if (!/^<meta\s[^>]*\/?>$/i.test(line)) continue;

            // Parse attributes from the meta tag
            const nameMatch = line.match(/name=["']([^"']+)["']/i);
            const contentMatch = line.match(/content=["']([^"']+)["']/i);
            const propertyMatch = line.match(/property=["']([^"']+)["']/i);

            if (!contentMatch) continue;

            const attrName = nameMatch?.[1] || propertyMatch?.[1];
            if (!attrName) continue;

            // Prevent duplicates
            const selector = nameMatch
              ? `meta[name="${attrName}"]`
              : `meta[property="${attrName}"]`;
            const existing = document.head.querySelector(selector);
            if (existing && !existing.hasAttribute(TAG_MARKER)) continue;
            if (existing) existing.remove();

            const meta = document.createElement('meta');
            if (nameMatch) {
              meta.setAttribute('name', attrName);
            } else {
              meta.setAttribute('property', attrName);
            }
            meta.setAttribute('content', contentMatch[1]);
            meta.setAttribute(TAG_MARKER, 'true');
            document.head.appendChild(meta);
          }
        }

        if (mounted) setInjected(pixelEnabled && !!pixelCode || tagsEnabled && !!tagsRaw);
      } catch {
        // silent
      }
    };

    inject();

    return () => {
      mounted = false;
      document.querySelectorAll(`[${PIXEL_MARKER}], [${TAG_MARKER}]`).forEach(el => el.remove());
    };
  }, []);

  return { injected };
}
