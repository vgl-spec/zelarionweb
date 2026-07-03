import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Logo from './Logo';
import { prefersReducedMotion } from '../lib/utils';

gsap.registerPlugin(ScrollTrigger);

const COLUMNS = [
  { title: 'Platform', links: ['Deterministic runs', 'Flake detection', 'Integrations', 'Pricing'] },
  { title: 'Company', links: ['About', 'Founders', 'Careers', 'Status'] },
  { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'SOC 2'] },
];

const WORD = 'Zelarion';

export default function Footer() {
  const rootRef = useRef(null);
  const lettersRef = useRef([]);
  const colsRef = useRef([]);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from(colsRef.current, {
        yPercent: 40,
        opacity: 0,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top 82%',
          end: 'top 45%',
          scrub: 1,
        },
      });

      gsap.fromTo(
        lettersRef.current,
        { yPercent: 115 },
        {
          yPercent: 0,
          ease: 'power4.out',
          stagger: 0.06,
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top 70%',
            end: 'bottom bottom',
            scrub: 1.2,
          },
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer
      ref={rootRef}
      className="relative overflow-hidden border-t border-line pt-24"
      data-testid="site-footer"
    >
      <div className="mx-auto max-w-content px-6">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div ref={(el) => (colsRef.current[0] = el)} className="col-span-2 md:col-span-1">
            <Logo />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-text-dim">
              Confidence in every release. Ship with proof, not hope.
            </p>
          </div>

          {COLUMNS.map((col, i) => (
            <div key={col.title} ref={(el) => (colsRef.current[i + 1] = el)}>
              <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-text-dim">
                {col.title}
              </p>
              <ul className="mt-5 space-y-3">
                {col.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#top"
                      className="text-[15px] text-text/80 transition-colors duration-300 hover:text-text"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-20 flex flex-col gap-4 border-t border-line py-8 text-sm text-text-dim sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Zelarion. All rights reserved.</span>
          <span className="tnum">99.98% uptime · verdict in 90 seconds</span>
        </div>
      </div>

      {/* Oversized wordmark with staggered clip reveal */}
      <div className="relative select-none px-6 pb-6" aria-hidden="true">
        <div className="mx-auto flex max-w-content justify-center overflow-hidden md:justify-start">
          <div className="flex leading-[0.8]">
            {WORD.split('').map((ch, i) => (
              <span key={i} className="overflow-hidden">
                <span
                  ref={(el) => (lettersRef.current[i] = el)}
                  className="inline-block bg-[linear-gradient(180deg,#E8EDF2_30%,rgba(232,237,242,0.06))] bg-clip-text font-display text-[clamp(4rem,20vw,17rem)] font-bold tracking-tightest text-transparent"
                >
                  {ch}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
