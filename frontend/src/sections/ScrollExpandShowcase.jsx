import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useMotionTemplate } from 'framer-motion';
import { prefersReducedMotion } from '../lib/utils';

// An abstract 3D render (white wireframe cubes connected in a lattice), not a
// screenshot of any client build. It carries no readable text of its own, so
// Zelarion's overlay headline stays legible on top of it instead of competing
// with someone else's copy the way a real site screenshot would.
const MEDIA = '/assets/showcase-lattice.webp';
const MEDIA_ALT = 'Abstract 3D render of white wireframe cubes connected in a lattice';

// Single source for the copy: the animated and reduced-motion trees render the
// same words, and a wording change must not have to be made in two places.
const EYEBROW = 'What a Zelarion build commits to';
const TITLE_LEAD = 'Built to last.';
const TITLE_TRAIL = 'Not to demo.';
const SCROLL_HINT = 'Scroll to expand';
const BODY_HEADING = "It works. It's yours.";
// The strongest claim (ownership) gets the accent treatment wherever it
// appears in BODY, via renderBodyLine() below. Kept as its own constant so
// the highlighted phrase can't drift out of sync with the sentence it lives in.
const BODY_ACCENT = 'Yours, permanently.';
const BODY = [
  'Real content, not filler. Built for every screen your customers hold.',
  'Protected against bad data. Usable by everyone, however they browse.',
  `The code. The domain. Every account. ${BODY_ACCENT}`,
];

// Wraps BODY_ACCENT in the gradient treatment already used in the hero,
// without hardcoding a second copy of the sentence it's embedded in.
function renderBodyLine(line) {
  if (!line.includes(BODY_ACCENT)) return line;
  const [before] = line.split(BODY_ACCENT);
  return (
    <>
      {before}
      <span className="text-gradient">{BODY_ACCENT}</span>
    </>
  );
}

// Reduced-motion viewers get the same words laid out as an ordinary block. The
// choreography is what gets turned off, not the content — a 300vh sticky
// section whose copy only fades in on scroll would be an empty gap here.
function StaticShowcase() {
  return (
    <section id="build" className="relative" data-testid="showcase-section">
      <div className="mx-auto max-w-content px-6 py-24 md:py-32">
        <p className="text-[12px] font-medium uppercase tracking-[0.28em] text-text-dim">
          {EYEBROW}
        </p>
        <h2 className="mt-4 font-display text-[clamp(2rem,5.5vw,4.75rem)] font-bold leading-[0.98] tracking-tightest text-text">
          {TITLE_LEAD} {TITLE_TRAIL}
        </h2>

        <div className="mt-10 overflow-hidden rounded-3xl border border-white/10">
          <img src={MEDIA} alt={MEDIA_ALT} className="h-full w-full object-cover" decoding="async" />
        </div>

        <div className="mt-10 max-w-3xl">
          <h3 className="font-display text-[clamp(2.25rem,6vw,4.5rem)] font-bold leading-[1.05] tracking-tightest text-text">
            {BODY_HEADING}
          </h3>
          {BODY.map((paragraph) => (
            <p key={paragraph} className="mt-5 text-xl leading-relaxed text-text-dim md:text-2xl">
              {renderBodyLine(paragraph)}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

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

  // Split title moves apart, then fades. Travel is in vw, not pixels, and is
  // capped at 7: the headline is sized in vw too, so the two halves occupy a
  // near-constant ~84% of the line at every width, leaving only ~8vw of slack
  // per side. Anything larger slides them into the clipped edge of the sticky
  // container and cuts the words mid-letter. Below `sm` the halves stack (see
  // the h2), which buys back the room the 2rem font floor takes away.
  const leftX = useTransform(scrollYProgress, [0, 0.55], ['0vw', '-7vw']);
  const rightX = useTransform(scrollYProgress, [0, 0.55], ['0vw', '7vw']);
  const titleOpacity = useTransform(scrollYProgress, [0.4, 0.62], [1, 0]);
  const eyebrowOpacity = useTransform(scrollYProgress, [0.35, 0.55], [1, 0]);
  const mediaBrightness = useTransform(scrollYProgress, [0, 0.55], [0.65, 0.5]);
  const overlayFilter = useMotionTemplate`brightness(${mediaBrightness})`;

  // expanded copy reveals after expansion completes
  const contentOpacity = useTransform(scrollYProgress, [0.62, 0.82], [0, 1]);
  const contentY = useTransform(scrollYProgress, [0.62, 0.82], [40, 0]);

  if (prefersReducedMotion()) {
    return <StaticShowcase />;
  }

  return (
    <section
      ref={sectionRef}
      id="build"
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
            alt={MEDIA_ALT}
            className="h-full w-full object-cover"
            style={{ filter: overlayFilter }}
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/40" />
        </motion.div>

        {/* blended title over the media */}
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center mix-blend-difference">
          <motion.p
            style={{ opacity: eyebrowOpacity }}
            className="mb-4 text-[12px] font-medium uppercase tracking-[0.28em] text-white"
          >
            {EYEBROW}
          </motion.p>
          {/* Copy is kept short and capped at 4.75rem: longer phrases run off both
              edges of the clipped sticky container before they finish fading. */}
          <h2 className="flex flex-col items-center justify-center gap-x-5 gap-y-1 px-4 text-center font-display text-[clamp(2rem,5.5vw,4.75rem)] font-bold leading-[0.95] tracking-tightest text-white sm:flex-row sm:flex-wrap">
            <motion.span style={{ x: leftX, opacity: titleOpacity }}>{TITLE_LEAD}</motion.span>
            <motion.span style={{ x: rightX, opacity: titleOpacity }}>{TITLE_TRAIL}</motion.span>
          </h2>
          <motion.p
            style={{ opacity: eyebrowOpacity }}
            className="mt-6 text-sm text-white/80"
          >
            {SCROLL_HINT}
          </motion.p>
        </div>

        {/* expanded content */}
        <motion.div
          style={{ opacity: contentOpacity, y: contentY }}
          className="pointer-events-none absolute inset-0 z-20 mx-auto flex max-w-content flex-col justify-center px-6"
        >
          <div className="max-w-3xl">
            <h3 className="font-display text-[clamp(2.25rem,6vw,4.5rem)] font-bold leading-[1.05] tracking-tightest text-text">
              {BODY_HEADING}
            </h3>
            {BODY.map((paragraph) => (
              <p key={paragraph} className="mt-5 text-xl leading-relaxed text-text-dim md:text-2xl">
                {renderBodyLine(paragraph)}
              </p>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
