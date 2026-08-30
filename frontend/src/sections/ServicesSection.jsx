import React from 'react';
import { Globe, ShoppingCart, Boxes, LifeBuoy } from 'lucide-react';
import Reveal, { Eyebrow } from '../components/Reveal';

// Four groupings, each traceable to the real portfolio (see the source
// comment on each entry). Written as outcomes for the client, not a
// technology list — a business owner reading this should recognise their
// own situation, not have to translate a stack name into a benefit.
const SERVICES = [
  {
    id: 'websites',
    icon: Globe,
    title: 'Websites that make the case for you',
    description:
      "For a business or a professional practice, the website is often the first real interaction a client has with you. We build sites that state clearly what the business does and make it easy to get in touch. It's the kind of site a nine-practice-area law firm or an industrial supplier can point a new client to with confidence.",
  },
  {
    id: 'commerce',
    icon: ShoppingCart,
    title: 'Commerce and distribution systems',
    description:
      "For businesses that sell physical goods, from packaging materials to industrial supplies to retail products, we build the systems that take an order from browse to fulfilment. The business stops running its catalogue and stock out of spreadsheets and group chats.",
  },
  {
    id: 'internal-platforms',
    icon: Boxes,
    title: 'Internal platforms and member systems',
    description:
      "Some of what a business needs never faces the public: inventory tracking, procurement workflows, or a system for managing a network of members. We've built these for a health, wealth and wellness organisation and for a network platform built around its members. Software that runs the operation, not just the storefront.",
  },
  {
    id: 'support',
    icon: LifeBuoy,
    title: 'Ongoing support after launch',
    description:
      "A system that ships is not a system that's finished. We stay on for fixes, changes as the business's needs shift, and the small adjustments that come up once real people are using it every day.",
  },
];

export default function ServicesSection() {
  return (
    <section id="services" className="relative py-28 md:py-40" data-testid="services-section">
      <div className="mx-auto max-w-content px-6">
        <Reveal className="max-w-2xl">
          <Eyebrow>What we build</Eyebrow>
          <h2 className="mt-6 font-display text-[clamp(2rem,4.5vw,3.5rem)] font-bold leading-[1.02] tracking-tightest text-text">
            Software built around how the business actually works.
          </h2>
        </Reveal>

        {/* A generic desk photograph, not a screenshot of a client build, which is why the
            alt text describes the scene rather than claiming a system. It sits here because
            this section is otherwise four blocks of prose with nothing to look at, and a
            dashboard on a laptop is the one image that reads as all four services at once.
            The scrim is what lets a brightly lit photo sit on a near-black page: without it
            the white wall glares against every other section. */}
        <Reveal delay={0.1} className="mt-14">
          <figure className="relative overflow-hidden rounded-2xl border border-line">
            <img
              src="/assets/heroBG.webp"
              alt="A laptop and phone on a desk, both showing the same dark analytics dashboard"
              width="1600"
              height="900"
              loading="lazy"
              decoding="async"
              // A 21:9 band, not the source's 16:9: the top of the frame is blank wall and
              // the bottom is floor, so cropping to the desk line puts the devices at the
              // size they need to read and keeps this a supporting image rather than one
              // that outweighs the four services beneath it.
              className="aspect-[21/9] w-full object-cover object-center"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent"
            />
          </figure>
        </Reveal>

        <div className="mt-20">
          {SERVICES.map((s, i) => (
            <Reveal
              key={s.id}
              id={s.id}
              delay={(i % 2) * 0.06}
              // scroll-mt clears the 64px sticky header when the browser jumps
              // to this anchor directly on load, before ScrollToHash can run.
              className="scroll-mt-24 flex flex-col gap-5 border-t border-line py-10 first:border-t-0 md:flex-row md:items-start md:gap-10"
            >
              <div className="flex shrink-0 items-center gap-4 md:w-64">
                <s.icon size={22} className="shrink-0 text-aurora-teal" strokeWidth={1.6} />
                <h3 className="font-display text-xl font-bold leading-tight tracking-tight text-text">
                  {s.title}
                </h3>
              </div>
              <p className="max-w-2xl text-[15px] leading-relaxed text-text-dim md:text-base">
                {s.description}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
