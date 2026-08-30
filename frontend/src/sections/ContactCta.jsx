import React from 'react';
import { Link } from 'react-router-dom';
import Reveal, { Eyebrow } from '../components/Reveal';

/**
 * Closing call to action on the home page.
 *
 * Previously a full-viewport panel over a WebGPU "cursor trail" canvas. That canvas is
 * gone: it read as a toy on a page selling engineering work, it cost a GPU context and a
 * lazy chunk for decoration, and it left the section a self-styled island with its own
 * injected CSS. This is an ordinary section built from the same tokens as every other one.
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
            className="group mt-8 inline-block max-w-full font-display text-[clamp(2.5rem,9vw,7rem)] font-bold leading-[0.95] tracking-tightest text-text transition-colors duration-300 ease-expensive hover:text-aurora-teal focus-visible:outline-none focus-visible:text-aurora-teal"
          >
            Got something to make?
            {/* scaleX from a centre origin rather than an animated width: identical
                centre-out growth, but it composites instead of laying out every frame. */}
            <span
              aria-hidden="true"
              className="mt-4 block h-[3px] w-full origin-center scale-x-0 bg-aurora-teal transition-transform duration-500 ease-expensive group-hover:scale-x-100 group-focus-visible:scale-x-100"
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
