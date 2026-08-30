import { useEffect } from 'react';
import { collectSnapStops, scrollTo } from '../lib/scrollStore';
import { prefersReducedMotion } from '../lib/utils';

// A gesture is a burst of events, not one. Anything arriving within this of the previous
// wheel belongs to the flick already handled — trackpad momentum keeps firing for about a
// second after the fingers lift, and none of that is a new instruction.
const GESTURE_GAP_MS = 160;

// How far a gesture has to carry before it commits to a step. Deliberately small: a real
// scroll clears it within a frame or two, while a stray twitch does not move the page a
// whole screen. It is a floor, not a scale — a gentle wheel and a hard one both advance
// exactly one stop, which is the entire point.
const WHEEL_THRESHOLD_PX = 24;
const TOUCH_THRESHOLD_PX = 40;

// How long the page must be still before the fallback park runs. Keyboard and scrollbar
// dragging are not intercepted, so they are caught here once they settle.
const IDLE_MS = 140;

// Close enough to a stop to call it parked; absorbs sub-pixel rounding.
const LANDED_PX = 4;

// A snap is timed by distance so a quarter of the card wall and the full-screen expansion
// do not take the same beat. Clamped at both ends: below the floor a step reads as a jump
// cut, above the ceiling the page feels like it is holding the viewer still.
const SNAP_PX_PER_SECOND = 1100;
const MIN_SNAP_SECONDS = 0.45;
const MAX_SNAP_SECONDS = 1.15;
const SNAP_EASE = (t) => 1 - Math.pow(1 - t, 3);

function nearestStop(stops, y) {
  return stops.reduce((best, stop) =>
    Math.abs(stop - y) < Math.abs(best - y) ? stop : best
  );
}

/**
 * Turns the home page's two scroll-driven sections into stepped scrolling.
 *
 * Those sections publish the offsets where their animation is at rest (see
 * `registerSnapStops` in lib/scrollStore). Between the first and last of them the page is
 * not free to scroll at all: a gesture is an instruction to advance one stop, and the page
 * moves itself there. One notch of a stiff wheel and one flick of a sensitive trackpad do
 * the same thing, which is the point — the review's complaint was that the distance
 * travelled depended on the viewer's hardware. Outside those offsets nothing is
 * intercepted and the page scrolls normally.
 *
 * The load-bearing detail is that blocking the browser's default scroll is not enough.
 * Lenis registers its own wheel listener before this one and has already taken the delta by
 * the time `preventDefault` runs, so every gesture that is not turned into a step has to be
 * actively cancelled by re-pinning the page to its stop. Leaving that out is what made an
 * earlier version drift: the page stayed still during a snap, when Lenis's own `scrollTo`
 * owns the position and drops input, then slid freely in the gaps between snaps.
 *
 * A step that would leave the zone is never intercepted, at either end, so nothing can trap
 * a viewer inside it. Keyboard scrolling is deliberately left alone for the same reason;
 * the idle handler quietly parks it on the nearest stop afterwards.
 *
 * Does nothing under `prefers-reduced-motion`: both sections render as ordinary static
 * blocks there, so there is no choreography left to protect.
 */
export default function ScrollSnap() {
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;

    let idleTimer = 0;
    let lastWheelAt = 0;
    let gestureDelta = 0;
    let snapEndsAt = 0;
    let touchStartY = null;
    let touchTravel = 0;

    const glideTo = (target, from) => {
      const seconds = Math.min(
        MAX_SNAP_SECONDS,
        Math.max(MIN_SNAP_SECONDS, Math.abs(target - from) / SNAP_PX_PER_SECOND)
      );
      snapEndsAt = Date.now() + seconds * 1000;
      scrollTo(target, { duration: seconds, easing: SNAP_EASE });
    };

    // The stops and where the page sits among them, or null when there is nothing to snap
    // to or the page is outside the zone entirely.
    const locate = () => {
      const stops = collectSnapStops();
      if (stops.length < 2) return null;

      const y = window.scrollY;
      if (y < stops[0] - LANDED_PX || y > stops[stops.length - 1] + LANDED_PX) return null;
      return { stops, y };
    };

    // The stop one step from here in the direction of travel, or undefined when that step
    // would leave the zone. Landing on the closest stop first when it lies ahead stops the
    // page skipping one on the way in, or when reversing off a stop it has drifted from.
    const stepTarget = ({ stops, y }, direction) => {
      const anchor = nearestStop(stops, y);
      const isAhead = direction > 0 ? anchor > y + LANDED_PX : anchor < y - LANDED_PX;
      return isAhead ? anchor : stops[stops.indexOf(anchor) + direction];
    };

    // Cancel the movement Lenis already took from this gesture. `immediate` because this is
    // a correction, not a transition -- the viewer should never see the page drift and come
    // back, only that it did not move.
    const holdAt = (stops, y) => scrollTo(nearestStop(stops, y), { immediate: true });

    const handleWheel = (event) => {
      const now = Date.now();
      const isNewGesture = now - lastWheelAt > GESTURE_GAP_MS;
      lastWheelAt = now;

      if (!event.deltaY || event.ctrlKey) return; // horizontal scroll, or pinch zoom

      const here = locate();
      if (!here) return;

      if (isNewGesture) gestureDelta = 0;

      // Mid-snap: Lenis's scrollTo owns the position and discards input, so the tween only
      // needs the browser's own scrolling held off it.
      if (now < snapEndsAt) {
        event.preventDefault();
        return;
      }

      gestureDelta += event.deltaY;
      const target = stepTarget(here, gestureDelta > 0 ? 1 : -1);
      if (target === undefined) return; // stepping out of the zone: let the page go

      event.preventDefault();

      if (Math.abs(gestureDelta) < WHEEL_THRESHOLD_PX) {
        holdAt(here.stops, here.y);
        return;
      }
      gestureDelta = 0;
      glideTo(target, here.y);
    };

    const handleTouchStart = (event) => {
      touchStartY = event.touches[0]?.clientY ?? null;
      touchTravel = 0;
    };

    // The swipe only records an intent; the page does not move until the finger lifts.
    // Stepping mid-swipe does not work: Lenis stops any running animation on every touch
    // event it sees, so a snap started on `touchmove` was killed a fraction of the way in
    // and the page was left stranded between two stops.
    const handleTouchMove = (event) => {
      if (touchStartY === null) return;
      const here = locate();
      if (!here) return;

      // Dragging down the screen scrolls the page up, hence the inversion.
      touchTravel = touchStartY - (event.touches[0]?.clientY ?? touchStartY);
      if (stepTarget(here, touchTravel > 0 ? 1 : -1) === undefined) return;

      event.preventDefault();
      // Cancel anything that got past preventDefault, so the page is visibly locked for
      // the length of the swipe rather than sliding and then jumping back.
      if (Date.now() >= snapEndsAt) holdAt(here.stops, here.y);
    };

    const handleTouchEnd = () => {
      const travel = touchTravel;
      touchStartY = null;
      touchTravel = 0;
      if (Math.abs(travel) < TOUCH_THRESHOLD_PX) return;

      const here = locate();
      if (!here) return;
      const target = stepTarget(here, travel > 0 ? 1 : -1);
      if (target === undefined) return;
      glideTo(target, here.y);
    };

    // Keyboard and scrollbar dragging land here instead of being intercepted. No stepping:
    // whatever the viewer did, the page settles onto the closest stop rather than stranded
    // mid-animation.
    const park = () => {
      if (Date.now() < snapEndsAt) return;
      const here = locate();
      if (!here) return;

      const target = nearestStop(here.stops, here.y);
      if (Math.abs(here.y - target) > LANDED_PX) glideTo(target, here.y);
    };

    const handleScroll = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(park, IDLE_MS);
    };

    // Both gesture listeners must be non-passive: a passive listener may not call
    // preventDefault, and the browser would scroll underneath the snap.
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(idleTimer);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return null;
}
