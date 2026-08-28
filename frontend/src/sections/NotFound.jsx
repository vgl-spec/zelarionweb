import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button, buttonVariants } from '../components/ui/button';

// Left visual panel, built entirely from CSS -- no hotlinked image, so the
// 404 page has no external runtime dependency. Layers a radial aurora glow,
// a faint grid, and an oversized watermark numeral in the site's own
// palette, matching the aurora-teal/cyan/indigo language used elsewhere.
function VisualPanel() {
  return (
    <div
      className="relative h-64 overflow-hidden border-b border-border bg-ink lg:h-auto lg:border-b-0 lg:border-r"
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 28% 25%, rgba(45,212,196,0.32), transparent 55%), ' +
            'radial-gradient(circle at 78% 78%, rgba(99,102,241,0.28), transparent 55%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), ' +
            'linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <span className="absolute inset-0 flex select-none items-center justify-center font-display text-[9rem] font-bold leading-none text-white/[0.05] sm:text-[12rem] lg:text-[14rem]">
        404
      </span>
    </div>
  );
}

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="grid min-h-screen grid-cols-1 bg-background text-foreground lg:grid-cols-2">
      <VisualPanel />

      <div className="relative flex items-center justify-center overflow-hidden px-6 py-20 sm:px-12">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(255,255,255,0.5) 0, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 40px), ' +
              'repeating-linear-gradient(-45deg, rgba(255,255,255,0.5) 0, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 40px)',
          }}
        />

        <div className="relative max-w-md">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Error 404</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight text-foreground lg:text-6xl xl:text-7xl">
            Page not Found
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            The page you're looking for doesn't exist, moved, or the link is out of date. Let's get you back
            on track.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/" className={buttonVariants({ variant: 'solid', size: 'lg' })}>
              Back home
            </Link>
            <Button variant="outline" size="lg" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Go back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
