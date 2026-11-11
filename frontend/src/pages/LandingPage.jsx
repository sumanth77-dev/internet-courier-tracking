import React, { useEffect } from 'react';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingHero from '../components/landing/LandingHero';
import LandingFeatures from '../components/landing/LandingFeatures';
import LandingHowItWorks from '../components/landing/LandingHowItWorks';
import LandingLivePreview from '../components/landing/LandingLivePreview';
import LandingBenefits from '../components/landing/LandingBenefits';
import LandingAbout from '../components/landing/LandingAbout';
import LandingCTA from '../components/landing/LandingCTA';
import LandingFooter from '../components/landing/LandingFooter';

/**
 * Public Landing Page for SkyRoute — Deep Ocean Design Identity
 * Brand Name: SkyRoute
 * Tagline: Every Delivery. Every Mile. In Sight.
 * Project Type: Real-Time Courier Tracking and Delivery Management Platform
 */
export const LandingPage = () => {
  useEffect(() => {
    document.title = 'SkyRoute — Real-Time Courier Tracking & Delivery Management';
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#142B45] flex flex-col selection:bg-[#00A6A6]/20 selection:text-[#0B1F33]">
      {/* 1. Header Navigation Bar */}
      <LandingNavbar />

      {/* Main Landing Sections */}
      <main className="flex-1">
        {/* 2. Hero Section with Shipment Tracking Search */}
        <LandingHero />

        {/* 3. Features Section */}
        <LandingFeatures />

        {/* 4. How It Works Process Section */}
        <LandingHowItWorks />

        {/* 5. Live Tracking Map Preview (Sample Data) */}
        <LandingLivePreview />

        {/* 6. Benefits for Customers, Couriers, and Administrators */}
        <LandingBenefits />

        {/* 7. About SkyRoute Section */}
        <LandingAbout />

        {/* 8. Call-to-Action Section */}
        <LandingCTA />
      </main>

      {/* 9. Comprehensive Footer */}
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
