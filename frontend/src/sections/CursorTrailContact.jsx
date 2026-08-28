import React, { useState, Suspense, lazy } from 'react';
// Imported from 'shaders/core' rather than 'shaders/react': this is the only shader-adjacent
// reference kept eager in this file, and 'shaders/core' avoids statically pulling in the
// ~190-component react barrel (that lives solely in the lazy-loaded CursorTrailCanvas below).
import { isWebGPUSupported } from 'shaders/core';

// Lazy: this is the only reference to the shaders-backed canvas, so its module (and the
// 34MB-source `shaders` library it imports) is only fetched when webgpuSupported is true
// below -- never bundled into the initial chunk, never requested for browsers that can't
// use it.
const CursorTrailCanvas = lazy(() => import('./CursorTrailCanvas'));

// Scoped styles for the reveal choreography and the 640px breakpoint. Injected via
// dangerouslySetInnerHTML (not global CSS) so this section stays self-contained and
// never touches src/index.css, which another builder owns.
const STYLES = `
.cursor-trail-contact .reveal {
  opacity: 0;
  transform: translateY(14px);
  animation: ctc-reveal 1.1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: var(--reveal-delay, 0s);
}
@keyframes ctc-reveal {
  to { opacity: 1; transform: none; }
}
/* Reduced-motion: the static (non-animated) state must be the VISIBLE one. Disabling
   only the animation while leaving opacity:0 as the base rule would hide the whole
   section for reduced-motion users -- so this rule wins the cascade and both clears
   the animation and forces the visible end-state directly. */
@media (prefers-reduced-motion: reduce) {
  .cursor-trail-contact .reveal {
    animation: none;
    opacity: 1;
    transform: none;
  }
}

.cursor-trail-contact .ctc-heading { font-size: 1.5rem; }
.cursor-trail-contact .ctc-footer { padding: 0 1.5rem 2.25rem; }
.cursor-trail-contact .ctc-hint { display: none; }

@media (min-width: 640px) {
  .cursor-trail-contact .ctc-heading { font-size: 1.875rem; }
  .cursor-trail-contact .ctc-footer { padding: 0 3rem 2.25rem; }
  .cursor-trail-contact .ctc-hint { display: block; }
}

.cursor-trail-contact .ctc-cta:hover { color: rgba(255, 255, 255, 0.85); }
/* Base state lives here, not inline: an inline transform property outranks this :hover rule and
   the underline would never grow. scaleX from a centre origin rather than animating width --
   identical centre-out growth, but it composites instead of laying out every frame. */
.cursor-trail-contact .ctc-underline {
  display: block;
  margin: 0.5rem auto 0;
  height: 3px;
  width: 100%;
  transform: scaleX(0);
  transform-origin: center;
  background: rgba(255, 255, 255, 0.7);
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.cursor-trail-contact .ctc-cta:hover .ctc-underline,
.cursor-trail-contact .ctc-cta:focus-visible .ctc-underline { transform: scaleX(1); }
.cursor-trail-contact .ctc-socials a:hover { color: #fff; }
`;

const DEFAULT_SOCIALS = [
  { label: 'Instagram', href: '#' },
  { label: 'Are.na', href: '#' },
  { label: 'GitHub', href: '#' },
];

/**
 * Full-viewport contact section. The `shaders`-backed "cursor trail" background (see
 * CursorTrailCanvas) is code-split behind React.lazy: this content layer -- heading,
 * CTA, footer -- stays eager and fully interactive whether or not that canvas ever
 * loads, since WebGPU support (and thus the lazy import) is gated by `showShader`.
 */
export default function CursorTrailContact({
  contactHref = '/contact',
  heading = 'Got something to make?',
  socials = DEFAULT_SOCIALS,
}) {
  // isWebGPUSupported() is a synchronous, SSR-safe capability check (see
  // node_modules/shaders/dist/core/gpu/support.d.ts) -- it does not guarantee a
  // device can actually be created, only that the API exists at all, so it's cheap
  // to call during render to decide whether to mount the canvas.
  const [webgpuSupported] = useState(() => isWebGPUSupported());
  // Second-line defense: even when the API exists, adapter/device creation can still
  // fail (blocklisted driver, out of memory, etc). Shader's onUnavailable fires at
  // most once in that case -- fold the canvas away so we're never left with a dead,
  // permanently-transparent canvas element sitting in the layout.
  const [shaderUnavailable, setShaderUnavailable] = useState(false);

  const showShader = webgpuSupported && !shaderUnavailable;

  return (
    <main
      className="cursor-trail-contact"
      style={{
        position: 'relative',
        isolation: 'isolate',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
        overflow: 'hidden',
        background: '#070708',
        color: '#fff',
        fontFamily: "'Satoshi', sans-serif",
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {showShader && (
        // Fallback is null: the <main> wrapper already paints #070708 with the CSS
        // gradient below, so a not-yet-loaded canvas is invisible rather than a gap.
        <Suspense fallback={null}>
          <CursorTrailCanvas onUnavailable={() => setShaderUnavailable(true)} />
        </Suspense>
      )}

      <section
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 1.5rem',
          textAlign: 'center',
        }}
      >
        <h2
          className="reveal ctc-heading"
          style={{
            '--reveal-delay': '0.1s',
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.7)',
          }}
        >
          {heading}
        </h2>

        <a
          href={contactHref}
          className="reveal ctc-cta"
          style={{
            '--reveal-delay': '0.25s',
            display: 'inline-block',
            marginTop: '1.25rem',
            maxWidth: '100%',
            overflowWrap: 'break-word',
            fontSize: 'clamp(2.2rem, 7vw, 6rem)',
            lineHeight: 1.05,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#fff',
            transition: 'color 0.3s ease',
          }}
        >
          Contact us
          <span className="ctc-underline" />
        </a>
      </section>

      <footer
        className="reveal ctc-footer"
        style={{
          '--reveal-delay': '0.45s',
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          fontFamily: "'Geist Mono', monospace",
          fontSize: '0.75rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(255, 255, 255, 0.4)',
        }}
      >
        <div className="ctc-socials" style={{ display: 'flex', gap: '1.75rem' }}>
          {socials.map((social) => (
            <a
              key={social.label}
              href={social.href}
              style={{ color: 'inherit', transition: 'color 0.3s ease' }}
            >
              {social.label}
            </a>
          ))}
        </div>
        <p className="ctc-hint" style={{ margin: 0 }}>
          ( move your cursor )
        </p>
      </footer>
    </main>
  );
}
