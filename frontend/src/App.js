import React from 'react';
import './App.css';
import SmoothScroll from './components/SmoothScroll';
import TravellingCore from './components/TravellingCore';
import Nav from './components/Nav';
import Hero from './components/Hero';
import ScrollExpandShowcase from './components/ScrollExpandShowcase';
import Metrics from './components/Metrics';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import Integrations from './components/Integrations';
import Security from './components/Security';
import Pricing from './components/Pricing';
import SocialProof from './components/SocialProof';
import Founders from './components/Founders';
import FAQ from './components/FAQ';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';
import { DemoProvider } from './components/DemoModal';

function App() {
  return (
    <DemoProvider>
      <div className="relative min-h-screen bg-ink text-text antialiased">
        <SmoothScroll />
        <TravellingCore />
        <Nav />
        <main className="relative z-10">
          <Hero />
          <ScrollExpandShowcase />
          <Metrics />
          <Features />
          <HowItWorks />
          <Integrations />
          <Security />
          <Pricing />
          <SocialProof />
          <Founders />
          <FAQ />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </DemoProvider>
  );
}

export default App;
