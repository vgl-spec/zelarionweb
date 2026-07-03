import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, PlayCircle } from 'lucide-react';
import { Button } from './ui/button';
import { prefersReducedMotion } from '../lib/utils';
import { useDemo } from './DemoModal';

export default function Hero() {
  const dashRef = useRef(null);
  const { openDemo } = useDemo();

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const el = dashRef.current;
    if (!el) return;
    let raf;
    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const t = Math.max(0, Math.min(1, 1 - rect.top / vh));
      // subtle settle: image already carries perspective, so only micro-tilt + lift
      const rx = 6 - t * 6;
      const ty = 30 - t * 60;
      const sc = 0.97 + t * 0.03;
      el.style.transform = `perspective(1800px) rotateX(${rx}deg) translateY(${ty}px) scale(${sc})`;
    };
    const loop = () => {
      onScroll();
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.09, delayChildren: 0.35 } },
  };
  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <section
      id="top"
      className="relative overflow-hidden pt-40 md:pt-48"
      data-testid="hero-section"
    >
      {/* Aurora background — full-bleed, fixed to hero viewport, behind text, masked into ink */}
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

      <div className="relative z-10 mx-auto max-w-content px-6">
        <motion.div variants={container} initial="hidden" animate="show" className="max-w-4xl">
          <motion.div variants={item}>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.03] px-4 py-1.5 text-[13px] text-text-dim backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-aurora-teal shadow-[0_0_10px_2px_rgba(45,212,196,0.6)]" />
              Software testing & QA, reimagined
            </span>
          </motion.div>

          <motion.h1
            variants={item}
            className="mt-7 font-display text-[clamp(2.75rem,7vw,6rem)] font-bold leading-[0.95] tracking-tightest text-text"
          >
            Ship with proof,
            <br />
            not <span className="text-gradient">hope.</span>
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-7 max-w-xl text-lg leading-relaxed text-text-dim"
          >
            Zelarion runs your entire test suite on every commit and returns a
            pass/fail verdict in <span className="tnum text-text">90 seconds</span>.
          </motion.p>

          <motion.div variants={item} className="mt-9 flex flex-wrap items-center gap-3">
            <Button variant="solid" size="lg" data-testid="hero-book-demo" onClick={openDemo}>
              Book a demo
              <ArrowUpRight size={18} strokeWidth={2.2} />
            </Button>
            <Button variant="outline" size="lg" data-testid="hero-live-run">
              <PlayCircle size={18} />
              See a live run
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* 3D-perspective dashboard still */}
      <div className="relative z-10 mx-auto mt-20 max-w-content px-6 pb-24 md:mt-28 md:pb-40">
        <div
          className="[transform-style:preserve-3d]"
          style={{ perspective: '1600px' }}
        >
          <motion.div
            ref={dashRef}
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
            className="relative mx-auto w-full max-w-5xl will-change-transform"
            style={{
              transform: 'perspective(1800px) rotateX(6deg) translateY(30px) scale(0.97)',
            }}
          >
            <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-[radial-gradient(60%_60%_at_50%_40%,rgba(6,182,212,0.28),transparent_70%)] blur-2xl" />
            <div className="overflow-hidden rounded-2xl border border-white/10 shadow-[0_60px_120px_-40px_rgba(0,0,0,0.9)]">
              <img
                src="/assets/dashboard.png"
                alt="Zelarion dashboard showing a passed pipeline verdict with a 90 second run time and flake detection"
                className="block w-full"
                width="1920"
                height="1920"
                loading="eager"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
