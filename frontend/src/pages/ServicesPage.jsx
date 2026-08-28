import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import ServicesSection from '../sections/ServicesSection';
import ProcessSection from '../sections/ProcessSection';
import Reveal, { Eyebrow } from '../components/Reveal';
import { buttonVariants } from '../components/ui/button';

// Route-level page for /services. Renders inside the app shell (header/footer
// already provided by SiteShell in App.js), so this owns only the page's own
// content: an intro, the two section components, and a closing CTA.
export default function ServicesPage() {
  return (
    <>
      <section className="relative overflow-hidden pt-40 pb-20 md:pt-48 md:pb-28">
        <div className="mx-auto max-w-content px-6">
          <Reveal className="max-w-2xl">
            <Eyebrow>Services</Eyebrow>
            <h1 className="mt-6 font-display text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.02] tracking-tightest text-text">
              Production web systems, built for how your business runs.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-text-dim">
              Zelarion is a software studio based in the Philippines, working
              with clients internationally. Below is what we build and how an
              engagement actually runs — grounded in systems we've shipped for
              a law firm, industrial suppliers, and member-based
              organisations.
            </p>
          </Reveal>
        </div>
      </section>

      <ServicesSection />
      <ProcessSection />

      <section className="relative border-t border-line py-28 md:py-40" data-testid="services-page-cta">
        <div className="mx-auto max-w-content px-6">
          <Reveal className="flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
            <h2 className="max-w-xl font-display text-[clamp(1.75rem,3.5vw,2.75rem)] font-bold leading-tight tracking-tightest text-text">
              Have a system in mind? Let's talk about what it needs to do.
            </h2>
            <Link
              to="/contact"
              className={buttonVariants({ variant: 'solid', size: 'lg' })}
            >
              Start a project
              <ArrowUpRight size={18} strokeWidth={2.2} />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
