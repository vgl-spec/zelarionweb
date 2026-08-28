import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { scrollTo } from '../lib/scrollStore';
import { prefersReducedMotion } from '../lib/utils';

// Sticky header height (`h-16` in Navigation2.jsx). Scrolling a target to `top: 0` would
// bury its heading under the header, so every hash scroll is offset by this much. Keep in
// sync with that file's `h-16` class.
const HEADER_OFFSET_PX = 64;

/**
 * React Router does not scroll on navigation by itself: a link to `/work#foo` or a bare
 * hash change lands wherever the previous page happened to be scrolled. This wires router
 * location changes to real scrolling, routed through Lenis (via scrollStore.scrollTo) so it
 * doesn't fight Lenis's own rAF-driven scroll loop.
 *
 * Mounted once near the top of the router (see App.js) so it observes every navigation
 * site-wide, rather than each page wiring its own scroll effect.
 */
export default function ScrollToHash() {
  const { pathname, hash } = useLocation();
  const previousPathnameRef = useRef(pathname);
  const isFirstMountRef = useRef(true);

  useEffect(() => {
    const isFirstMount = isFirstMountRef.current;
    isFirstMountRef.current = false;
    const pathnameChanged = previousPathnameRef.current !== pathname;
    previousPathnameRef.current = pathname;

    const immediate = prefersReducedMotion();

    if (hash) {
      const scrollToTarget = () => {
        const el = document.querySelector(hash);
        if (!el) return false;
        scrollTo(el, { offset: -HEADER_OFFSET_PX, immediate });
        return true;
      };

      if (scrollToTarget()) return undefined;

      // The target may not exist yet on first paint -- e.g. content that mounts a beat
      // after the route does. Retry once on the next frame; if it's still missing, give
      // up rather than polling forever.
      const frame = requestAnimationFrame(scrollToTarget);
      return () => cancelAnimationFrame(frame);
    }

    // No hash: only force scroll-to-top on an actual pathname change. A bare hash
    // removal on the same page, and the very first mount, are left alone so this never
    // overrides the browser's own scroll-position restoration (e.g. on back/forward).
    if (!isFirstMount && pathnameChanged) {
      scrollTo(0, { immediate });
    }
    return undefined;
  }, [pathname, hash]);

  return null;
}
