import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Mail, Phone, MapPin, ArrowUp } from 'lucide-react';
import { cn, prefersReducedMotion } from '../lib/utils';

// CRA has no SSR, so this guard never actually skips anything at runtime -- kept
// anyway because it costs nothing and documents that this registration is
// client-only, matching the ported original's intent.
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// -------------------------------------------------------------------------
// 1. ZELARION CONTENT (replaces KaiboPH's @/lib/site + @/lib/content)
// -------------------------------------------------------------------------
const SITE = {
  name: 'Zelarion',
  shortName: 'Zelarion',
  contact: {
    email: 'bautista.vergel.agripa@gmail.com',
    // Two forms on purpose: `phoneDial` is E.164 with no spaces or punctuation,
    // which is what a `tel:` href must carry for every dialer to parse it, while
    // `phone` is the grouped form a human reads. Keep them in sync.
    phone: '+63 994 332 8595',
    phoneDial: '+639943328595',
    addressShort: 'Philippines, working with clients internationally',
  },
};

// Dedicated routes exist for all of these (see App.js's ROUTES), so every pill points
// there directly instead of at a home-page hash anchor -- react-router does not scroll to
// a hash on navigation, so `/#work` etc. used to land on an arbitrary scroll position with
// no visible effect. Team was dropped: the /team route and its section no longer exist.
const MAIN_NAV = [
  { href: '/work', label: 'Solutions' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
];

const MARQUEE_WORDS = [
  'Product Design',
  'Engineering',
  'Brand Systems',
  'Motion Design',
  'Web Platforms',
  'Design Ops',
  'Rapid Prototyping',
  'Craft & Detail',
];

// -------------------------------------------------------------------------
// 2. THEME TOKENS + KEYFRAMES (self-contained -- immune to what other
//    builders do to tailwind.config.js or src/index.css, per file ownership
//    boundaries on this build). Zelarion's dark palette, scoped under
//    .cinematic-footer-wrapper so nothing here leaks or gets overridden.
// -------------------------------------------------------------------------
const STYLES = `
.cinematic-footer-wrapper {
  -webkit-font-smoothing: antialiased;

  --foreground: #E8EDF2;
  --background: #05070A;
  --surface: #0B0F14;
  --text-dim: #8A97A6;
  --brand: #2DD4C4;
  --secondary: #06B6D4;

  --pill-bg-1: color-mix(in oklch, var(--foreground) 3%, transparent);
  --pill-bg-2: color-mix(in oklch, var(--foreground) 1%, transparent);
  --pill-shadow: color-mix(in oklch, var(--background) 50%, transparent);
  --pill-highlight: color-mix(in oklch, var(--foreground) 10%, transparent);
  --pill-inset-shadow: color-mix(in oklch, var(--background) 80%, transparent);
  --pill-border: color-mix(in oklch, var(--foreground) 8%, transparent);

  --pill-bg-1-hover: color-mix(in oklch, var(--foreground) 8%, transparent);
  --pill-bg-2-hover: color-mix(in oklch, var(--foreground) 2%, transparent);
  --pill-border-hover: color-mix(in oklch, var(--foreground) 20%, transparent);
  --pill-shadow-hover: color-mix(in oklch, var(--background) 70%, transparent);
  --pill-highlight-hover: color-mix(in oklch, var(--foreground) 20%, transparent);

  background: var(--background);
  color: var(--foreground);
}

@keyframes footer-breathe {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
  100% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
}
@keyframes footer-scroll-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.animate-footer-breathe { animation: footer-breathe 8s ease-in-out infinite alternate; }
.animate-footer-scroll-marquee { animation: footer-scroll-marquee 40s linear infinite; }

.footer-bg-grid {
  background-size: 60px 60px;
  background-image:
    linear-gradient(to right, color-mix(in oklch, var(--foreground) 4%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in oklch, var(--foreground) 4%, transparent) 1px, transparent 1px);
  mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
}

.footer-aurora {
  background: radial-gradient(
    circle at 50% 50%,
    color-mix(in oklch, var(--brand) 22%, transparent) 0%,
    color-mix(in oklch, var(--secondary) 18%, transparent) 40%,
    transparent 70%
  );
}

.footer-glass-pill {
  background: linear-gradient(145deg, var(--pill-bg-1) 0%, var(--pill-bg-2) 100%);
  box-shadow:
      0 10px 30px -10px var(--pill-shadow),
      inset 0 1px 1px var(--pill-highlight),
      inset 0 -1px 2px var(--pill-inset-shadow);
  border: 1px solid var(--pill-border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  color: var(--foreground);
}
.footer-glass-pill:hover {
  background: linear-gradient(145deg, var(--pill-bg-1-hover) 0%, var(--pill-bg-2-hover) 100%);
  border-color: var(--pill-border-hover);
  box-shadow:
      0 20px 40px -10px var(--pill-shadow-hover),
      inset 0 1px 1px var(--pill-highlight-hover);
}
/* color-mix() is well supported in evergreen browsers, but a browser without it makes
   every var() above (background, box-shadow, border-color) invalid-at-computed-value --
   those properties just fall back to their initial value (no fill, no border, no
   shadow). Text stays readable either way since --foreground is a plain hex value, so
   this only costs the glass look, not legibility -- give it a flat fallback fill. */
@supports not (color: color-mix(in oklch, red 50%, blue)) {
  .footer-glass-pill {
    background: rgba(232, 237, 242, 0.04);
    border: 1px solid rgba(232, 237, 242, 0.08);
  }
  .footer-glass-pill:hover {
    background: rgba(232, 237, 242, 0.08);
    border-color: rgba(232, 237, 242, 0.2);
  }
}

.footer-giant-bg-text {
  font-size: 26vw;
  line-height: 0.75;
  font-weight: 900;
  letter-spacing: -0.05em;
  color: transparent;
  -webkit-text-stroke: 1px color-mix(in oklch, var(--foreground) 6%, transparent);
  background: linear-gradient(180deg, color-mix(in oklch, var(--foreground) 10%, transparent) 0%, transparent 60%);
  -webkit-background-clip: text;
  background-clip: text;
}

.footer-text-glow {
  background: linear-gradient(180deg, var(--foreground) 0%, color-mix(in oklch, var(--foreground) 45%, transparent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0px 0px 20px color-mix(in oklch, var(--brand) 25%, transparent));
}
/* Unlike the pill (decoration-only), this rule chains color-mix() *inside* a
   background-clip:text + text-fill-color:transparent trick. If color-mix() is
   unsupported the whole 'background' shorthand goes invalid, background-clip has
   nothing to clip, and text-fill-color:transparent would leave the heading fully
   invisible -- not just less pretty. Drop the clip trick entirely in that case and
   paint the heading as a plain, always-visible solid color instead. */
@supports not (color: color-mix(in oklch, red 50%, blue)) {
  .footer-text-glow {
    background: none;
    -webkit-background-clip: initial;
    background-clip: initial;
    -webkit-text-fill-color: var(--foreground);
    color: var(--foreground);
    filter: none;
  }
}

.cf-star-brand { color: color-mix(in oklch, var(--brand) 70%, transparent); }
.cf-star-dim { color: color-mix(in oklch, var(--text-dim) 40%, transparent); }
@supports not (color: color-mix(in oklch, red 50%, blue)) {
  .cf-star-brand { color: var(--brand); }
  .cf-star-dim { color: var(--text-dim); }
}

.cf-text-dim { color: var(--text-dim); }
.cf-text-dim:hover { color: var(--foreground); }
.cf-brand { color: var(--brand); }
.cf-border-dim { border-color: color-mix(in oklch, var(--foreground) 12%, transparent); }
@supports not (color: color-mix(in oklch, red 50%, blue)) {
  .cf-border-dim { border-color: rgba(232, 237, 242, 0.12); }
}
.cf-marquee-strip {
  background: color-mix(in oklch, var(--background) 60%, transparent);
  border-top: 1px solid color-mix(in oklch, var(--foreground) 8%, transparent);
  border-bottom: 1px solid color-mix(in oklch, var(--foreground) 8%, transparent);
}
@supports not (color: color-mix(in oklch, red 50%, blue)) {
  .cf-marquee-strip {
    background: rgba(5, 7, 10, 0.85);
    border-top: 1px solid rgba(232, 237, 242, 0.08);
    border-bottom: 1px solid rgba(232, 237, 242, 0.08);
  }
}

@media (prefers-reduced-motion: reduce) {
  .animate-footer-breathe,
  .animate-footer-scroll-marquee { animation: none !important; }
}
`;

// -------------------------------------------------------------------------
// 3. MAGNETIC BUTTON PRIMITIVE
// -------------------------------------------------------------------------
const MagneticButton = React.forwardRef(
  ({ className, children, as: Component = 'button', ...props }, forwardedRef) => {
    const localRef = useRef(null);

    useEffect(() => {
      if (typeof window === 'undefined') return;
      if (prefersReducedMotion()) return;
      const element = localRef.current;
      if (!element) return;

      // The magnetic tweens are created lazily inside the mousemove/mouseleave
      // handlers below, not synchronously in this effect body -- gsap.context()
      // only tracks tweens created during the synchronous execution of the callback
      // passed to it, so a context here would have nothing to revert. Kill by
      // target instead: gsap.killTweensOf(element) stops whatever tween is
      // mid-flight on this node at unmount, regardless of when it was created.
      const handleMouseMove = (e) => {
        const rect = element.getBoundingClientRect();
        const h = rect.width / 2;
        const w = rect.height / 2;
        const x = e.clientX - rect.left - h;
        const y = e.clientY - rect.top - w;
        gsap.to(element, {
          x: x * 0.4,
          y: y * 0.4,
          rotationX: -y * 0.15,
          rotationY: x * 0.15,
          scale: 1.05,
          ease: 'power2.out',
          duration: 0.4,
        });
      };
      const handleMouseLeave = () => {
        gsap.to(element, {
          x: 0,
          y: 0,
          rotationX: 0,
          rotationY: 0,
          scale: 1,
          ease: 'elastic.out(1, 0.3)',
          duration: 1.2,
        });
      };

      element.addEventListener('mousemove', handleMouseMove);
      element.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        element.removeEventListener('mousemove', handleMouseMove);
        element.removeEventListener('mouseleave', handleMouseLeave);
        gsap.killTweensOf(element);
      };
    }, []);

    // Merge the forwarded ref with the local ref this effect needs to attach
    // GSAP tweens and DOM listeners to the actual rendered element.
    const setRef = (node) => {
      localRef.current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    };

    return (
      <Component ref={setRef} className={cn('cursor-pointer', className)} {...props}>
        {children}
      </Component>
    );
  }
);
MagneticButton.displayName = 'MagneticButton';

const MarqueeItem = () => (
  <div className="flex items-center space-x-12 px-6">
    {MARQUEE_WORDS.map((w, i) => (
      <React.Fragment key={w}>
        <span>{w}</span>
        <span className={i % 2 === 0 ? 'cf-star-brand' : 'cf-star-dim'}>✦</span>
      </React.Fragment>
    ))}
  </div>
);

// -------------------------------------------------------------------------
// 4. MAIN COMPONENT
// -------------------------------------------------------------------------
export default function CinematicFooter() {
  const wrapperRef = useRef(null);
  const giantTextRef = useRef(null);
  const headingRef = useRef(null);
  const linksRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth < 1024) return; // Skip GSAP reveal on mobile viewports
    if (!wrapperRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        giantTextRef.current,
        { y: '10vh', scale: 0.8, opacity: 0 },
        {
          y: '0vh',
          scale: 1,
          opacity: 1,
          ease: 'power1.out',
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: 'top 80%',
            end: 'bottom bottom',
            scrub: 1,
          },
        }
      );

      gsap.fromTo(
        [headingRef.current, linksRef.current],
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: 'top 40%',
            end: 'bottom bottom',
            scrub: 1,
          },
        }
      );
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  // This app has real routes and page height varies between them, so a stale
  // ScrollTrigger from the previous page can leave scrub ranges pointing at the
  // wrong offsets. Recompute after client-side navigation once the new page has
  // settled (react-router's location.pathname stands in for Next's usePathname()).
  useEffect(() => {
    const id = setTimeout(() => ScrollTrigger.refresh(), 350);
    return () => clearTimeout(id);
  }, [location.pathname]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const year = new Date().getFullYear();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div
        ref={wrapperRef}
        // z-20 is load-bearing. <main> is `relative z-10`, and this wrapper is its next
        // sibling; without a z-index it computes to `auto` and main paints over the
        // lg:fixed footer, swallowing every hover and click on any page tall enough to
        // still be scrolling. The header is z-40, so 20 sits between the two.
        className="relative z-20 w-full overflow-hidden h-auto lg:h-screen lg:min-h-[640px] lg:[clip-path:polygon(0%_0,_100%_0%,_100%_100%,_0_100%)]"
        style={{ background: 'var(--background, #05070A)' }}
      >
        <footer className="cinematic-footer-wrapper flex w-full flex-col justify-between font-sans overflow-hidden relative h-auto py-16 gap-12 lg:fixed lg:bottom-0 lg:left-0 lg:h-screen lg:min-h-[640px] lg:py-0 lg:gap-0">
          {/* Ambient light & grid */}
          <div className="footer-aurora pointer-events-none absolute left-1/2 top-1/2 z-0 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 animate-footer-breathe rounded-[50%] blur-[80px]" />
          <div className="footer-bg-grid pointer-events-none absolute inset-0 z-0" />

          {/* Giant background wordmark */}
          <div
            ref={giantTextRef}
            className="footer-giant-bg-text pointer-events-none absolute -bottom-[4vh] left-1/2 z-0 -translate-x-1/2 select-none whitespace-nowrap"
          >
            ZELARION
          </div>

          {/* Marquee */}
          <div className="cf-marquee-strip absolute left-0 top-12 z-10 w-full -rotate-2 scale-110 overflow-hidden py-4 shadow-2xl backdrop-blur-md">
            <div className="cf-text-dim flex w-max animate-footer-scroll-marquee text-xs font-bold uppercase tracking-[0.3em] md:text-sm">
              <MarqueeItem />
              <MarqueeItem />
            </div>
          </div>

          {/* Center content */}
          <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 mt-28 mb-10 lg:mt-20 lg:mb-0">
            <h2
              ref={headingRef}
              className="footer-text-glow mb-10 text-center text-4xl font-black tracking-tighter md:text-7xl"
            >
              Where ambitious products get built.
            </h2>

            <div ref={linksRef} className="flex w-full flex-col items-center gap-6">
              {/* Primary CTAs */}
              <div className="flex w-full flex-wrap justify-center gap-4">
                <MagneticButton
                  as={Link}
                  to="/contact"
                  className="footer-glass-pill group flex items-center gap-3 rounded-full px-9 py-5 text-sm font-bold md:text-base"
                >
                  Contact Us
                  <ArrowRight className="cf-text-dim size-5 transition-colors group-hover:text-[var(--foreground)]" />
                </MagneticButton>

                <MagneticButton
                  as="a"
                  href={`mailto:${SITE.contact.email}`}
                  className="footer-glass-pill group flex items-center gap-3 rounded-full px-9 py-5 text-sm font-bold md:text-base"
                >
                  <Mail className="cf-text-dim size-5 transition-colors group-hover:text-[var(--foreground)]" />
                  Email Us
                </MagneticButton>

                <MagneticButton
                  as="a"
                  href={`tel:${SITE.contact.phoneDial}`}
                  aria-label={`Call Zelarion on ${SITE.contact.phone}`}
                  className="footer-glass-pill group flex items-center gap-3 rounded-full px-9 py-5 text-sm font-bold md:text-base"
                >
                  <Phone className="cf-text-dim size-5 transition-colors group-hover:text-[var(--foreground)]" />
                  Call Us
                </MagneticButton>

              </div>

              {/* Nav pills */}
              <nav className="mt-2 flex w-full flex-wrap justify-center gap-3 md:gap-4">
                {MAIN_NAV.map((item) => (
                  <MagneticButton
                    key={item.href}
                    as={Link}
                    to={item.href}
                    className="footer-glass-pill cf-text-dim rounded-full px-6 py-3 text-xs font-medium md:text-sm"
                  >
                    {item.label}
                  </MagneticButton>
                ))}
              </nav>

              {/* Contact line */}
              <div className="cf-text-dim mt-2 flex items-center gap-2 text-center text-xs">
                <MapPin className="cf-brand size-4 shrink-0" />
                {SITE.contact.addressShort}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="relative z-20 flex w-full flex-col items-center justify-between gap-6 px-6 pb-8 md:flex-row md:px-12">
            <div className="cf-text-dim order-2 text-[10px] font-semibold uppercase tracking-widest md:order-1 md:text-xs">
              &copy; {year} {SITE.name}. All rights reserved.
            </div>

            <div className="footer-glass-pill cf-border-dim order-1 flex cursor-default items-center gap-2 rounded-full border px-6 py-3 md:order-2">
              <span className="cf-text-dim text-[10px] font-bold uppercase tracking-widest md:text-xs">
                Software &amp; Design Studio
              </span>
              <span className="cf-brand ml-1 text-xs font-black tracking-normal md:text-sm">
                {SITE.shortName}
              </span>
            </div>

            <MagneticButton
              as="button"
              onClick={scrollToTop}
              aria-label="Back to top"
              className="footer-glass-pill cf-text-dim group order-3 flex size-12 items-center justify-center rounded-full"
            >
              <ArrowUp className="size-5 transition-transform duration-300 group-hover:-translate-y-1.5" />
            </MagneticButton>
          </div>
        </footer>
      </div>
    </>
  );
}
