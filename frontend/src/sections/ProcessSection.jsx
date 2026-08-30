import React from 'react';
import { Search, PenTool, Rocket, MessagesSquare } from 'lucide-react';
import Reveal, { Eyebrow } from '../components/Reveal';

// Unlike most of the site, an engagement genuinely is a fixed sequence, so
// numbered steps are the honest representation here rather than a stylistic
// default. Four steps, kept to what a small studio actually does — no
// "discovery workshop" or "strategy sprint" filler.
const STEPS = [
  {
    icon: Search,
    image: '/assets/photos/process-1-morning.webp',
    imageAlt: 'A closed laptop alone on a desk in cold early morning light',
    title: 'Understand the business',
    description:
      'We learn what the business does, who will use the system day to day, and what "done" actually means for them. All before any design or code.',
  },
  {
    icon: PenTool,
    image: '/assets/photos/process-2-sketches.webp',
    imageAlt: 'Hand-drawn layout sketches spread across the same desk, one sheet on the floor',
    title: 'Design and build it in the open',
    description:
      "The client sees it take shape as it's built, not a black box for months. Changes happen while they're still cheap to make.",
  },
  {
    icon: Rocket,
    image: '/assets/photos/process-3-build.webp',
    imageAlt: 'The laptop open on the desk beside a mug and a notebook, screen angled away',
    title: 'Launch where it matters',
    description:
      'The site or system is prepared for its real operating environment and checked against how people will actually use it. Built for the work, not just the demo.',
  },
  {
    icon: MessagesSquare,
    image: '/assets/photos/process-4-shipped.webp',
    imageAlt: 'The same desk cleared, late afternoon light raking across the grain',
    title: 'Plan what comes next',
    description:
      "Once people are using the system, the next priorities become clearer. Post-launch support and improvements can be shaped around the business's evolving needs.",
  },
];

export default function ProcessSection() {
  return (
    <section
      id="process"
      className="relative border-t border-line py-28 md:py-40"
      data-testid="process-section"
    >
      <div className="mx-auto max-w-content px-6">
        <Reveal className="max-w-2xl">
          <Eyebrow>How an engagement runs</Eyebrow>
          <h2 className="mt-6 font-display text-[clamp(2rem,4.5vw,3.5rem)] font-bold leading-[1.02] tracking-tightest text-text">
            Four steps, start to finish.
          </h2>
        </Reveal>

        {/* Four columns on a wide screen rather than two rows. The photographs are the
            same desk at four points in a day, so standing them side by side is what makes
            the sequence legible; stacked two-by-two it reads as four unrelated stills. */}
        <ol className="mt-20 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal
              key={s.title}
              // 50ms apart: enough to read as a sequence left to right, short enough that
              // the last card is not still arriving after the eye has reached it.
              delay={i * 0.05}
              as="li"
            >
              <img
                src={s.image}
                alt={s.imageAlt}
                width="900"
                height="1350"
                loading="lazy"
                decoding="async"
                // Landscape on a phone, portrait from `sm` up. A 3:4 card is over half a
                // phone viewport, and four of them turn a supporting sequence into most of
                // the section's scroll length.
                className="aspect-[4/3] w-full rounded-xl border border-line object-cover sm:aspect-[3/4]"
              />

              <div className="mt-6 flex items-center gap-3">
                <span className="tnum flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-white/[0.03] text-[13px] text-text-dim">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <s.icon size={18} className="shrink-0 text-aurora-teal" strokeWidth={1.8} />
              </div>

              <h3 className="mt-4 font-display text-lg font-bold tracking-tight text-text">
                {s.title}
              </h3>
              <p className="mt-2.5 text-[15px] leading-relaxed text-text-dim">
                {s.description}
              </p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
