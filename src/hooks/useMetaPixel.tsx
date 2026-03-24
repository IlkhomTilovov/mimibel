import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useMetaPixel() {
  const [injected, setInjected] = useState(false);

  useEffect(() => {
    let mounted = true;
    const PIXEL_MARKER = 'data-meta-pixel';

    const injectPixel = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('key, value')
          .in('key', ['meta_pixel_code', 'meta_pixel_enabled']);

        if (error || !data) return;

        const map: Record<string, string> = {};
        data.forEach(r => { map[r.key] = r.value || ''; });

        const enabled = map['meta_pixel_enabled'] === 'true';
        const code = (map['meta_pixel_code'] || '').trim();

        // Remove old injection if exists
        document.querySelectorAll(`[${PIXEL_MARKER}]`).forEach(el => el.remove());

        if (!enabled || !code || !mounted) {
          if (mounted) setInjected(false);
          return;
        }

        // Extract script content and noscript content separately
        const scriptMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
        const noscriptMatch = code.match(/<noscript[^>]*>([\s\S]*?)<\/noscript>/gi);

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

        if (mounted) setInjected(true);
      } catch {
        // silent
      }
    };

    injectPixel();

    return () => {
      mounted = false;
      document.querySelectorAll(`[data-meta-pixel]`).forEach(el => el.remove());
    };
  }, []);

  return { injected };
}
