import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  wrap,
} from 'framer-motion';
import { X } from 'lucide-react';

import { lockScroll, unlockScroll } from '../lib/scrollStore';
import { prefersReducedMotion } from '../lib/utils';
import { SHOWCASE_SCREENS } from '../data/showcase';

// Deliberately a different motion language from the hero. The hero wall is driven
// entirely BY scroll: stop scrolling and it freezes. This one drifts on its own clock and
// only borrows scroll as a modifier, so the section is alive whether or not the viewer is
// moving. Two rows at opposite base velocities keep the eye from locking onto one track.
const ROW_ONE_VELOCITY = 14; // % of a copy's width per second
const ROW_TWO_VELOCITY = -18;

// How hard scroll pushes the drift. At 3, a fast flick roughly quadruples the base speed
// and briefly reverses it on an upward scroll — enough to feel connected to the gesture
// without the row becoming a blur that cannot be looked at.
const VELOCITY_BOOST = 3;
const VELOCITY_SPRING = { damping: 50, stiffness: 400 };

// A row that never stops is a moving click target, which is a poor tap/click affordance
// and a genuine accessibility problem. Pointing at or tabbing into a row eases it to a
// full stop over roughly this long, so a viewer can actually aim at a tile.
const PAUSE_EASE_MS = 220;

const CARD_SIZE = 'h-40 w-64 sm:h-52 sm:w-[21rem] lg:h-64 lg:w-[26rem]';

/**
 * One infinitely looping row.
 *
 * The children are rendered twice and the track is translated between 0% and -50% of its
 * own width — exactly one copy — so the wrap point always lands on an identical frame and
 * the seam is invisible. Percentages rather than pixels because the row's width changes
 * with the breakpoint and a pixel wrap would drift out of alignment at every size.
 */
function DriftRow({ screens, baseVelocity, onSelect }) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, VELOCITY_SPRING);
  // `clamp: false` lets a hard flick push past the mapped range instead of saturating,
  // which is what makes a fast scroll feel proportionally faster rather than capped.
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, VELOCITY_BOOST], {
    clamp: false,
  });

  const x = useTransform(baseX, (value) => `${wrap(-50, 0, value)}%`);

  // Held in refs, not state: these change on any scroll direction flip and on every
  // pointer enter, and re-rendering the row to store numbers only the animation loop
  // reads would be pure waste.
  const directionFactor = useRef(1);
  const pauseTarget = useRef(1);
  const pauseFactor = useRef(1);

  useAnimationFrame((_, delta) => {
    // Ease toward the target so the row glides to a halt rather than snapping, then land
    // exactly on it. Without that final snap the row keeps creeping by a fraction of a
    // pixel forever, which is still a moving target.
    const step = Math.min(1, delta / PAUSE_EASE_MS);
    pauseFactor.current += (pauseTarget.current - pauseFactor.current) * step;
    if (Math.abs(pauseTarget.current - pauseFactor.current) < 0.005) {
      pauseFactor.current = pauseTarget.current;
    }
    if (pauseFactor.current === 0) return;

    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);
    const factor = velocityFactor.get();
    if (factor < 0) directionFactor.current = -1;
    else if (factor > 0) directionFactor.current = 1;
    moveBy += moveBy * factor;
    baseX.set(baseX.get() + moveBy * pauseFactor.current);
  });

  const pause = () => {
    pauseTarget.current = 0;
  };
  const resume = () => {
    pauseTarget.current = 1;
  };

  return (
    <div
      className="overflow-hidden"
      onMouseEnter={pause}
      onMouseLeave={resume}
      // Capture phase: focus/blur do not bubble, so a tile receiving keyboard focus would
      // otherwise never reach this handler and the row would slide out from under it.
      onFocusCapture={pause}
      onBlurCapture={resume}
    >
      <motion.div style={{ x }} className="flex w-max gap-4 sm:gap-6">
        {/* Copy two is presentational only. Without aria-hidden a screen reader reads the
            whole wall twice, and the duplicates are not focusable for the same reason. */}
        {[0, 1].map((copy) =>
          screens.map((screen) => (
            <ShowcaseTile
              key={`${copy}-${screen.id}`}
              screen={screen}
              isDuplicate={copy === 1}
              onSelect={onSelect}
            />
          ))
        )}
      </motion.div>
    </div>
  );
}

function ShowcaseTile({ screen, isDuplicate, onSelect }) {
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(screen)}
      aria-hidden={isDuplicate || undefined}
      tabIndex={isDuplicate ? -1 : undefined}
      aria-label={`Enlarge: ${screen.alt}`}
      whileHover={{ y: -10 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`group relative flex-shrink-0 overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink ${CARD_SIZE}`}
    >
      <img
        src={screen.src}
        alt={isDuplicate ? '' : screen.alt}
        width="800"
        height="500"
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-left-top transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10 transition-colors duration-300 group-hover:ring-white/25"
      />
      {/* Rest state sits slightly dimmed so the row reads as one texture; hover clears the
          veil on the tile under the pointer, which is what picks it out of the drift. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-xl bg-ink/30 transition-opacity duration-300 group-hover:opacity-0"
      />
    </motion.button>
  );
}

/**
 * Full-bleed preview of one screen.
 *
 * Plain opacity/scale rather than a shared `layoutId` with the tile: the tile stays
 * mounted underneath, and framer keeps projecting between two mounted elements forever —
 * the dialog never settles, reports a wrong bounding box, and holds `pointer-events: none`
 * while it projects.
 */
function PreviewDialog({ screen, onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    // Lenis drives scroll with its own rAF loop and calls window.scrollTo, so it sails
    // straight through `body { overflow: hidden }`. lockScroll stops Lenis; the overflow
    // lock inside it is still the only lever under prefers-reduced-motion, where no Lenis
    // instance exists at all. Both are needed.
    lockScroll();
    const previouslyFocused = document.activeElement;
    closeRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      unlockScroll();
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={screen.alt}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/90 p-4 backdrop-blur-md sm:p-8"
    >
      <motion.img
        src={screen.src}
        alt={screen.alt}
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        // Stops a click on the image itself from reaching the backdrop's close handler.
        onClick={(event) => event.stopPropagation()}
        className="max-h-full w-auto max-w-[min(96rem,100%)] rounded-xl object-contain shadow-2xl ring-1 ring-white/15"
      />
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Close preview"
        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:right-8 sm:top-8"
      >
        <X size={20} />
      </button>
    </motion.div>
  );
}

function StaticWall({ screens, onSelect }) {
  return (
    <div className="mx-auto grid max-w-content grid-cols-2 gap-4 px-6 sm:grid-cols-3 sm:gap-6">
      {screens.map((screen) => (
        <button
          key={screen.id}
          type="button"
          onClick={() => onSelect(screen)}
          aria-label={`Enlarge: ${screen.alt}`}
          className="group relative aspect-[8/5] overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          <img
            src={screen.src}
            alt={screen.alt}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-left-top"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10"
          />
        </button>
      ))}
    </div>
  );
}

/**
 * A second pass over the same screens as the hero, with no headings and no captions —
 * the images are the whole message. Reduced-motion viewers get the identical set as a
 * still grid; the click-to-enlarge preview works in both branches.
 */
export default function CapabilityWall() {
  const [selected, setSelected] = useState(null);
  const isReduced = prefersReducedMotion();

  const handleClose = useCallback(() => setSelected(null), []);

  const half = Math.ceil(SHOWCASE_SCREENS.length / 2);
  const rowOne = SHOWCASE_SCREENS.slice(0, half);
  const rowTwo = SHOWCASE_SCREENS.slice(half);

  return (
    <section
      className="relative overflow-hidden py-20 md:py-28"
      data-testid="capability-wall"
      aria-label="Interface work"
    >
      {isReduced ? (
        <StaticWall screens={SHOWCASE_SCREENS} onSelect={setSelected} />
      ) : (
        <div className="flex flex-col gap-4 sm:gap-6">
          <DriftRow screens={rowOne} baseVelocity={ROW_ONE_VELOCITY} onSelect={setSelected} />
          <DriftRow screens={rowTwo} baseVelocity={ROW_TWO_VELOCITY} onSelect={setSelected} />
        </div>
      )}

      {/* The rows run full-bleed, so they are faded into the page background at both edges
          rather than cut off by the viewport. pointer-events-none keeps the tiles beneath
          them clickable right up to the edge. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-ink to-transparent sm:w-32"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-ink to-transparent sm:w-32"
      />

      <AnimatePresence>
        {selected && <PreviewDialog screen={selected} onClose={handleClose} />}
      </AnimatePresence>
    </section>
  );
}
