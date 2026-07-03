import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import Reveal from './Reveal';
import { Button } from './ui/button';
import { useDemo } from './DemoModal';

export default function FinalCTA() {
  const { openDemo } = useDemo();
  return (
    <section className="relative overflow-hidden py-32 md:py-48" data-testid="final-cta-section">
      {/* Aurora echo — low amplitude */}
      <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
        <div className="aurora-css absolute inset-0 opacity-40" aria-hidden="true" />
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-screen"
          src="/assets/aurora.webm"
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-[radial-gradient(90%_90%_at_50%_50%,transparent_20%,#05070A_78%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-content px-6 text-center">
        <Reveal>
          <h2 className="mx-auto max-w-4xl font-display text-[clamp(2.5rem,7vw,6rem)] font-bold leading-[0.98] tracking-tightest text-text">
            Stop guessing.
            <br />
            Start <span className="text-gradient">verifying.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.12} className="mt-10 flex justify-center">
          <Button variant="solid" size="lg" data-testid="final-book-demo" onClick={openDemo}>
            Book a demo
            <ArrowUpRight size={18} strokeWidth={2.2} />
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
