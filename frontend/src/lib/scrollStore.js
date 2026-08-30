// Lightweight global scroll store shared between Lenis and the R3F canvas.
// Avoids prop-drilling scroll progress into the 3D scene.

export const scrollStore = {
  // 0..1 progress of full page
  progress: 0,
  // raw scroll velocity (px/frame-ish) for subtle motion
  velocity: 0,
  // scroll offset / window.innerHeight -- independent of total document
  // height, so a section can key its own animation to "how far past the
  // fold" instead of a whole-document fraction that shifts every time
  // content is added elsewhere on the page
  viewportsScrolled: 0,
  // section anchors registered by name -> { top, height } in progress units
  sections: {},
};

export function setScroll(progress, velocity, viewportsScrolled) {
  scrollStore.progress = progress;
  scrollStore.velocity = velocity;
  scrollStore.viewportsScrolled = viewportsScrolled;
}

// Lenis, not the browser, drives page scrolling on this site: it runs its own
// rAF loop and calls window.scrollTo, so `body { overflow: hidden }` does NOT
// stop it -- an open modal still scrolled the page behind itself until this was
// added. Anything that needs the page held still must pause the driver.
// SmoothScroll registers the instance; under prefers-reduced-motion there is no
// Lenis at all, and the body-overflow lock is the whole mechanism.
let scrollDriver = null;

export function registerScrollDriver(driver) {
  scrollDriver = driver;
  return () => {
    if (scrollDriver === driver) scrollDriver = null;
  };
}

export function lockScroll() {
  scrollDriver?.stop();
}

export function unlockScroll() {
  scrollDriver?.start();
}

// Scroll to a position or element through whichever driver is active, so the tween runs
// inside Lenis's own rAF loop instead of fighting it with a raw window.scrollTo. Under
// prefers-reduced-motion there is no Lenis instance (see the comment above scrollDriver),
// so this falls back to the native API directly, honouring the same `offset`/`immediate`
// shape as Lenis's own scrollTo (https://github.com/darkroomengineering/lenis) so callers
// don't need to branch on which driver is live.
// Extra options (`duration`, `easing`, `lock`, `onComplete`, ...) are forwarded to Lenis
// untouched. The native fallback below understands none of them, which is why callers
// that depend on a specific tween must still behave correctly when it snaps instantly.
export function scrollTo(target, options = {}) {
  const { offset = 0, immediate = false } = options;
  if (scrollDriver) {
    scrollDriver.scrollTo(target, { ...options, offset, immediate });
    return;
  }
  const behavior = immediate ? 'auto' : 'smooth';
  if (typeof target === 'number') {
    window.scrollTo({ top: target + offset, behavior });
    return;
  }
  if (target && typeof target.getBoundingClientRect === 'function') {
    const top = window.scrollY + target.getBoundingClientRect().top + offset;
    window.scrollTo({ top, behavior });
  }
}

export function registerSection(name, el) {
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const top = window.scrollY + rect.top;
  const docHeight = document.body.scrollHeight - window.innerHeight;
  scrollStore.sections[name] = {
    start: docHeight > 0 ? top / docHeight : 0,
    center:
      docHeight > 0 ? (top + rect.height / 2 - window.innerHeight / 2) / docHeight : 0,
  };
}

// Sections that own a scroll-driven animation register the document offsets (in px)
// where that animation is at rest. ScrollSnap parks the page on one of them once the
// viewer stops scrolling, so a transition can never be left frozen halfway. Providers
// are functions rather than plain arrays because the offsets move with layout and have
// to be re-measured after a resize, a font swap, or an image finishing its load.
const snapStopProviders = new Map();

export function registerSnapStops(id, getStops) {
  snapStopProviders.set(id, getStops);
  return () => {
    if (snapStopProviders.get(id) === getStops) snapStopProviders.delete(id);
  };
}

/** Every registered stop, de-duplicated and sorted ascending. */
export function collectSnapStops() {
  const stops = [];
  snapStopProviders.forEach((getStops) => {
    getStops().forEach((stop) => {
      if (Number.isFinite(stop)) stops.push(Math.round(stop));
    });
  });
  return [...new Set(stops)].sort((a, b) => a - b);
}
