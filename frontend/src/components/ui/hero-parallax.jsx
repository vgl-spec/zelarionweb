import React, { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

import { registerSnapStops } from '../../lib/scrollStore';
import { cn, prefersReducedMotion } from '../../lib/utils';

// Port of Aceternity's "Hero Parallax" (https://ui.aceternity.com/components/hero-parallax)
// onto this stack: CRA + plain JSX, no next/image or next/link. `bounce: 100` from the
// original springConfig is omitted — framer-motion's spring only reads `bounce` when
// `stiffness`/`damping` are both absent, so it was a dead field in the reference.
const SPRING_CONFIG = { stiffness: 300, damping: 30 };

// Where ScrollSnap is allowed to park the page inside the card wall, as fractions of
// `scrollYProgress`. Everything except the horizontal drift has finished by 0.2, so there
// is no half-played transition to land on past that point — these are quarter steps
// because that is the pacing the page needs: one gesture moves the wall a quarter,
// whatever a given viewer's wheel sensitivity would otherwise have done.
//
// 1 is deliberately absent. It puts the section's bottom edge at the top of the viewport,
// which is a sliver of the next section rather than a state of this one; the showcase's
// own first stop sits a hundred pixels further on and is the real next resting place.
const SNAP_FRACTIONS = [0, 0.25, 0.5, 0.75];

// `sizeClassName` is the one thing that differs between the parallax rows (fixed
// flex-item dimensions so the row can overflow off-screen) and the reduced-motion grid
// (fills its CSS Grid cell instead) — everything else about the card is identical.
function ShowcaseCard({ screen, loading, sizeClassName }) {
  return (
    <motion.div whileHover={{ y: -20 }} className={cn('group/product relative', sizeClassName)}>
      <img
        src={screen.src}
        alt={screen.alt}
        width="800"
        height="500"
        loading={loading}
        decoding="async"
        className="absolute inset-0 h-full w-full rounded-xl object-cover object-left-top transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/product:scale-[1.03]"
      />
      {/* The reference captions each card. These are unlabelled on purpose, so the scrim's
          only job is to seat a bright screenshot against the near-black page instead of
          making caption text legible: a thin ring plus a shallow foot, lifting on hover.
          A full `from-ink` wash here would flatten the very screens the wall is showing. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10 transition-opacity duration-300 group-hover/product:ring-white/20"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 rounded-b-xl bg-gradient-to-t from-ink/70 to-transparent opacity-80 transition-opacity duration-300 group-hover/product:opacity-40"
      />
    </motion.div>
  );
}

// Each row translates by up to 1000px, so a row narrower than the viewport plus that
// travel slides clean off one edge. Splitting 11 screens 4/4/3 did exactly that: measured
// at the deepest snap stop, the bottom row left an 840px void on the left — the same "big
// empty space" the client review called out. Five per row is what the reference layout
// uses and what keeps every row covering the viewport for the whole scroll.
const ROW_LENGTH = 5;
const ROW_COUNT = 3;

/**
 * Lays the screens out as ROW_COUNT rows of ROW_LENGTH, cycling the list when there are
 * fewer screens than slots. A repeat therefore lands two rows below its twin and on the
 * opposite side of the row, which is as far apart as the grid allows.
 */
function buildRows(items) {
  return Array.from({ length: ROW_COUNT }, (_, row) =>
    Array.from({ length: ROW_LENGTH }, (_, column) => {
      const slot = row * ROW_LENGTH + column;
      // `key` rather than `id`: with cycling, one screen can occupy several slots and
      // React needs those to be distinct.
      return { ...items[slot % items.length], key: String(slot) };
    })
  );
}

function ParallaxRow({ screens, translate, reverse, eager, className }) {
  return (
    <motion.div
      style={{ x: translate }}
      className={cn(
        'flex gap-4 sm:gap-6 md:gap-10 lg:gap-20',
        reverse ? 'flex-row-reverse' : 'flex-row',
        className
      )}
    >
      {screens.map((screen) => (
        <ShowcaseCard
          key={screen.key}
          screen={screen}
          loading={eager ? 'eager' : 'lazy'}
          sizeClassName="h-40 w-60 flex-shrink-0 sm:h-56 sm:w-80 md:h-72 md:w-[26rem] lg:h-96 lg:w-[30rem]"
        />
      ))}
    </motion.div>
  );
}

// `translate` lives on the row wrapper (one MotionValue driving all 5 cards), not on each
// card — matching the reference, and cheaper than 15 independent spring subscriptions.
function AnimatedParallax({ items, header }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });

  // `offset: ['start start', 'end start']` means progress runs from the section's top
  // reaching the viewport top to its bottom reaching it — so the scroll range is exactly
  // the section's own height, and a progress fraction converts straight to an offset.
  useEffect(
    () =>
      registerSnapStops('hero-parallax', () => {
        const el = ref.current;
        if (!el) return [];
        const top = window.scrollY + el.getBoundingClientRect().top;
        const stops = SNAP_FRACTIONS.map((fraction) => top + el.offsetHeight * fraction);
        // Progress is clamped at zero, so every offset from the document top down to
        // `top` renders the identical first frame — `top` is only below zero at all
        // because the sticky header takes the first 64px of the document. Anchor the
        // first stop at the document top instead: it is where the page loads, and a
        // first gesture that travelled 64px would look like nothing had happened.
        stops[0] = 0;
        return stops;
      }),
    []
  );

  const translateX = useSpring(useTransform(scrollYProgress, [0, 1], [0, 1000]), SPRING_CONFIG);
  const translateXReverse = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, -1000]),
    SPRING_CONFIG
  );
  const rotateX = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [15, 0]),
    SPRING_CONFIG
  );
  const opacity = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [0.2, 1]),
    SPRING_CONFIG
  );
  const rotateZ = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [20, 0]),
    SPRING_CONFIG
  );
  // The reference settles this at +500. That assumes a page where the card wall is the
  // only content; here it drops the rows half a viewport below their layout position and
  // leaves a ~440px band of empty background between the header and the first row for the
  // whole middle of the scroll. +160 keeps the same fly-down entrance without the void.
  const translateY = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [-700, 160]),
    SPRING_CONFIG
  );

  const [firstRow, secondRow, thirdRow] = buildRows(items);

  return (
    <div
      ref={ref}
      // Height is content-driven, not `h-[300vh]`. The rows are sized in px, so a viewport
      // multiple could only match the content at one window height: at 1440x900 a 300vh
      // container ran 656px past the last card, and the middle of the scroll was a blank
      // screen. `pb-56` is the runway the +160px settle needs so the bottom row is never
      // clipped by `overflow-hidden`.
      className="relative flex flex-col self-auto overflow-hidden pb-56 pt-40 antialiased [perspective:1000px] [transform-style:preserve-3d]"
    >
      {header}
      <motion.div style={{ rotateX, rotateZ, translateY, opacity }}>
        <ParallaxRow
          screens={firstRow}
          translate={translateX}
          reverse
          eager
          className="mb-8 sm:mb-12 md:mb-20"
        />
        <ParallaxRow
          screens={secondRow}
          translate={translateXReverse}
          className="mb-8 sm:mb-12 md:mb-20"
        />
        <ParallaxRow screens={thirdRow} translate={translateX} reverse />
      </motion.div>
    </div>
  );
}

// `prefers-reduced-motion` viewers get a plain responsive grid instead of the scrolling
// card wall — no springs, no 3D transforms. Mirrors the StaticShowcase pattern in
// `sections/ScrollExpandShowcase.jsx`: same content, choreography stripped, not hidden.
function StaticParallax({ items, header }) {
  return (
    <div className="relative">
      {header}
      <div className="mx-auto mt-16 grid max-w-content grid-cols-2 gap-4 px-6 sm:grid-cols-3 sm:gap-6 lg:grid-cols-5">
        {items.map((screen, i) => (
          <ShowcaseCard
            key={screen.id}
            screen={screen}
            loading={i < 5 ? 'eager' : 'lazy'}
            sizeClassName="aspect-[8/5] w-full"
          />
        ))}
      </div>
    </div>
  );
}

/**
 * `items`: array of `{ id, src, client, page, alt }` (see `data/showcase.js`).
 * `header`: the hero copy rendered above the cards — kept out of the rotateX/rotateZ
 * transform on purpose so it never tilts or fades with scroll, only the card rows do.
 */
export default function HeroParallax({ items, header }) {
  if (prefersReducedMotion()) {
    return <StaticParallax items={items} header={header} />;
  }
  return <AnimatedParallax items={items} header={header} />;
}
