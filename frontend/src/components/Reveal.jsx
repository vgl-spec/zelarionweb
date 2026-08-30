import React from 'react';
import { motion } from 'framer-motion';

// Scroll-triggered reveal. Respects reduced motion via CSS media (framer honors it).
export default function Reveal({
  children,
  delay = 0,
  y = 28,
  className = '',
  as = 'div',
  once = true,
  ...rest
}) {
  const MotionTag = motion[as] || motion.div;
  return (
    <MotionTag
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-12% 0px -12% 0px' }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

export function Eyebrow({ children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-eyebrow font-medium uppercase text-text-dim ${className}`}
    >
      <span className="h-px w-6 bg-gradient-to-r from-aurora-teal to-transparent" />
      {children}
    </span>
  );
}
