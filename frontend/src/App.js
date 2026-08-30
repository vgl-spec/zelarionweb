import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import SmoothScroll from './components/SmoothScroll';
import ScrollToHash from './components/ScrollToHash';
import ScrollSnap from './components/ScrollSnap';
import Seo from './components/Seo';
import Navigation2 from './sections/Navigation2';
import HeroStudio from './sections/HeroStudio';
import CredibilityBar from './sections/CredibilityBar';
import ScrollExpandShowcase from './sections/ScrollExpandShowcase';
import WorkShowcase from './sections/WorkShowcase';
import ServicesSection from './sections/ServicesSection';
import ProcessSection from './sections/ProcessSection';
import Faq5, { zelarionFaqCategories } from './sections/Faq5';
import ContactCta from './sections/ContactCta';
import CinematicFooter from './sections/CinematicFooter';
import WorkPage from './pages/WorkPage';
import ServicesPage from './pages/ServicesPage';
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
      {/* Snapping is scoped to the home page because the two sections that register stops
          (the hero card wall and the expanding showcase) only exist here. It parks the
          page on their keyframes and leaves everything below them scrolling normally. */}
      <ScrollSnap />
      <HeroStudio />
      <CredibilityBar />
      <ScrollExpandShowcase />
      {/* The header and footer link to these dedicated routes now (not these anchors),
          but the ids stay: they're still valid in-page scroll targets for ScrollToHash. */}
      <div id="work">
        <WorkShowcase limit={4} showViewAll />
      </div>
      <ServicesSection />
      <ProcessSection />
      <div id="faq">
        <Faq5 categories={zelarionFaqCategories} />
      </div>
      <ContactCta />
    </>
  );
}

// Titles are written to survive truncation in a search result: the distinguishing words
// come first and the brand is appended by <Seo>. Descriptions are held near 150 characters,
// which is roughly what Google renders before it cuts, and each one describes THAT page
// rather than repeating the site's pitch five times.
const ROUTES = [
  {
    path: '/',
    element: <HomePage />,
    withTravellingCore: true,
    title: 'Zelarion — Software and design studio in the Philippines',
    description:
      'Zelarion designs and builds websites, commerce platforms and internal systems for businesses in the Philippines and abroad. Real systems in daily use, not demos.',
  },
  {
    path: '/work',
    element: <WorkPage />,
    title: 'Solutions we have built',
    description:
      'Live systems built for a law firm, industrial suppliers, a packaging manufacturer, a wellness organisation and two commerce platforms. Every preview is the real site.',
  },
  {
    path: '/services',
    element: <ServicesPage />,
    title: 'What we build',
    description:
      'Websites that make the case for you, commerce and distribution systems, internal platforms and member systems, and ongoing support after launch.',
  },
  {
    path: '/faq',
    element: <FaqPage />,
    title: 'Frequently asked questions',
    description:
      'How an engagement runs, what happens after launch, and what you own at the end. Straight answers about working with a small studio.',
  },
  {
    path: '/contact',
    element: <ProjectInquirySection />,
    title: 'Start a project',
    description:
      'Tell us what you are trying to run better. We reply within one business day with next steps, not a sales deck.',
  },
];

function App() {
  return (
    <BrowserRouter>
      {/* Mounted here, not inside SiteShell: each Route's element (including SiteShell)
          is a distinct subtree, so react-router unmounts/remounts it on every navigation.
          ScrollToHash needs to persist across navigations to tell "pathname changed" apart
          from "just mounted" -- a fresh instance per route would see every navigation as a
          first mount and never fire the scroll-to-top fallback. */}
      <ScrollToHash />
      <Routes>
        {ROUTES.map(({ path, element, withTravellingCore, title, description }) => (
          <Route
            key={path}
            path={path}
            element={
              <SiteShell withTravellingCore={withTravellingCore}>
                <Seo title={title} description={description} path={path} />
                {element}
              </SiteShell>
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
