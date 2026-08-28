import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDown } from 'lucide-react';
import { buttonVariants } from '../components/ui/button';

// The six real systems Zelarion has shipped. This list IS the hero's visual
// anchor (see the section comment below for why) — every name and line here
// must trace to verified client work. Do not add, embellish, or round up.
const WORK = [
  {
    name: 'Palattao Law Office',
    sector: 'Legal',
    detail: 'Full-service law firm, Quezon City — nine practice areas, litigation to government procurement',
  },
  {
    name: 'Kaibo PH OPC',
    sector: 'Industrial supply',
    detail: 'Manufacturing, pulp & paper, and petro-chemical sectors',
  },
  {
    name: 'Goldenstars Packaging Resources',
    sector: 'Packaging',
    detail: 'Packaging materials and supplies',
  },
  {
    name: 'NOGATU Alliance',
    sector: 'Wellness',
    detail: 'Health, wealth and wellness organisation',
  },
  {
    name: 'Yor International',
    sector: 'Network platform',
    detail: 'Member platform carrying the line "Build Your Legacy"',
  },
  {
    name: 'Nogatu Store',
    sector: 'Commerce',
    detail: 'Storefront and distribution for the Nogatu brand',
  },
];

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
      className="relative overflow-hidden pt-40 md:pt-48"
      data-testid="hero-studio-section"
    >
      {/* Same ambient aurora treatment as the rest of the site, kept purely
          atmospheric and behind the content — the hero's actual subject is
          the client list to the right, not this backdrop. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-screen w-full overflow-hidden">
        <div className="aurora-css absolute inset-0" aria-hidden="true" />
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-80 mix-blend-screen"
          src="/assets/aurora.webm"
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/10 via-ink/35 to-ink" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_75%_at_50%_-5%,transparent_42%,rgba(5,7,10,0.55)_80%,#05070A_100%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-content px-6 pb-24 md:pb-32">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-12">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="lg:col-span-6"
          >
            <motion.div variants={item}>
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.03] px-4 py-1.5 text-[13px] text-text-dim backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-aurora-teal shadow-[0_0_10px_2px_rgba(45,212,196,0.6)]" />
                Software studio, Philippines — working internationally
              </span>
            </motion.div>

            <motion.h1
              variants={item}
              className="mt-7 font-display text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.02] tracking-tightest text-text"
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

          {/* The work as the hero's centerpiece. A studio's most convincing
              asset is what it has shipped, not an illustration of a feature
              that doesn't exist yet — so instead of a product screenshot (the
              old hero's fake dashboard) or a stock gradient blob, the six
              real clients are set as the dominant visual: large type, plain
              facts, no logos to fabricate. It answers "is this real?" in the
              same five seconds as the headline. */}
          <motion.ul
            variants={container}
            initial="hidden"
            animate="show"
            className="lg:col-span-6"
            aria-label="Selected client work"
          >
            {WORK.map((w) => (
              <motion.li
                key={w.name}
                variants={item}
                className="flex items-baseline gap-4 border-t border-line py-5 first:border-t-0 md:gap-6"
              >
                <span className="w-[104px] shrink-0 font-mono text-[11px] uppercase leading-5 tracking-[0.16em] text-text-dim">
                  {w.sector}
                </span>
                <div>
                  <p className="font-display text-xl font-bold leading-tight tracking-tight text-text md:text-2xl">
                    {w.name}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-text-dim">{w.detail}</p>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>
    </section>
  );
}
