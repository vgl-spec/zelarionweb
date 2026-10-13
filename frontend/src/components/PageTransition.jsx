import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { prefersReducedMotion } from '../lib/utils';

// Phase lengths. Keep in sync with the transition durations in index.css (`.zt-*`).
const COVER_MS = 800;
const HOLD_MIN_MS = 450; // long enough for the logo to land and the seam line to draw through it
const REVEAL_MS = 950;
// If the new route never reports in (a lazy chunk that fails to load), uncover anyway.
const ROUTE_TIMEOUT_MS = 2500;

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A link click inside the site that should get the transition: same origin, a different
 * page, plain left click, not opening a new tab or downloading. Hash-only links on the same
 * page stay instant, because ScrollToHash scrolls to them.
 */
function internalTarget(event) {
  if (event.defaultPrevented || event.button !== 0) return null;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  const anchor = event.target.closest && event.target.closest('a[href]');
  if (!anchor || anchor.hasAttribute('download')) return null;
  if (anchor.target && anchor.target !== '_self') return null;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  if (url.pathname === window.location.pathname) return null;
  return url.pathname + url.search + url.hash;
}

/** One half of the plane: the grid texture, the logo and a glowing cut edge, clipped to a triangle. */
function Half({ side }) {
  return (
    <div className={`zt-half zt-half-${side}`}>
      <div className="zt-plane" style={{ backgroundImage: 'url(/assets/transition/plane.webp)' }} />
      <img className="zt-logo" src="/assets/logo-mark-512.png" alt="" decoding="async" />
      <svg className="zt-edge" viewBox="0 0 100 100" preserveAspectRatio="none">
        <line x1="0" y1="100" x2="100" y2="0" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

/**
 * The page-to-page transition, drawn in code: two halves of the grid plane close in from
 * opposite corners and meet on the screen's diagonal, the logo lands on the seam, then the
 * plane splits along that seam (the logo split with it) and the halves part. The router swaps
 * the page while the screen is covered. The old page slides and dims, and the new page rises
 * and sharpens, in CSS (`html[data-zt]` in index.css).
 *
 * Mounted once inside the router (App.js) so it outlives the per-route SiteShell remount.
 * Browser back/forward is left instant: popstate cannot be delayed to play a cover first.
 */
export default function PageTransition() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [phase, setPhase] = useState('idle'); // idle | cover | hold | reveal
  const busy = useRef(false);
  const arrived = useRef(null); // resolves when the router has rendered the new pathname

  // Fetch the two images once the page itself has loaded, so they never compete with the
  // first paint and are cached before the first click.
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const load = () => {
      for (const src of ['/assets/transition/plane.webp', '/assets/logo-mark-512.png']) {
        const img = new Image();
        img.src = src;
      }
    };
    if (document.readyState === 'complete') {
      const id = setTimeout(load, 1000);
      return () => clearTimeout(id);
    }
    window.addEventListener('load', load);
    return () => window.removeEventListener('load', load);
  }, []);

  useEffect(() => {
    if (arrived.current) {
      arrived.current.resolve();
      arrived.current = null;
    }
  }, [pathname]);

  const run = useCallback(
    async (to) => {
      busy.current = true;
      const root = document.documentElement;
      try {
        // Cover: the halves close in; the old page slides 4% left and dims under them.
        root.dataset.zt = 'leaving';
        setPhase('cover');
        await wait(COVER_MS);

        // Swap the page while covered, and hold until the new route has painted.
        setPhase('hold');
        const holdStarted = performance.now();
        const landed = new Promise((resolve) => {
          arrived.current = { resolve };
        });
        root.dataset.zt = 'enter-start';
        navigate(to);
        await Promise.race([landed, wait(ROUTE_TIMEOUT_MS)]);
        await nextFrame();
        await wait(Math.max(0, HOLD_MIN_MS - (performance.now() - holdStarted)));

        // Reveal: the plane splits on the seam while the new page rises 8 px and sharpens.
        setPhase('reveal');
        root.dataset.zt = 'entering';
        await wait(REVEAL_MS);
      } finally {
        delete root.dataset.zt;
        setPhase('idle');
        busy.current = false;
      }
    },
    [navigate]
  );

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const onClick = (event) => {
      const to = internalTarget(event);
      if (!to) return;
      // Stop react-router's <Link> from navigating straight away; it checks defaultPrevented.
      event.preventDefault();
      if (busy.current) return;
      run(to);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [run]);

  return (
    <div aria-hidden="true" className="zt-root" data-phase={phase} style={{ pointerEvents: phase === 'idle' ? 'none' : 'auto' }}>
      <Half side="a" />
      <Half side="b" />
      <svg className="zt-seam" viewBox="0 0 100 100" preserveAspectRatio="none">
        <line x1="0" y1="100" x2="100" y2="0" pathLength="1" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
