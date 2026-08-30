import { useEffect } from 'react';
import { collectSnapStops, scrollTo } from '../lib/scrollStore';
import { prefersReducedMotion } from '../lib/utils';

// A wheel gesture is a burst of events, not one. Anything arriving within this of the
// previous wheel belongs to the flick already handled — trackpad momentum can keep firing
// for a second after the fingers lift, and each of those must not count as a new step.
const GESTURE_GAP_MS = 160;

// How far one gesture has to carry before it counts as a step. Deliberately small: any
// real scroll clears it within a frame or two, while a stray twitch of the trackpad does
// not move the page a whole screen. It is a floor, not a scale — a gentle wheel and a
// hard one both advance exactly one stop, which is the point.
const WHEEL_THRESHOLD_PX = 24;

// How long the page must be still before the fallback park runs. Touch and keyboard
// scrolling never reach the wheel handler, so they are caught here once they settle.
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
 * Parks the home page on discrete scroll stops across its two scroll-driven sections.
 *
 * Those sections publish the offsets where their animation is at rest (see
 * `registerSnapStops` in lib/scrollStore). Between the first and last of them one wheel
 * gesture advances exactly one stop, so the step is a property of the page rather than of
 * how far a given viewer's wheel happens to travel — the complaint this exists to fix.
 * Outside them nothing is intercepted and the page scrolls normally.
 *
 * Two entry points, because not every scroll is a wheel:
 *
 *  - The wheel handler steps immediately. It does not preventDefault and does not need
 *    to: Lenis's own `scrollTo` owns the scroll position for the length of its tween and
 *    discards wheel input while it runs, so re-targeting it is enough to swallow the
 *    gesture's delta. Reacting on the wheel rather than waiting for the page to settle
 *    also avoids chaining Lenis's ~1.15s inertia in front of the snap, which made a
 *    single gesture take some two and a half seconds and ate every other one.
 *  - The idle handler is the fallback for touch, keyboard and scrollbar dragging, which
 *    never produce a wheel event. It only pulls the page onto the closest stop.
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

    const glideTo = (target, from) => {
      const seconds = Math.min(
        MAX_SNAP_SECONDS,
        Math.max(MIN_SNAP_SECONDS, Math.abs(target - from) / SNAP_PX_PER_SECOND)
      );
      snapEndsAt = Date.now() + seconds * 1000;
      scrollTo(target, { duration: seconds, easing: SNAP_EASE });
    };

    // The stops, plus where the page currently sits in relation to them. Null when there
    // is nothing to snap to or the page is outside the zone entirely.
    const locate = () => {
      const stops = collectSnapStops();
      if (stops.length < 2) return null;

      const y = window.scrollY;
      if (y < stops[0] - LANDED_PX || y > stops[stops.length - 1] + LANDED_PX) return null;
      return { stops, y };
    };

    const handleWheel = (event) => {
      const now = Date.now();
      const isNewGesture = now - lastWheelAt > GESTURE_GAP_MS;
      lastWheelAt = now;

      if (!event.deltaY || event.ctrlKey) return; // horizontal scroll, or pinch zoom
      if (isNewGesture) gestureDelta = 0;
      if (now < snapEndsAt) return;

      gestureDelta += event.deltaY;
      if (Math.abs(gestureDelta) < WHEEL_THRESHOLD_PX) return;

      const here = locate();
      if (!here) return;
      const { stops, y } = here;

      const direction = gestureDelta > 0 ? 1 : -1;
      const anchor = nearestStop(stops, y);

      // Land on the closest stop first when it lies ahead in the direction of travel —
      // otherwise entering the zone, or nudging off a stop and reversing, skips one.
      const isAhead = direction > 0 ? anchor > y + LANDED_PX : anchor < y - LANDED_PX;
      const target = isAhead ? anchor : stops[stops.indexOf(anchor) + direction];

      // undefined means the step would leave the zone: let the page scroll out normally.
      if (target === undefined) return;
      gestureDelta = 0;
      glideTo(target, y);
    };

    // Touch, keyboard and scrollbar dragging land here instead. No stepping: whatever the
    // viewer did, the page settles onto the closest stop rather than mid-animation.
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

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(idleTimer);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return null;
}
