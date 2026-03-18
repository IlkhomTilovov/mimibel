import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to handle scroll behavior on route changes
 * - If URL has a hash, scroll to that element
 * - Otherwise scroll to hero section or top of page
 */
export function useScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timeout = setTimeout(() => {
      if (hash) {
        // Scroll to hash element
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }

      // Try to scroll to hero section first
      const heroElement = document.getElementById('hero');
      if (heroElement) {
        heroElement.scrollIntoView({ behavior: 'instant' });
      } else {
        // Fallback to top of page
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    }, 0);

    return () => clearTimeout(timeout);
  }, [pathname, hash]);
}
