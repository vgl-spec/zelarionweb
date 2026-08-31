import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

import { buttonVariants } from '../components/ui/button';
import HeroParallax from '../components/ui/hero-parallax';
import { SHOWCASE_SCREENS } from '../data/showcase';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.3 } },
};
const item = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

/**
 * The hero copy. Centred and stacked rather than a left-aligned block: the headline is
 * split across two lines at deliberately different sizes so the second half carries the
 * weight, with the supporting line and the calls to action stacked beneath it on the same
 * axis. Kept as its own component so `HeroParallax` can render it outside the
 * rotateX/rotateZ transform that only the card rows get, and so the reduced-motion branch
 * renders the exact same copy, unanimated.
 */
function HeroHeader() {
  return (
    <div className="relative z-10 mx-auto max-w-content px-6">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-4xl text-center"
      >
        {/* Two spans, two sizes. The lead is the setup and the trail is the claim, so the
            trail is roughly twice the size and carries the gradient; at one size the whole
            line reads as an undifferentiated wall of type. text-wrap:balance stops the
            last line orphaning, and browsers without it just wrap as before. */}
        <motion.h1 variants={item} className="font-display tracking-tightest [text-wrap:balance]">
          <span className="block text-[clamp(1.25rem,2.8vw,2rem)] font-medium leading-[1.15] text-text-dim">
            Digital solutions built around
          </span>
          <span className="mt-3 block text-[clamp(2.25rem,5.5vw,4.25rem)] font-bold leading-[1.02] text-gradient">
            how your business works.
          </span>
        </motion.h1>

        <motion.p
          variants={item}
          className="mx-auto mt-8 max-w-xl text-body-lg text-text-dim"
        >
          Zelarion builds custom internal systems and web experiences that turn complex business
          needs into clear, dependable digital experiences.
        </motion.p>

        <motion.div
          variants={item}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Link to="/contact" className={buttonVariants({ variant: 'solid', size: 'lg' })}>
            Start a project
            <ArrowUpRight size={18} strokeWidth={2.2} />
          </Link>
          <Link to="/work" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            Explore solutions
            <ArrowUpRight size={18} />
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function HeroStudio() {
  return (
    <section id="top" className="relative overflow-hidden" data-testid="hero-studio-section">
      {/* The previous hero paired this aurora-css glow with a full <video> loop stretched
          to h-screen. That video made sense behind a single static viewport; it does not
          make sense behind a 300vh scroll-jacked card wall, where it would either need to
          be position:fixed (competing with 15 screenshots for the whole scroll) or stretch
          out of sync with the parallax. The CSS-only aurora keeps the same ambient teal/
          indigo tint behind the header and dies out naturally once the card rows begin, at
          a fraction of the previous cost (no video decode on a scroll-jacked page). */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-screen w-full overflow-hidden"
        aria-hidden="true"
      >
        <div className="aurora-css absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/10 via-ink/35 to-ink" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_75%_at_50%_-5%,transparent_42%,rgba(5,7,10,0.55)_80%,#05070A_100%)]" />
      </div>

      <HeroParallax items={SHOWCASE_SCREENS} header={<HeroHeader />} />
    </section>
  );
}
