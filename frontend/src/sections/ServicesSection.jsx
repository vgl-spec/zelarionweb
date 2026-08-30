import React from 'react';
import { Globe, ShoppingCart, Boxes, LifeBuoy } from 'lucide-react';
import Reveal, { Eyebrow } from '../components/Reveal';
import { cn } from '../lib/utils';

// Four groupings, each traceable to the real portfolio (see the source
// comment on each entry). Written as outcomes for the client, not a
// technology list — a business owner reading this should recognise their
// own situation, not have to translate a stack name into a benefit.
const SERVICES = [
  {
    id: 'websites',
    icon: Globe,
    image: '/assets/photos/service-websites.webp',
    // Alt text describes the photograph, not a claim: these are generic stills, not
    // pictures of a client's system, and the copy beside them is where the claims live.
    imageAlt: 'A phone held over a wooden desk, its dark screen reflecting a window',
    title: 'Websites that make the case for you',
    description:
      "For a business or a professional practice, the website is often the first real interaction a client has with you. We build sites that state clearly what the business does and make it easy to get in touch. It's the kind of site a nine-practice-area law firm or an industrial supplier can point a new client to with confidence.",
  },
  {
    id: 'commerce',
    icon: ShoppingCart,
    image: '/assets/photos/service-commerce.webp',
    imageAlt: 'Plain cardboard boxes stacked on a wooden pallet against a bare wall',
    title: 'Commerce and distribution systems',
    description:
      "For businesses that sell physical goods, from packaging materials to industrial supplies to retail products, we build the systems that take an order from browse to fulfilment. The business stops running its catalogue and stock out of spreadsheets and group chats.",
  },
  {
    id: 'internal-platforms',
    icon: Boxes,
    image: '/assets/photos/service-internal-platforms.webp',
    imageAlt:
      'Someone working at a desktop monitor, seen from behind, a stack of paper in the foreground',
    title: 'Internal platforms and member systems',
    description:
      "Some of what a business needs never faces the public: inventory tracking, procurement workflows, or a system for managing a network of members. We've built these for a health, wealth and wellness organisation and for a network platform built around its members. Software that runs the operation, not just the storefront.",
  },
  {
    id: 'support',
    icon: LifeBuoy,
    image: '/assets/photos/service-support.webp',
    imageAlt: 'Two people sitting side by side at one desk, seen from behind',
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

        <div className="mt-20">
          {SERVICES.map((s, i) => (
            <Reveal
              key={s.id}
              id={s.id}
              delay={(i % 2) * 0.06}
              // scroll-mt clears the 64px sticky header when the browser jumps
              // to this anchor directly on load, before ScrollToHash can run.
              className={cn(
                'scroll-mt-24 flex flex-col gap-6 border-t border-line py-12 first:border-t-0 md:flex-row md:items-center md:gap-12',
                // Sides alternate so four rows read as a rhythm rather than a list. The
                // DOM order never changes, so the image still follows its own heading for
                // a screen reader and for anyone tabbing through.
                i % 2 === 1 && 'md:flex-row-reverse'
              )}
            >
              {/* width/height and a fixed aspect ratio are both declared: the box is
                  reserved before the file arrives, so a lazily loaded image cannot shift
                  the four rows beneath it as it pops in. */}
              <img
                src={s.image}
                alt={s.imageAlt}
                width="1000"
                height="1000"
                loading="lazy"
                decoding="async"
                // Same reasoning as the process cards: a full-width square is a whole
                // phone screen of photograph before the words it belongs to.
                className="aspect-[16/10] w-full shrink-0 rounded-xl border border-line object-cover md:aspect-square md:w-56 lg:w-64"
              />

              <div className="max-w-2xl">
                <div className="flex items-center gap-4">
                  <s.icon size={22} className="shrink-0 text-aurora-teal" strokeWidth={1.6} />
                  <h3 className="font-display text-xl font-bold leading-tight tracking-tight text-text">
                    {s.title}
                  </h3>
                </div>
                <p className="mt-4 text-[15px] leading-relaxed text-text-dim md:text-base">
                  {s.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
