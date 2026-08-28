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
export function scrollTo(target, { offset = 0, immediate = false } = {}) {
  if (scrollDriver) {
    scrollDriver.scrollTo(target, { offset, immediate });
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
