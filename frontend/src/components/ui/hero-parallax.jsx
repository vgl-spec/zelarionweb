import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

import { cn, prefersReducedMotion } from '../../lib/utils';

// Port of Aceternity's "Hero Parallax" (https://ui.aceternity.com/components/hero-parallax)
// onto this stack: CRA + plain JSX, no next/image or next/link. `bounce: 100` from the
// original springConfig is omitted — framer-motion's spring only reads `bounce` when
// `stiffness`/`damping` are both absent, so it was a dead field in the reference.
const SPRING_CONFIG = { stiffness: 300, damping: 30 };

// `sizeClassName` is the one thing that differs between the parallax rows (fixed
// flex-item dimensions so the row can overflow off-screen) and the reduced-motion grid
// (fills its CSS Grid cell instead) — everything else about the card is identical.
function ShowcaseCard({ screen, loading, sizeClassName }) {
  return (
    <motion.figure
      whileHover={{ y: -20 }}
      className={cn('group/product relative', sizeClassName)}
    >
      <img
        src={screen.src}
        alt={screen.alt}
        width="800"
        height="500"
        loading={loading}
        decoding="async"
        className="absolute inset-0 h-full w-full rounded-xl object-cover object-left-top transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/product:scale-[1.03]"
      />
      {/* The reference only reveals the caption on `group-hover`, which is mouse-only and
          fails keyboard and touch users. The scrim here is opaque enough at rest that the
          client name already clears 4.5:1 against white text; hover just deepens it and
          nudges the card up (whileHover y:-20 from the reference) as a bonus cue, not the
          only cue. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-t from-ink via-ink/50 to-transparent opacity-90 transition-opacity duration-300 group-hover/product:opacity-100"
      />
      <figcaption className="absolute inset-x-0 bottom-0 p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/70">
          {screen.page}
        </p>
        <p className="mt-1 font-display text-sm font-bold leading-tight text-white sm:text-base">
          {screen.client}
        </p>
      </figcaption>
    </motion.figure>
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
          key={screen.id}
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

  const translateX = useSpring(useTransform(scrollYProgress, [0, 1], [0, 1000]), SPRING_CONFIG);
  const translateXReverse = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, -1000]),
    SPRING_CONFIG
  );
  const rotateX = useSpring(useTransform(scrollYProgress, [0, 0.2], [15, 0]), SPRING_CONFIG);
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.2], [0.2, 1]), SPRING_CONFIG);
  const rotateZ = useSpring(useTransform(scrollYProgress, [0, 0.2], [20, 0]), SPRING_CONFIG);
  // The reference settles this at +500. That assumes a page where the card wall is the
  // only content; here it drops the rows half a viewport below their layout position and
  // leaves a ~440px band of empty background between the header and the first row for the
  // whole middle of the scroll. +160 keeps the same fly-down entrance without the void.
  const translateY = useSpring(useTransform(scrollYProgress, [0, 0.2], [-700, 160]), SPRING_CONFIG);

  const rowSize = Math.ceil(items.length / 3);
  const firstRow = items.slice(0, rowSize);
  const secondRow = items.slice(rowSize, rowSize * 2);
  const thirdRow = items.slice(rowSize * 2, rowSize * 3);

  return (
    <div
      ref={ref}
      className="relative flex h-[300vh] flex-col self-auto overflow-hidden py-40 antialiased [perspective:1000px] [transform-style:preserve-3d]"
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

// `prefers-reduced-motion` viewers get a normal-height responsive grid instead of the
// 300vh scroll-jack — no springs, no 3D transforms. Mirrors the StaticShowcase pattern in
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
