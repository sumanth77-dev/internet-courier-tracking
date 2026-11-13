import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import localHeroPng from '../../assets/hero.png';
import {
  Search,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Navigation,
  Truck,
} from 'lucide-react';

export const LandingHero = () => {
  const [trackingInput, setTrackingInput] = useState('');
  const [inputError, setInputError] = useState('');
  const [imageError, setImageError] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Primary logistics photo (high-res modern fleet & cargo terminal)
  const primaryHeroImage =
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80';

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    const cleaned = trackingInput.trim();

    if (!cleaned) {
      setInputError('Please enter a valid tracking ID');
      return;
    }

    setInputError('');

    // If user is authenticated, route to tracking page directly
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate(`/admin/shipments/${encodeURIComponent(cleaned)}`);
      } else {
        navigate(`/customer/shipments/${encodeURIComponent(cleaned)}`);
      }
      return;
    }

    // Unauthenticated visitors are directed to login with the tracking query parameter
    navigate(`/login?track=${encodeURIComponent(cleaned)}`);
  };

  const handleQuickChipClick = (id) => {
    setTrackingInput(id);
    setInputError('');
  };

  const handleScrollToFeatures = () => {
    const el = document.getElementById('features');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section
      id="hero"
      className="bg-[#171717] text-white pt-28 sm:pt-32 lg:pt-36 pb-20 lg:pb-28 relative overflow-hidden"
    >
      {/* Subtle curved route trajectory on Dark Charcoal Surface */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Low-contrast organic transit route vectors */}
        <svg
          className="absolute inset-0 w-full h-full opacity-20"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1440 800"
        >
          <path
            d="M -100 450 C 300 280, 600 620, 1000 380 S 1350 200, 1600 320"
            fill="none"
            stroke="#FF7547"
            strokeWidth="1.8"
          />
          <path
            d="M -50 520 C 350 350, 650 680, 1050 440 S 1400 260, 1650 380"
            fill="none"
            stroke="#383838"
            strokeWidth="1.2"
          />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Column: Heading, Supporting Text, Tracking Search, CTAs */}
          <div className="lg:col-span-7 space-y-6">
            {/* Operational Status Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#242424] border border-[#383838] shadow-2xs backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-[#FF7547] animate-pulse"></span>
              <span className="text-xs font-bold text-white tracking-wide uppercase">
                SkyRoute Live Logistics Cloud
              </span>
              <span className="text-[11px] font-medium text-[#C5C5C5] border-l border-[#383838] pl-2 hidden sm:inline">
                Pan-India Real-Time GPS
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.14]">
              Your Deliveries, <br className="hidden sm:inline" />
              <span className="text-[#FF7547]">Always Within Reach.</span>
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg text-[#C5C5C5] max-w-2xl leading-relaxed font-normal">
              Track shipments in real time, follow every delivery journey, and stay connected from pickup to doorstep with SkyRoute.
            </p>

            {/* Tracking Search Component (Primary Call to Action) */}
            <div
              id="tracking-search-bar"
              className="bg-[#242424] rounded-[20px] border border-[#383838] p-3 sm:p-4 shadow-xl max-w-xl backdrop-blur-xs"
            >
              <form onSubmit={handleTrackSubmit} className="space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-5 h-5 text-[#929292] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={trackingInput}
                      onChange={(e) => {
                        setTrackingInput(e.target.value);
                        if (inputError) setInputError('');
                      }}
                      placeholder="Enter Tracking ID (e.g., TRK202600001)"
                      className="w-full pl-10 pr-4 py-3 bg-[#171717] text-white placeholder-[#929292] border border-[#383838] rounded-xl text-sm font-mono focus:outline-none focus:border-[#FF7547] focus:ring-1 focus:ring-[#FF7547] transition"
                      aria-label="Shipment Tracking ID"
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#FF7547] hover:bg-[#F06438] text-white font-bold text-sm rounded-xl transition duration-150 shadow-xs cursor-pointer shrink-0"
                  >
                    <span>Track Parcel</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {inputError && (
                  <p className="text-xs text-[#E45B54] font-semibold pl-1">
                    {inputError}
                  </p>
                )}

                {/* Quick Try Demo Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs text-[#C5C5C5]">
                  <span className="font-semibold text-white">Sample IDs:</span>
                  {['TRK202600001', 'TRK202600002', 'TRK202600003'].map((sampleId) => (
                    <button
                      key={sampleId}
                      type="button"
                      onClick={() => handleQuickChipClick(sampleId)}
                      className="font-mono text-[11px] px-2.5 py-0.5 rounded-lg bg-[#171717] border border-[#383838] text-[#FF7547] hover:bg-[#FF7547] hover:text-white transition cursor-pointer"
                    >
                      {sampleId}
                    </button>
                  ))}
                </div>
              </form>
            </div>

            {/* Action Buttons: Get Started and Explore Features */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF7547] hover:bg-[#F06438] text-white font-bold text-sm shadow-md transition"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </Link>

              <button
                type="button"
                onClick={handleScrollToFeatures}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#242424] hover:bg-[#303030] text-white font-bold text-sm border border-[#383838] transition cursor-pointer"
              >
                <span>Explore Features</span>
              </button>
            </div>

            {/* Trust Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#303030]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#FF7547] shrink-0" />
                <span className="text-xs font-semibold text-white">Real-Time GPS Tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-[#FF7547] shrink-0" />
                <span className="text-xs font-semibold text-white">Route Optimization</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#FF7547] shrink-0" />
                <span className="text-xs font-semibold text-white">Secure POD Verification</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              {/* Outer Charcoal Card Frame */}
              <div className="bg-[#242424] p-3 sm:p-4 rounded-[22px] border border-[#383838] shadow-2xl backdrop-blur-xs">
                <div className="relative rounded-2xl overflow-hidden bg-[#171717] aspect-4/3 flex items-center justify-center">
                  {!imageError ? (
                    <img
                      src={primaryHeroImage}
                      onError={() => setImageError(true)}
                      alt="SkyRoute logistics hub and delivery fleet"
                      className="w-full h-full object-cover"
                      loading="eager"
                    />
                  ) : (
                    <img
                      src={localHeroPng}
                      alt="SkyRoute dispatch control network"
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Overlay Fleet Status Card */}
                  <div className="absolute bottom-3 left-3 right-3 bg-[#171717]/92 backdrop-blur-md border border-[#383838] rounded-xl p-3 text-xs text-white flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#FF7547] text-white flex items-center justify-center font-bold">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          <span>Fleet Route #BLR-402</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF7547] animate-pulse"></span>
                        </div>
                        <span className="text-[11px] text-[#929292]">In Transit • On Road</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-[#FF7547] bg-[#242424] px-2 py-0.5 rounded border border-[#383838]">
                      ETA 14m
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingHero;
