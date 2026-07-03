# Zelarion — Marketing Landing Page

## Original Problem Statement
Award-site-quality (Awwwards/editorial) marketing landing page for **Zelarion**, a modern
software testing & QA platform. Positioning: "confidence in every release." Dark-first,
premium motion (Lenis smooth scroll + GSAP ScrollTrigger + framer-motion + R3F), Aurora
hero background, cinematic scroll-expansion showcase, a travelling 3D "verification core",
metrics band, editorial features, pricing, founders (names only), FAQ, KaiboPH-style footer.

### Hard content rules (enforced)
- No revenue/ARR/"$1M"/growth targets anywhere.
- Founders = NAME ONLY + label Founder/Co-Founder.
- No vague language (TBA, TBD, coming soon, up to, as low as, starting from, ~, approximately, and more).
- Every figure a single committed number.

## Tech Stack (as implemented)
- React 18 (Create React App / react-scripts 5) on port 3000 — chosen over Next.js per user for env reliability.
- Tailwind CSS (design tokens), framer-motion, GSAP + ScrollTrigger, Lenis, three + @react-three/fiber + drei.
- Minimal FastAPI stub at /app/backend (only /api/health). No DB, no auth — pure frontend site.

## Brand tokens
aurora-teal #2DD4C4, aurora-cyan #06B6D4, aurora-indigo #6366F1, ink #05070A, surface #0B0F14,
line rgba(255,255,255,.08), text #E8EDF2, text-dim #8A97A6. Display: Satoshi (Fontshare); body: Inter.

## Sections implemented (in order)
Nav (dashed pill, Sign in + Book a demo) · Hero (CSS+video aurora, dashboard still) ·
ScrollExpandShowcase (cinematic expand) · Metrics band (12,400 / 99.98% / 90 sec / 38) ·
Features (3 editorial rows w/ bespoke visuals) · HowItWorks (4 steps) · Integrations (38, grouped) ·
Security · Pricing (Team $49 / Scale $89 / Enterprise $2,400 flat) · SocialProof (marquee + testimonial) ·
Founders (Vergel A. Bautista — Founder; Lara Aaliyah L. Quinto — Co-Founder) · FAQ · FinalCTA · Footer (GSAP wordmark reveal).
Travelling 3D core: faceted teal crystal, scroll-driven keyframes, fixed canvas behind content, docks near pricing.

## Assets
/assets/aurora.webm (hero bg video, CSS aurora fallback), /assets/dashboard.png (product still),
/assets/founder-vergel.png, /assets/cofounder-lara.png, /assets/logo-mark.png. Wordmark = inline SVG.

## Status (2026-07-03)
- MVP built, compiles clean, full-section QA passed (iteration_1: 100%).
- P1 done: "Book a demo" modal wired to all 4 CTAs (nav/hero/pricing/final), POSTs to `/api/demo` and persists to MongoDB; success + validation states. Real partner logos (GitHub, GitLab, Vercel, Linear, Stripe, Shopify, Datadog, Sentry, Notion via Simple Icons CDN). Logo mark swapped to provided image. All verified (iteration_2: backend 7/7, frontend 100%).
- Backend regression suite: /app/backend/tests/test_demo_api.py

## Backlog / Next
- P2: Optionally integrate a true calendar (Calendly/Google Calendar) if real scheduling is needed (currently captures requests to DB).
- P2: Surface server validation detail in modal error UI; add index on demo_requests.
- P2: Compress the 17MB aurora.webm (or add a poster) to trim hero load weight.
