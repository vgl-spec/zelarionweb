import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';
import { Button } from './ui/button';
import { useDemo } from './DemoModal';

const NAV = [
  { label: 'Platform', href: '#platform' },
  { label: 'Solutions', href: '#solutions' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Company', href: '#company' },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { openDemo } = useDemo();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
      data-testid="site-nav"
    >
      <nav
        className={`flex w-full max-w-content items-center justify-between rounded-full border border-dashed px-3 py-2.5 pl-5 transition-[background-color,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          scrolled
            ? 'border-white/15 bg-ink/70 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl'
            : 'border-white/10 bg-white/[0.02] backdrop-blur-md'
        }`}
      >
        <Logo />

        <ul className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                data-testid={`nav-${item.label.toLowerCase()}`}
                className="rounded-full px-4 py-2 text-sm text-text-dim transition-colors duration-300 hover:text-text"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="outline" size="sm" data-testid="nav-signin">
            Sign in
          </Button>
          <Button variant="solid" size="sm" data-testid="nav-book-demo" onClick={openDemo}>
            Book a demo
          </Button>
        </div>

        <button
          className="flex h-9 w-9 items-center justify-center rounded-full text-text md:hidden"
          onClick={() => setOpen((v) => !v)}
          data-testid="nav-mobile-toggle"
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute inset-x-4 top-[76px] rounded-2xl border border-line bg-ink/95 p-4 backdrop-blur-xl md:hidden"
          data-testid="nav-mobile-menu"
        >
          <div className="flex flex-col gap-1">
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-text-dim transition-colors hover:bg-white/5 hover:text-text"
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="outline" size="md">
              Sign in
            </Button>
            <Button
              variant="solid"
              size="md"
              onClick={() => {
                setOpen(false);
                openDemo();
              }}
            >
              Book a demo
            </Button>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
