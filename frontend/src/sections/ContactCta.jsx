import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import Reveal, { Eyebrow } from '../components/Reveal';

/**
 * Closing call to action on the home page.
 *
 * Previously a full-viewport panel over a WebGPU "cursor trail" canvas. That canvas is
 * gone: it read as a toy on a page selling engineering work, it cost a GPU context and a
 * lazy chunk for decoration, and it left the section a self-styled island with its own
 * injected CSS. This is an ordinary section built from the same tokens as every other one.
 *
 * The headline is the link, and every cue that says so is visible at rest rather than on
 * hover: the arrow badge, the rule beneath it, and the pointer cursor. Hover-only
 * affordances do not exist on a touch screen, where this was previously just large text.
 */
export default function ContactCta() {
  return (
    <section
      id="contact"
      className="relative border-t border-line py-section"
      data-testid="contact-cta-section"
    >
      <div className="mx-auto max-w-content px-6">
        <Reveal>
          <Eyebrow>Start here</Eyebrow>
        </Reveal>

        <Reveal delay={0.08}>
          <Link
            to="/contact"
            className="group mt-8 block max-w-4xl rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-teal focus-visible:ring-offset-4 focus-visible:ring-offset-ink"
          >
            {/* The badge is inline inside the text, not a flex sibling: at this size the
                headline wraps, and as a sibling the badge dropped to a line of its own and
                read as a stray circle. Sized in `em` so it tracks the type at every
                breakpoint instead of needing its own set of size steps. */}
            <span className="font-display text-[clamp(2.25rem,7vw,5.5rem)] font-bold leading-[1.05] tracking-tightest text-text transition-colors duration-300 ease-expensive group-hover:text-aurora-teal">
              Got something to make?
              <span
                aria-hidden="true"
                className="ml-[0.25em] inline-grid h-[0.78em] w-[0.78em] translate-y-[0.04em] place-items-center rounded-full border border-aurora-teal/40 bg-aurora-teal/10 align-baseline text-aurora-teal transition-all duration-300 ease-expensive group-hover:border-aurora-teal group-hover:bg-aurora-teal group-hover:text-ink"
              >
                <ArrowUpRight className="h-[0.42em] w-[0.42em] transition-transform duration-300 ease-expensive group-hover:-translate-y-[0.03em] group-hover:translate-x-[0.03em]" />
              </span>
            </span>

            {/* Visible at rest at a third width so the headline reads as a link on a touch
                screen, then runs the full width on hover or keyboard focus. scaleX from a
                left origin composites; animating width would lay out every frame. */}
            <span
              aria-hidden="true"
              data-testid="contact-cta-rule"
              className="mt-6 block h-px w-full origin-left scale-x-[0.33] bg-aurora-teal transition-transform duration-500 ease-expensive group-hover:scale-x-100 group-focus-visible:scale-x-100"
            />
          </Link>
        </Reveal>

        <Reveal delay={0.16}>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-text-dim">
            Tell us what you are trying to run better. We will tell you what it takes to
            build it, and what it will cost, before anyone commits to anything.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
