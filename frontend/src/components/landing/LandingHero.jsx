import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import localHeroPng from '../../assets/hero.png';
import {
  Search,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Clock,
  Truck,
  CheckCircle2,
  Navigation,
  Sparkles,
  Compass,
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
    <section id="hero" className="bg-[#0B1F33] text-white pt-14 pb-20 lg:pt-24 lg:pb-28 relative overflow-hidden">
      {/* Subtle background route grid line accents */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="heroGrid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#DCE5EC" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#heroGrid)" />
          <path
            d="M 100 200 C 400 150, 700 500, 1100 350 S 1500 220, 1800 300"
            fill="none"
            stroke="#00A6A6"
            strokeWidth="2"
            strokeDasharray="6 6"
          />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Column: Heading, Supporting Text, Tracking Search, CTAs */}
          <div className="lg:col-span-7 space-y-6">
            {/* Operational Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#123B5D] border border-[#176B87]/50 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#00A6A6] animate-pulse"></span>
              <span className="text-xs font-bold text-white tracking-wide uppercase">
                SkyRoute Live Logistics Cloud
              </span>
              <span className="text-[11px] font-medium text-[#DCE5EC] border-l border-[#176B87] pl-2 hidden sm:inline">
                Pan-India Real-Time GPS
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
              Your Deliveries, <br className="hidden sm:inline" />
              <span className="text-[#00A6A6]">Always Within Reach.</span>
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg text-[#DCE5EC] max-w-2xl leading-relaxed">
              Track shipments in real time, follow every delivery journey, and stay connected from pickup to doorstep with SkyRoute.
            </p>

            {/* Tracking Search Component (Primary Call to Action) */}
            <div
              id="tracking-search-bar"
              className="bg-[#123B5D] rounded-[18px] border border-[#176B87]/70 p-3 sm:p-4 shadow-lg max-w-xl"
            >
              <form onSubmit={handleTrackSubmit} className="space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-5 h-5 text-[#8A9BAA] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={trackingInput}
                      onChange={(e) => {
                        setTrackingInput(e.target.value);
                        if (inputError) setInputError('');
                      }}
                      placeholder="Enter Tracking ID (e.g., TRK202600001)"
                      className="w-full pl-10 pr-4 py-3 bg-[#0B1F33] text-white placeholder-[#8A9BAA] border border-[#176B87]/60 rounded-xl text-sm font-mono focus:outline-none focus:border-[#00A6A6] focus:ring-1 focus:ring-[#00A6A6] transition"
                      aria-label="Shipment Tracking ID"
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#00A6A6] hover:bg-[#008F95] text-white font-bold text-sm rounded-xl transition duration-150 shadow-xs cursor-pointer shrink-0"
                  >
                    <span>Track Parcel</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {inputError && (
                  <p className="text-xs text-[#F87171] font-semibold pl-1">
                    {inputError}
                  </p>
                )}

                {/* Quick Try Demo Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs text-[#DCE5EC]">
                  <span className="font-semibold text-white">Sample IDs:</span>
                  {['TRK202600001', 'TRK202600002', 'TRK202600003'].map((sampleId) => (
                    <button
                      key={sampleId}
                      type="button"
                      onClick={() => handleQuickChipClick(sampleId)}
                      className="font-mono text-[11px] px-2 py-0.5 rounded-lg bg-[#0B1F33] border border-[#176B87]/70 text-[#00A6A6] hover:bg-[#176B87] hover:text-white transition cursor-pointer"
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
                className="inline-flex items-center gap-2 px-6 py-3 rounded-[11px] bg-[#00A6A6] hover:bg-[#008F95] text-white font-bold text-sm shadow-md transition"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </Link>

              <button
                type="button"
                onClick={handleScrollToFeatures}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-[11px] bg-[#123B5D] hover:bg-[#176B87] text-white font-bold text-sm border border-[#176B87] transition cursor-pointer"
              >
                <span>Explore Features</span>
              </button>
            </div>

            {/* Trust Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#176B87]/40">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00A6A6] shrink-0" />
                <span className="text-xs font-semibold text-white">Real-Time GPS Tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-[#00A6A6] shrink-0" />
                <span className="text-xs font-semibold text-white">Route Optimization</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00A6A6] shrink-0" />
                <span className="text-xs font-semibold text-white">Secure POD Verification</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              {/* Outer Deep Ocean Card Frame */}
              <div className="bg-[#123B5D] p-3 sm:p-4 rounded-[22px] border border-[#176B87]/70 shadow-2xl">
                <div className="relative rounded-2xl overflow-hidden bg-[#0B1F33] aspect-4/3 flex items-center justify-center">
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
                  <div className="absolute bottom-3 left-3 right-3 bg-[#0B1F33]/90 backdrop-blur-md border border-[#176B87]/80 rounded-xl p-3 text-xs text-white flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#00A6A6] text-white flex items-center justify-center font-bold">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          <span>Fleet Route #BLR-402</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00A6A6] animate-pulse"></span>
                        </div>
                        <span className="text-[11px] text-[#8A9BAA]">In Transit • On Road</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-[#00A6A6] bg-[#123B5D] px-2 py-0.5 rounded border border-[#176B87]">
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
