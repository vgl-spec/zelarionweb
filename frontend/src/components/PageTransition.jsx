import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { prefersReducedMotion } from '../lib/utils';

const ASSET_DIR = '/assets/transition';
// Each clip is 0.55 s. A clip that never reports `ended` (a stalled decoder, a tab put in the
// background) must not leave the site covered, so every wait is capped at this.
const CLIP_TIMEOUT_MS = 1200;
// The rendered hold clip is 0.1 s; the cover stays at least this long even on an instant route.
const MIN_HOLD_MS = 100;
const CSS_STEP_MS = 550;

/**
 * Portrait screens get the 1080x1920 cut so the band crosses the phone at the angle it was
 * drawn for, not a cropped slice of the landscape one.
 */
function orientation() {
  return window.innerWidth / window.innerHeight < 0.8 ? 'portrait' : 'landscape';
}

/**
 * The clips are VP9 WebM with an alpha channel. Safari (and every iOS browser, which all use
 * WebKit) plays WebM but drops the alpha, so the overlay would arrive as an opaque black
 * rectangle. Those browsers get the CSS version, which moves the same hold frame instead.
 */
function supportsAlphaWebm() {
  const ua = navigator.userAgent;
  const webkitOnly = /AppleWebKit/.test(ua) && !/(Chrome|Chromium|CriOS|Edg|Android)/.test(ua);
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (webkitOnly || iOS) return false;
  return document.createElement('video').canPlayType('video/webm; codecs="vp9"') !== '';
}

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Plays a clip from the start and resolves when it ends, or after the safety cap. */
function playToEnd(video) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      video.removeEventListener('ended', finish);
      resolve();
    };
    video.addEventListener('ended', finish);
    setTimeout(finish, CLIP_TIMEOUT_MS);
    video.currentTime = 0;
    const started = video.play();
    if (started && typeof started.catch === 'function') started.catch(finish);
  });
}

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

/**
 * The page-to-page transition: the faceted band covers the screen (cover clip), the router
 * swaps the page underneath while the hold frame shows, then the plane splits away (reveal
 * clip). The old page slides and dims, and the new one rises and sharpens, in CSS
 * (index.css, `html[data-zt]`), because the clips carry only the overlay.
 *
 * Mounted once inside the router (App.js) so it outlives the per-route SiteShell remount.
 * Browser back/forward is left instant: popstate cannot be delayed to play a cover first.
 */
export default function PageTransition() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [phase, setPhase] = useState('idle'); // idle | cover | hold | reveal
  const [mode, setMode] = useState('video'); // video | css
  const [shape, setShape] = useState('landscape');
  const busy = useRef(false);
  const coverRef = useRef(null);
  const revealRef = useRef(null);
  const arrived = useRef(null); // resolves when the router has rendered the new pathname
  const [ready, setReady] = useState(false); // assets requested; until then links navigate normally
  const readyRef = useRef(false);

  // Fetch the clips for this screen shape once the page itself has loaded, so they never
  // compete with the first paint.
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const load = () => {
      if (readyRef.current) return;
      readyRef.current = true;
      const s = orientation();
      setShape(s);
      setMode(supportsAlphaWebm() ? 'video' : 'css');
      const img = new Image();
      img.src = `${ASSET_DIR}/hold-${s}.webp`;
      setReady(true);
    };
    if (document.readyState === 'complete') {
      const id = setTimeout(load, 1500);
      return () => clearTimeout(id);
    }
    const onLoad = () => setTimeout(load, 1500);
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
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
      const s = orientation();
      setShape(s);
      const cover = coverRef.current;
      const reveal = revealRef.current;
      const videoReady = mode === 'video' && cover && reveal && cover.readyState >= 2 && reveal.readyState >= 2;
      const useVideo = videoReady && cover.currentSrc.includes(s);
      if (!useVideo) setMode('css');
      const root = document.documentElement;

      try {
        // Cover: band and plane sweep in; the old page slides 4% left and dims under them.
        root.dataset.zt = 'leaving';
        setPhase('cover');
        if (useVideo) await playToEnd(cover);
        else await wait(CSS_STEP_MS);
        setPhase('hold');

        // Swap the page while covered, and hold until the new route has painted.
        const landed = new Promise((resolve) => {
          arrived.current = { resolve };
        });
        root.dataset.zt = 'enter-start';
        navigate(to);
        await Promise.race([landed, wait(1500)]);
        await Promise.all([nextFrame(), wait(MIN_HOLD_MS)]);

        // Reveal: the plane splits away while the new page rises 8 px and sharpens.
        setPhase('reveal');
        root.dataset.zt = 'entering';
        if (useVideo) await playToEnd(reveal);
        else await wait(CSS_STEP_MS);
      } finally {
        delete root.dataset.zt;
        setPhase('idle');
        if (mode === 'css' && supportsAlphaWebm()) setMode('video');
        busy.current = false;
      }
    },
    [mode, navigate]
  );

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const onClick = (event) => {
      const to = internalTarget(event);
      // Before the clips are requested, let the link navigate on its own rather than wait.
      if (!to || !readyRef.current) return;
      // Stop react-router's <Link> from navigating straight away; it checks defaultPrevented.
      event.preventDefault();
      if (busy.current) return;
      run(to);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [run]);

  const active = phase !== 'idle';
  const src = (kind) => `${ASSET_DIR}/${kind}-${shape}.webm`;

  return (
    <div
      aria-hidden="true"
      className="zt-root"
      data-phase={phase}
      data-mode={mode}
      style={{ pointerEvents: active ? 'auto' : 'none' }}
    >
      {ready && mode === 'video' && (
        <>
          <video ref={coverRef} className="zt-layer" data-show={phase === 'cover'} src={src('cover')} muted playsInline preload="auto" />
          <video ref={revealRef} className="zt-layer" data-show={phase === 'reveal'} src={src('reveal')} muted playsInline preload="auto" />
        </>
      )}
      {ready && <img className="zt-layer zt-hold" src={`${ASSET_DIR}/hold-${shape}.webp`} alt="" decoding="async" />}
    </div>
  );
}
