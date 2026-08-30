import React, { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useMotionTemplate } from 'framer-motion';
import { registerSnapStops } from '../lib/scrollStore';
import { prefersReducedMotion } from '../lib/utils';

// The choreography's keyframes, in `scrollYProgress`. Named because the snap stops below
// have to be exactly these values: parking anywhere else leaves the image frozen
// mid-expansion or the copy caught half-faded, which is the whole thing snapping exists
// to prevent. Change one of these and the stop it anchors moves with it.
const EXPAND_END = 0.55; // media has reached full bleed
const TITLE_GONE = 0.62; // split headline has finished fading out
const CONTENT_END = 0.82; // expanded copy has finished revealing

// The two points where the section actually reads as finished: the card, and the
// full-bleed image with the copy fully in. TITLE_GONE is deliberately not among them —
// the headline has faded and the body has not begun, so it is a full screen with nothing
// on it, and parking a viewer there is the very thing snapping exists to prevent. One
// gesture therefore plays the expansion and the reveal as a single move. Nothing animates
// between CONTENT_END and the section's end either, so a stop at 1 would be a step that
// changes nothing; the remaining scroll simply carries on into the next section.
const SNAP_PROGRESS = [0, CONTENT_END];

// A photograph of a working warehouse aisle, replacing the abstract cube lattice that
// stood here. The lattice was decoration: it said nothing about the business, and this is
// the largest image on the site. A real operating environment is the only thing on the
// page that evidences the "internal systems that stay behind the scenes" claim.
//
// It keeps the property the lattice was chosen for: no readable text anywhere in frame,
// and a dim, uncluttered centre, so the headline sitting on top of it stays legible
// instead of colliding with someone else's words.
const MEDIA = '/assets/photos/showcase-warehouse.webp';
const MEDIA_ALT =
  'A worker walking a warehouse aisle between loaded pallet racking, seen from a distance';

// Single source for the copy: the animated and reduced-motion trees render the
// same words, and a wording change must not have to be made in two places.
const EYEBROW = 'Digital solutions built around momentum';
const TITLE_LEAD = 'Built to last.';
const TITLE_TRAIL = 'Not to demo.';
const SCROLL_HINT = 'Scroll to expand';
const BODY_HEADING = 'Built for what comes next.';
// The key benefit gets the accent treatment wherever it appears in BODY, via
// renderBodyLine() below. Keeping it as a constant prevents the animated and
// reduced-motion presentations from drifting apart.
const BODY_ACCENT = 'Ready for real momentum.';
const BODY = [
  'Clear experiences for every screen, every workflow, and every person who depends on them.',
  'Thoughtful systems that make complex work easier to understand, use, and improve.',
  `From the first interaction to the next opportunity: ${BODY_ACCENT}`,
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

  // `offset: ['start start', 'end end']` pins the sticky child for one viewport, so
  // progress runs over (section height − viewport height), not the section height.
  useEffect(
    () =>
      registerSnapStops('scroll-expand-showcase', () => {
        const el = sectionRef.current;
        if (!el) return [];
        const top = window.scrollY + el.getBoundingClientRect().top;
        const range = el.offsetHeight - window.innerHeight;
        if (range <= 0) return [];
        return SNAP_PROGRESS.map((progress) => top + range * progress);
      }),
    []
  );

  // media grows from a centered card to full-bleed
  const wv = useTransform(scrollYProgress, [0, EXPAND_END], [44, 100]);
  const hv = useTransform(scrollYProgress, [0, EXPAND_END], [56, 100]);
  const radius = useTransform(scrollYProgress, [0, EXPAND_END], [24, 0]);
  const width = useMotionTemplate`${wv}vw`;
  const height = useMotionTemplate`${hv}vh`;
  const borderRadius = useMotionTemplate`${radius}px`;

  // Split title moves apart, then fades. Travel is in vw, not pixels, and is
  // capped at 7: the headline is sized in vw too, so the two halves occupy a
  // near-constant ~84% of the line at every width, leaving only ~8vw of slack
  // per side. Anything larger slides them into the clipped edge of the sticky
  // container and cuts the words mid-letter. Below `sm` the halves stack (see
  // the h2), which buys back the room the 2rem font floor takes away.
  const leftX = useTransform(scrollYProgress, [0, EXPAND_END], ['0vw', '-7vw']);
  const rightX = useTransform(scrollYProgress, [0, EXPAND_END], ['0vw', '7vw']);
  const titleOpacity = useTransform(scrollYProgress, [0.4, TITLE_GONE], [1, 0]);
  const eyebrowOpacity = useTransform(scrollYProgress, [0.35, EXPAND_END], [1, 0]);
  const mediaBrightness = useTransform(scrollYProgress, [0, EXPAND_END], [0.65, 0.5]);
  const overlayFilter = useMotionTemplate`brightness(${mediaBrightness})`;

  // expanded copy reveals after expansion completes
  const contentOpacity = useTransform(scrollYProgress, [TITLE_GONE, CONTENT_END], [0, 1]);
  const contentY = useTransform(scrollYProgress, [TITLE_GONE, CONTENT_END], [40, 0]);

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
          {/* Horizontal ramp as well as the vertical one. Once the media is full bleed the
              expanded copy sits over the left half of the photograph, and text-dim on a
              mid-tone pallet of boxes does not clear 4.5:1 on its own. */}
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/55 to-ink/15" />
        </motion.div>

        {/* blended title over the media */}
        {/* Plain white, not `mix-blend-difference`. Difference blending was chosen for the
            abstract lattice that used to sit here, which was near black, so inverting it
            produced near white. Against a photograph it inverts to mid grey and the
            headline goes muddy -- and it changes value across the frame, so half the line
            reads brighter than the other half. */}
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center">
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
