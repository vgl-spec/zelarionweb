import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import SmoothScroll from './components/SmoothScroll';
import Hero from './components/Hero';
import ScrollExpandShowcase from './components/ScrollExpandShowcase';
import Metrics from './components/Metrics';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import Integrations from './components/Integrations';
import Security from './components/Security';
import Pricing from './components/Pricing';
import SocialProof from './components/SocialProof';
import { DemoProvider } from './components/DemoModal';
import Navigation2 from './sections/Navigation2';
import TeamSection from './sections/TeamSection';
import Faq5, { zelarionFaqCategories } from './sections/Faq5';
import CursorTrailContact from './sections/CursorTrailContact';
import CinematicFooter from './sections/CinematicFooter';
import ProjectInquirySection from './sections/ProjectInquirySection';
import NotFound from './sections/NotFound';

// three/@react-three pull ~30MB of source into whichever chunk imports them, and this
// canvas is purely decorative background. Splitting it keeps the initial payload to
// what the page actually needs to paint; the fallback is null because the page already
// renders correctly without it.
const TravellingCore = lazy(() => import('./components/TravellingCore'));

/**
 * Chrome shared by every route: the Lenis smooth-scroll driver, the header, and the
 * footer. The 404 route deliberately opts out of this shell, since it owns the full
 * viewport on its own.
 */
function SiteShell({ children, withTravellingCore = false }) {
  return (
    <div className="relative min-h-screen bg-ink text-text antialiased">
      <SmoothScroll />
      {/* Sibling of <main>, never inside it: the canvas sits at z-2 and <main> at z-10, so
          nesting it would put both in main's stacking context and float the canvas over the
          page content -- which silently swallows clicks on anything beneath it. */}
      {withTravellingCore && (
        <Suspense fallback={null}>
          <TravellingCore />
        </Suspense>
      )}
      <Navigation2 />
      <main className="relative z-10">{children}</main>
      <CinematicFooter />
    </div>
  );
}

function HomePage() {
  return (
    <>
      <Hero />
      {/* The header and footer link to these three anchors, so the ids are load-bearing. */}
      <div id="work">
        <ScrollExpandShowcase />
        <Metrics />
        <Features />
        <HowItWorks />
        <Integrations />
        <Security />
        <Pricing />
        <SocialProof />
      </div>
      <div id="team">
        <TeamSection />
      </div>
      <div id="faq">
        <Faq5 categories={zelarionFaqCategories} />
      </div>
      <CursorTrailContact />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <DemoProvider>
        <Routes>
          <Route
            path="/"
            element={
              <SiteShell withTravellingCore>
                <HomePage />
              </SiteShell>
            }
          />
          <Route
            path="/contact"
            element={
              <SiteShell>
                <ProjectInquirySection />
              </SiteShell>
            }
          />
          {/* NotFound owns the full viewport, so it renders outside the shell. */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </DemoProvider>
    </BrowserRouter>
  );
}

export default App;
