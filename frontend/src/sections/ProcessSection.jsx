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
    title: 'Understand the business',
    description:
      'We learn what the business does, who will use the system day to day, and what "done" actually means for them — before any design or code.',
  },
  {
    icon: PenTool,
    title: 'Design and build it in the open',
    description:
      "The client sees it take shape as it's built, not a black box for months. Changes happen while they're still cheap to make.",
  },
  {
    icon: Rocket,
    title: 'Launch on your infrastructure',
    description:
      'The site or system goes live under your own domain, checked against how it will actually be used — not a staged demo environment.',
  },
  {
    icon: MessagesSquare,
    title: 'Stay reachable after launch',
    description:
      "We stay on for fixes and changes as the business's needs shift, once real people are using the system every day.",
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

        <ol className="mt-20 grid grid-cols-1 gap-x-10 gap-y-12 md:grid-cols-2">
          {STEPS.map((s, i) => (
            <Reveal
              key={s.title}
              delay={(i % 2) * 0.08}
              as="li"
              className="flex gap-5"
            >
              <span className="tnum flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-white/[0.03] text-sm text-text-dim">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <div className="flex items-center gap-2.5">
                  <s.icon size={18} className="text-aurora-teal" strokeWidth={1.8} />
                  <h3 className="font-display text-lg font-bold tracking-tight text-text">
                    {s.title}
                  </h3>
                </div>
                <p className="mt-2.5 text-[15px] leading-relaxed text-text-dim">
                  {s.description}
                </p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
