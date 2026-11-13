import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../common/BrandLogo';
import { CheckCircle2, ShieldCheck, MapPin } from 'lucide-react';

/**
 * Modern Dark Parcel Delivery AuthLayout for SkyRoute.
 * Official Dark Palette Tokens:
 * - Main Background (#101010), Secondary Background (#141414), Header (#181818)
 * - Card Background (#222222), Inner Surface (#1C1C1C), Border (#353535)
 * - Primary Text (#F5F5F5), Secondary Text (#C0C0C0), Muted (#929292)
 * - Accent Coral Orange (#FF7547)
 */
const AuthLayout = ({ children, cardWidth = 'max-w-[420px]' }) => {
  return (
    <div className="min-h-screen bg-[#101010] text-[#F5F5F5] flex flex-col justify-between relative overflow-hidden">
      {/* Subtle Logistics Background Route Trajectory */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M 50 150 C 300 120, 600 450, 950 350 S 1400 200, 1600 280"
            fill="none"
            stroke="#353535"
            strokeWidth="1.5"
            strokeDasharray="6 6"
          />
          <path
            d="M 100 220 C 400 180, 700 520, 1050 400 S 1450 250, 1650 340"
            fill="none"
            stroke="#FF7547"
            strokeWidth="1.2"
            strokeOpacity="0.4"
            strokeDasharray="4 6"
          />
        </svg>
      </div>

      {/* Top Header */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-[#353535] bg-[#181818]/90 backdrop-blur-md">
        <Link to="/" className="hover:opacity-90 transition">
          <BrandLogo size="md" showTagline={true} theme="light" taglineText="Every Delivery. Every Mile. In Sight." />
        </Link>

        <div className="text-[12px] text-[#C0C0C0] font-medium hidden md:flex items-center gap-4">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#36A879]/15 border border-[#36A879]/30 text-[#36A879] text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#36A879] animate-pulse"></span>
            SkyRoute Dispatch Network Active
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-center justify-center lg:gap-14">
          {/* Left Side: Logistics Overview (Desktop Only) */}
          <div className="hidden lg:flex flex-col justify-center max-w-md">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1C1C1C] text-[#C0C0C0] text-xs font-semibold w-fit mb-4 border border-[#353535]">
              <MapPin className="w-3.5 h-3.5 text-[#FF7547]" />
              <span>SkyRoute Delivery Management</span>
            </div>

            <h2 className="text-2xl font-black text-[#F5F5F5] tracking-tight leading-snug">
              Every Delivery. Every Mile. In Sight.
            </h2>
            <p className="text-sm text-[#929292] mt-2.5 leading-relaxed">
              Real-time courier tracking, GPS navigation, and secure delivery proof built for Indian logistics.
            </p>

            {/* Checklist */}
            <div className="mt-6 space-y-3 text-xs text-[#C0C0C0] font-medium">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#FF7547] shrink-0" />
                <span>Verified parcel tracking & live lifecycle timeline</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#FF7547] shrink-0" />
                <span>Direct dispatch to assigned courier personnel</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#FF7547] shrink-0" />
                <span>OTP verification and photographic proof of delivery</span>
              </div>
            </div>
          </div>

          {/* Right/Center Side: Compact Dark Card */}
          <div
            className={`w-full ${cardWidth} bg-[#222222] rounded-2xl border border-[#353535] p-6 sm:p-8 shadow-2xl`}
          >
            {children}
          </div>
        </div>
      </main>

      {/* Clean Bottom Footer */}
      <footer className="relative z-10 py-3.5 px-6 border-t border-[#353535] text-center text-xs text-[#929292]">
        <span>© {new Date().getFullYear()} SkyRoute. All rights reserved.</span>
      </footer>
    </div>
  );
};

export default AuthLayout;
