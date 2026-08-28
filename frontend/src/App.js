import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import SmoothScroll from './components/SmoothScroll';
import Navigation2 from './sections/Navigation2';
import HeroStudio from './sections/HeroStudio';
import CredibilityBar from './sections/CredibilityBar';
import ScrollExpandShowcase from './sections/ScrollExpandShowcase';
import WorkShowcase from './sections/WorkShowcase';
import ServicesSection from './sections/ServicesSection';
import ProcessSection from './sections/ProcessSection';
import TeamSection from './sections/TeamSection';
import Faq5, { zelarionFaqCategories } from './sections/Faq5';
import CursorTrailContact from './sections/CursorTrailContact';
import CinematicFooter from './sections/CinematicFooter';
import WorkPage from './pages/WorkPage';
import ServicesPage from './pages/ServicesPage';
import TeamPage from './pages/TeamPage';
import FaqPage from './pages/FaqPage';
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
      <HeroStudio />
      <CredibilityBar />
      <ScrollExpandShowcase />
      {/* The header and footer link to these three anchors, so the ids are load-bearing. */}
      <div id="work">
        <WorkShowcase limit={3} showViewAll />
      </div>
      <ServicesSection />
      <ProcessSection />
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

const ROUTES = [
  { path: '/', element: <HomePage />, withTravellingCore: true },
  { path: '/work', element: <WorkPage /> },
  { path: '/services', element: <ServicesPage /> },
  { path: '/team', element: <TeamPage /> },
  { path: '/faq', element: <FaqPage /> },
  { path: '/contact', element: <ProjectInquirySection /> },
];

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {ROUTES.map(({ path, element, withTravellingCore }) => (
          <Route
            key={path}
            path={path}
            element={
              <SiteShell withTravellingCore={withTravellingCore}>{element}</SiteShell>
            }
          />
        ))}
        {/* NotFound owns the full viewport, so it renders outside the shell. */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
