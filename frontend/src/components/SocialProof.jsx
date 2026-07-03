import React from 'react';
import Reveal from './Reveal';

// Real brand marks via Simple Icons CDN (monochrome white for the dark strip).
const LOGOS = [
  { slug: 'github', name: 'GitHub' },
  { slug: 'gitlab', name: 'GitLab' },
  { slug: 'vercel', name: 'Vercel' },
  { slug: 'linear', name: 'Linear' },
  { slug: 'stripe', name: 'Stripe' },
  { slug: 'shopify', name: 'Shopify' },
  { slug: 'datadog', name: 'Datadog' },
  { slug: 'sentry', name: 'Sentry' },
  { slug: 'notion', name: 'Notion' },
];

export default function SocialProof() {
  const strip = [...LOGOS, ...LOGOS];
  return (
    <section className="relative overflow-hidden py-24 md:py-32" data-testid="social-proof-section">
      <div className="mx-auto max-w-content px-6">
        <Reveal>
          <p className="text-center text-sm uppercase tracking-[0.2em] text-text-dim">
            Trusted by engineering teams that ship daily.
          </p>
        </Reveal>
      </div>

      <div className="relative mt-14 flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
        <div className="flex shrink-0 animate-marquee items-center gap-16 pr-16">
          {strip.map((l, i) => (
            <img
              key={i}
              src={`https://cdn.simpleicons.org/${l.slug}/E8EDF2`}
              alt={l.name}
              width="112"
              height="28"
              loading="lazy"
              className="h-7 w-auto opacity-45 grayscale transition-[opacity,filter] duration-300 hover:opacity-90 hover:grayscale-0"
            />
          ))}
        </div>
      </div>

      <div className="mx-auto mt-24 max-w-content px-6">
        <Reveal className="mx-auto max-w-3xl text-center">
          <blockquote className="font-display text-[clamp(1.5rem,3.5vw,2.5rem)] font-medium leading-[1.25] tracking-tight text-text">
            "Our merge queue went from anxious to boring. Zelarion returns a verdict
            before I finish reading the diff."
          </blockquote>
          <figcaption className="mt-8 text-sm text-text-dim">
            — Marcus Devlin, Staff Engineer
          </figcaption>
        </Reveal>
      </div>
    </section>
  );
}
