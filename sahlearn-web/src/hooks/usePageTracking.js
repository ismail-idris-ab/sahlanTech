import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// The gtag snippet in index.html fires one page_view for the landing page only.
// Every route change after that is a client-side navigation the browser never
// reports, so each one is sent here by hand.
export default function usePageTracking() {
  const { pathname, search } = useLocation();
  // The landing page was already counted by gtag('config'). Sending it again on
  // mount would double every session's first page.
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', 'page_view', {
      page_path: pathname + search,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, search]);
}
