import React from 'react';
import { cn } from '../lib/utils';

// Zelarion wordmark: faceted X mark + gradient wordmark (gradient #9B99FE -> #2BC8B7)
export default function Logo({ className, showWord = true }) {
  return (
    <a
      href="#top"
      className={cn('group inline-flex items-center gap-2.5', className)}
      data-testid="brand-logo"
      aria-label="Zelarion home"
    >
      <img
        src="/assets/logo-mark-192.png"
        alt="Zelarion"
        width="30"
        height="30"
        className="h-[30px] w-[30px] shrink-0 object-contain transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-[8deg] group-hover:scale-105"
      />
      {showWord && (
        <span className="font-display text-[19px] font-bold tracking-tightest text-text">
          Zelarion
        </span>
      )}
    </a>
  );
}
