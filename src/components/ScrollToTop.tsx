import { useScrollToTop } from '@/hooks/useScrollToTop';

/**
 * Component that handles scroll-to-top behavior on route changes
 * Place this inside BrowserRouter to access location
 */
export function ScrollToTop() {
  useScrollToTop();
  return null;
}
