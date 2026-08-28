import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { registerScrollDriver, setScroll } from '../lib/scrollStore';
import { prefersReducedMotion } from '../lib/utils';

gsap.registerPlugin(ScrollTrigger);

// Wires Lenis smooth scroll to GSAP ScrollTrigger and the global scroll store.
// Respects prefers-reduced-motion by skipping Lenis (native scroll, fades kept).
export default function SmoothScroll() {
  useEffect(() => {
    const reduced = prefersReducedMotion();

    const updateStore = () => {
      const docHeight = document.body.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? window.scrollY / docHeight : 0;
      const viewportsScrolled =
        window.innerHeight > 0 ? window.scrollY / window.innerHeight : 0;
      setScroll(progress, 0, viewportsScrolled);
    };

    if (reduced) {
      window.addEventListener('scroll', updateStore, { passive: true });
      updateStore();
      return () => window.removeEventListener('scroll', updateStore);
    }

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
    });

    lenis.on('scroll', (e) => {
      ScrollTrigger.update();
      const docHeight = document.body.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? e.scroll / docHeight : 0;
      const viewportsScrolled =
        window.innerHeight > 0 ? e.scroll / window.innerHeight : 0;
      setScroll(progress, e.velocity || 0, viewportsScrolled);
    });

    // Modals pause the driver through this handle; see lockScroll in scrollStore.
    const unregisterDriver = registerScrollDriver(lenis);

    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // refresh measurements once everything is laid out
    const refresh = () => ScrollTrigger.refresh();
    const t = setTimeout(refresh, 400);
    window.addEventListener('load', refresh);

    return () => {
      clearTimeout(t);
      window.removeEventListener('load', refresh);
      unregisterDriver();
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return null;
}
