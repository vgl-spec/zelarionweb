import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useMotionTemplate } from 'framer-motion';

const MEDIA =
  'https://images.unsplash.com/photo-1639322537228-f710d846310a?crop=entropy&cs=srgb&fm=jpg&q=85&w=2000';

export default function ScrollExpandShowcase() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  // media grows from a centered card to full-bleed
  const wv = useTransform(scrollYProgress, [0, 0.55], [44, 100]);
  const hv = useTransform(scrollYProgress, [0, 0.55], [56, 100]);
  const radius = useTransform(scrollYProgress, [0, 0.55], [24, 0]);
  const width = useMotionTemplate`${wv}vw`;
  const height = useMotionTemplate`${hv}vh`;
  const borderRadius = useMotionTemplate`${radius}px`;

  // split title moves apart, then fades
  const leftX = useTransform(scrollYProgress, [0, 0.55], [0, -220]);
  const rightX = useTransform(scrollYProgress, [0, 0.55], [0, 220]);
  const titleOpacity = useTransform(scrollYProgress, [0.4, 0.62], [1, 0]);
  const eyebrowOpacity = useTransform(scrollYProgress, [0.35, 0.55], [1, 0]);
  const mediaBrightness = useTransform(scrollYProgress, [0, 0.55], [0.65, 0.5]);
  const overlayFilter = useMotionTemplate`brightness(${mediaBrightness})`;

  // expanded copy reveals after expansion completes
  const contentOpacity = useTransform(scrollYProgress, [0.62, 0.82], [0, 1]);
  const contentY = useTransform(scrollYProgress, [0.62, 0.82], [40, 0]);

  return (
    <section
      ref={sectionRef}
      id="platform"
      className="relative h-[300vh]"
      data-testid="showcase-section"
    >
      <div className="sticky top-0 flex h-screen w-full flex-col items-center justify-center overflow-hidden">
        {/* media */}
        <motion.div
          style={{ width, height, borderRadius }}
          className="relative overflow-hidden border border-white/10 shadow-[0_50px_120px_-50px_rgba(0,0,0,0.9)]"
        >
          <motion.img
            src={MEDIA}
            alt="Distributed runner grid executing a test suite in parallel"
            className="h-full w-full object-cover"
            style={{ filter: overlayFilter }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/40" />
        </motion.div>

        {/* blended title over the media */}
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center mix-blend-difference">
          <motion.p
            style={{ opacity: eyebrowOpacity }}
            className="mb-4 text-[12px] font-medium uppercase tracking-[0.28em] text-white"
          >
            Zelarion Platform
          </motion.p>
          <div
            className="flex flex-wrap items-center justify-center gap-x-5 px-4 text-center font-display text-[clamp(2rem,6vw,5.5rem)] font-bold leading-[0.95] tracking-tightest text-white"
            style={{ opacity: 1 }}
          >
            <motion.span style={{ x: leftX, opacity: titleOpacity }}>Every release,</motion.span>
            <motion.span style={{ x: rightX, opacity: titleOpacity }}>verified</motion.span>
          </div>
          <motion.p
            style={{ opacity: eyebrowOpacity }}
            className="mt-6 text-sm text-white/80"
          >
            Scroll to expand
          </motion.p>
        </div>

        {/* expanded content */}
        <motion.div
          style={{ opacity: contentOpacity, y: contentY }}
          className="pointer-events-none absolute inset-0 z-20 mx-auto flex max-w-content flex-col justify-center px-6"
        >
          <div className="max-w-2xl">
            <h3 className="font-display text-[clamp(1.75rem,4vw,3rem)] font-bold leading-tight tracking-tightest text-text">
              The run pipeline, end to end.
            </h3>
            <p className="mt-6 text-lg leading-relaxed text-text-dim">
              Zelarion picks up each commit instantly and fans the full suite across a
              distributed runner grid. Every run is pinned to a locked runtime and a
              byte-identical dependency tree, so a green result is a green result
              everywhere.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-text-dim">
              Flaky tests are isolated with a reproduction trace, results collapse into
              one deterministic verdict, and that verdict posts to your pull request in
              90 seconds — with a line-by-line diff of what passed, what failed, and why.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
