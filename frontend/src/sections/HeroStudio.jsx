import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDown } from 'lucide-react';
import { buttonVariants } from '../components/ui/button';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.3 } },
};
const item = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

export default function HeroStudio() {
  return (
    <section
      id="top"
      className="relative overflow-hidden pt-40 pb-32 md:pt-48 md:pb-40"
      data-testid="hero-studio-section"
    >
      {/* Same ambient aurora treatment as the rest of the site. The client list that
          used to sit beside the copy has moved to the work grid below (its proper
          home) — the aurora is now the hero's entire visual, not just a backdrop
          behind a competing column. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-screen w-full overflow-hidden">
        <div className="aurora-css absolute inset-0" aria-hidden="true" />
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-80 mix-blend-screen"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
        >
          <source src="/assets/aurora-720.webm" type="video/webm" />
          {/* Safari only gained VP9-in-WebM recently; the H.264 file is the fallback. */}
          <source src="/assets/aurora-720.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-ink/10 via-ink/35 to-ink" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_75%_at_50%_-5%,transparent_42%,rgba(5,7,10,0.55)_80%,#05070A_100%)]" />
      </div>

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
            We build the systems businesses <span className="text-gradient">actually run on.</span>
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-7 max-w-lg text-lg leading-relaxed text-text-dim"
          >
            Zelarion designs and builds production web systems for a law
            firm, industrial suppliers, and member-based organisations —
            in daily use by real staff and real customers, not sitting in a
            portfolio as a demo.
          </motion.p>

          <motion.div variants={item} className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              to="/contact"
              className={buttonVariants({ variant: 'solid', size: 'lg' })}
            >
              Start a project
              <ArrowUpRight size={18} strokeWidth={2.2} />
            </Link>
            <a
              href="/#work"
              className={buttonVariants({ variant: 'outline', size: 'lg' })}
            >
              <ArrowDown size={18} />
              See the work
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
