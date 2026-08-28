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
 * The hero copy, unchanged from the previous hero — only its container changed (it now
 * sits above `HeroParallax`'s card rows instead of alone). Kept as its own component so
 * `HeroParallax` can render it outside the rotateX/rotateZ transform that only the card
 * rows get, and so the reduced-motion branch renders the exact same copy, unanimated.
 */
function HeroHeader() {
  return (
    <div className="relative z-10 mx-auto max-w-content px-6">
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-4xl">
        <motion.div variants={item}>
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.03] px-4 py-1.5 text-[13px] text-text-dim backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-aurora-teal shadow-[0_0_10px_2px_rgba(45,212,196,0.6)]" />
            Software studio, Philippines — working internationally
          </span>
        </motion.div>

        {/* text-wrap:balance stops the last line orphaning on "on." — without it the
            headline breaks after "run" and drops two characters onto a line of their
            own. Browsers without support just wrap as before. */}
        <motion.h1
          variants={item}
          className="mt-7 font-display text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.02] tracking-tightest text-text [text-wrap:balance]"
        >
          Digital solutions built around{' '}
          <span className="text-gradient">how your business works.</span>
        </motion.h1>

        <motion.p variants={item} className="mt-7 max-w-lg text-lg leading-relaxed text-text-dim">
          Zelarion creates software, web apps, and internal systems that turn
          complex business needs into clear, dependable digital experiences.
        </motion.p>

        <motion.div variants={item} className="mt-9 flex flex-wrap items-center gap-3">
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
