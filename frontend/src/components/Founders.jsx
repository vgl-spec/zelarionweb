import React from 'react';
import Reveal, { Eyebrow } from './Reveal';

const PEOPLE = [
  { name: 'Vergel A. Bautista', label: 'Founder', img: '/assets/founder-vergel.png' },
  { name: 'Lara Aaliyah L. Quinto', label: 'Co-Founder', img: '/assets/cofounder-lara.png' },
];

export default function Founders() {
  return (
    <section className="relative border-t border-line py-28 md:py-40" data-testid="founders-section">
      <div className="mx-auto max-w-content px-6">
        <Reveal className="max-w-2xl">
          <Eyebrow>The people behind Zelarion</Eyebrow>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-16 lg:max-w-3xl">
          {PEOPLE.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.12} y={36} data-testid={`founder-${i}`}>
              <div className="group relative overflow-hidden rounded-2xl border border-line bg-surface/40">
                <img
                  src={p.img}
                  alt={p.name}
                  className="aspect-[4/5] w-full object-cover grayscale transition-[filter,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:grayscale-0 group-hover:scale-[1.02]"
                  loading="lazy"
                  width="800"
                  height="1000"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink to-transparent" />
              </div>
              <h3 className="mt-6 font-display text-xl font-bold tracking-tight text-text">
                {p.name}
              </h3>
              <p className="mt-1 text-sm text-text-dim">{p.label}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
