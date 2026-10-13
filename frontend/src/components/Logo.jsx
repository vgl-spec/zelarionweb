import React from 'react';
import { cn } from '../lib/utils';

// Zelarion lockup: the faceted Z with code brackets (brand mark since October 2026) and the wordmark.
export default function Logo({ className, showWord = true }) {
  return (
    <a
      href="#top"
      className={cn('group inline-flex min-h-[44px] items-center gap-2.5 py-1.5', className)}
      data-testid="brand-logo"
      aria-label="Zelarion home"
    >
      <img
        src="/assets/logo-mark-192.png"
        alt="Zelarion"
        width="34"
        height="34"
        className="h-[34px] w-[34px] shrink-0 object-contain transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-[8deg] group-hover:scale-105"
      />
      {showWord && (
        <span className="font-display text-[19px] font-bold tracking-tightest text-text">
          Zelarion
        </span>
      )}
    </a>
  );
}
