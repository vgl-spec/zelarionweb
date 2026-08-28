import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Layers, ArrowUpRight } from 'lucide-react';
import Logo from '../components/Logo';
import { Button, buttonVariants } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../components/ui/sheet';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/accordion';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from '../components/ui/navigation-menu';
import { cn } from '../lib/utils';

// Simple in-page anchors vs. real routes: Work/Team/FAQ live as sections on
// the home page, Contact is its own route. Keeping these as plain <a>/<Link>
// (not client-side scroll logic) means they also work correctly from any
// other route, including a hard refresh.
const PRIMARY_LINKS = [
  { label: 'Work', to: '/work' },
  { label: 'Team', to: '/team' },
  { label: 'FAQ', to: '/faq' },
];

const DESIGN_LINKS = [
  { label: 'Product Design', href: '/work' },
  { label: 'Brand Identity', href: '/work' },
  { label: 'Design Systems', href: '/work' },
  { label: 'Motion & Interaction', href: '/work' },
];

const ENGINEERING_LINKS = [
  { label: 'Frontend Engineering', href: '/work' },
  { label: 'Backend & APIs', href: '/work' },
  { label: 'Cloud & DevOps', href: '/work' },
  { label: 'QA & Testing', href: '/work' },
];

const SERVICE_PILLS = ['Web', 'Mobile', 'Brand'];

// Makes the "Services" mega-panel bleed edge-to-edge under the navbar
// instead of sitting in a small popover sized to the trigger. `static`
// strips the NavigationMenu root's own `position: relative`, so the
// viewport wrapper's `absolute` positioning escapes up to the next
// positioned ancestor -- the `sticky` <header> below -- making it the
// containing block for `inset-x-0`/`top-full` (full header width, flush
// under it) instead of being boxed in by the root's own narrow width.
// The wrapper div is targeted via `[&>.absolute]` (it is a literal,
// un-styled `<div className="absolute ...">` in navigation-menu.jsx) and
// the viewport itself via `[&_[data-slot=navigation-menu-viewport]]`,
// per the data-slot contract documented in that file.
const MEGA_MENU_ROOT_CLASSES = cn(
  'static',
  '[&>.absolute]:inset-x-0 [&>.absolute]:top-full [&>.absolute]:w-full',
  '[&_[data-slot=navigation-menu-viewport]]:left-0',
  '[&_[data-slot=navigation-menu-viewport]]:mt-0',
  '[&_[data-slot=navigation-menu-viewport]]:w-full',
  '[&_[data-slot=navigation-menu-viewport]]:max-w-none',
  '[&_[data-slot=navigation-menu-viewport]]:rounded-none',
  '[&_[data-slot=navigation-menu-viewport]]:border-t-0',
  '[&_[data-slot=navigation-menu-viewport]]:border-x-0',
  '[&_[data-slot=navigation-menu-viewport]]:border-b',
  '[&_[data-slot=navigation-menu-viewport]]:border-border',
  '[&_[data-slot=navigation-menu-viewport]]:bg-popover',
  '[&_[data-slot=navigation-menu-viewport]]:shadow-[0_24px_60px_-20px_rgba(0,0,0,0.65)]'
);

function MegaMenuLinkList({ heading, links }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{heading}</p>
      <ul className="mt-3 flex flex-col">
        {links.map((link) => (
          <li key={link.label}>
            <NavigationMenuLink asChild>
              <a
                href={link.href}
                className="block rounded-md px-3 py-2 text-sm text-foreground/80 transition-colors duration-300 hover:bg-accent hover:text-accent-foreground"
              >
                {link.label}
              </a>
            </NavigationMenuLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ServicesMegaMenu() {
  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
      <div className="flex flex-col gap-4 p-6">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-aurora-teal to-aurora-indigo text-ink">
          <Layers className="h-5 w-5" strokeWidth={2.2} />
        </div>
        <div>
          <p className="font-display text-sm font-semibold text-foreground">Full-Stack Product Studio</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Design, engineering, and launch under one roof -- no handoff gaps between teams.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {SERVICE_PILLS.map((pill) => (
            <a
              key={pill}
              href="/work"
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-8 px-3 text-xs')}
            >
              {pill}
            </a>
          ))}
        </div>
      </div>

      <div className="p-6">
        <MegaMenuLinkList heading="Design" links={DESIGN_LINKS} />
      </div>

      <div className="p-6">
        <MegaMenuLinkList heading="Engineering" links={ENGINEERING_LINKS} />
      </div>

      <div className="p-6">
        <Link
          to="/contact"
          className="group flex h-full flex-col gap-3 rounded-lg border border-border bg-background/40 p-5 transition-colors duration-300 hover:border-white/20"
        >
          <Badge className="w-fit">Featured</Badge>
          <p className="font-display text-sm font-semibold text-foreground">Zelarion Design System</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The same production-ready component kit powering this site -- built for teams who want speed
            without losing craft.
          </p>
          <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary">
            Start a project
            <ArrowUpRight
              className="h-4 w-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              strokeWidth={2.2}
            />
          </span>
        </Link>
      </div>
    </div>
  );
}

function MobileServicesGroup() {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="mobile-services">
        <AccordionTrigger className="text-base">Services</AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Design</p>
              <ul className="mt-2 flex flex-col gap-1">
                {DESIGN_LINKS.map((link) => (
                  <li key={link.label}>
                    <SheetClose asChild>
                      <a href={link.href} className="block rounded-md px-2 py-1.5 text-sm text-foreground/80">
                        {link.label}
                      </a>
                    </SheetClose>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Engineering</p>
              <ul className="mt-2 flex flex-col gap-1">
                {ENGINEERING_LINKS.map((link) => (
                  <li key={link.label}>
                    <SheetClose asChild>
                      <a href={link.href} className="block rounded-md px-2 py-1.5 text-sm text-foreground/80">
                        {link.label}
                      </a>
                    </SheetClose>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}


/**
 * Marks the current route so a visitor can tell where they are. `aria-current` carries
 * the state for assistive tech; the underline carries it visually, because colour alone
 * is not an acceptable sole indicator.
 */
function NavLink({ to, label, pathname }) {
  const isCurrent = pathname === to;
  return (
    <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
      <Link
        to={to}
        aria-current={isCurrent ? 'page' : undefined}
        className={cn(
          'relative transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
          isCurrent ? 'text-foreground' : 'text-foreground/70 hover:text-foreground',
          "after:absolute after:inset-x-2 after:-bottom-0.5 after:h-px after:origin-left after:bg-aurora-teal after:transition-transform after:duration-200 after:ease-[cubic-bezier(0.4,0,0.2,1)] after:content-['']",
          isCurrent ? 'after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-100'
        )}
      >
        {label}
      </Link>
    </NavigationMenuLink>
  );
}

export default function Navigation2() {
  const { pathname } = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return; // coalesce to one read per frame rather than per scroll event
      frame = requestAnimationFrame(() => {
        frame = 0;
        setIsScrolled(window.scrollY > 8);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full backdrop-blur transition-[background-color,border-color] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
        isScrolled
          ? 'border-b border-border bg-background/90 supports-[backdrop-filter]:bg-background/75'
          : 'border-b border-transparent bg-background/40'
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Logo />

        <NavigationMenu className={MEGA_MENU_ROOT_CLASSES}>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavLink to="/work" label="Work" pathname={pathname} />
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Services</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ServicesMegaMenu />
              </NavigationMenuContent>
            </NavigationMenuItem>
            {PRIMARY_LINKS.filter((link) => link.to !== '/work').map((link) => (
              <NavigationMenuItem key={link.to}>
                <NavLink to={link.to} label={link.label} pathname={pathname} />
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="hidden items-center gap-3 lg:flex">
          <Link to="/contact" className={buttonVariants({ variant: 'solid', size: 'sm' })}>
            Contact us
          </Link>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="px-2.5 lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] sm:max-w-sm">
            <SheetHeader>
              {/* Visually hidden: Radix requires an accessible dialog title even
                  though the logo below already communicates this visually. */}
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>
              <Logo />
            </SheetHeader>

            <nav className="flex flex-col gap-1">
              {PRIMARY_LINKS.map((link) => (
                <SheetClose asChild key={link.label}>
                  <Link
                    to={link.to}
                    className="min-h-[44px] rounded-md px-3 py-2.5 text-base text-foreground transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-accent"
                  >
                    {link.label}
                  </Link>
                </SheetClose>
              ))}
              <MobileServicesGroup />
            </nav>

            <div className="mt-auto">
              <SheetClose asChild>
                <Link to="/contact" className={cn(buttonVariants({ variant: 'solid', size: 'md' }), 'w-full')}>
                  Contact us
                </Link>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
