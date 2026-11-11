import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../common/BrandLogo';
import { CheckCircle2, ShieldCheck, MapPin } from 'lucide-react';

/**
 * Deep Ocean AuthLayout for SkyRoute.
 * Features official brand colors:
 * - Midnight Navy (#0B1F33), Deep Ocean (#123B5D), Bright Teal (#00A6A6),
 * - Clean surface (#F0F3F7), White Card (#FFFFFF), Border (#D5DEE7).
 */
const AuthLayout = ({ children, cardWidth = 'max-w-[420px]' }) => {
  return (
    <div className="min-h-screen bg-[#F0F3F7] text-[#142B45] flex flex-col justify-between relative overflow-hidden">
      {/* Subtle Logistics Grid Background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.035]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="lightGrid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#0B1F33" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#lightGrid)" />
          <path
            d="M 50 150 C 300 120, 600 450, 950 350 S 1400 200, 1600 280"
            fill="none"
            stroke="#176B87"
            strokeWidth="1.5"
            strokeDasharray="6 6"
          />
        </svg>
      </div>

      {/* Top Header */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-[#D5DEE7] bg-white/90 backdrop-blur-sm">
        <Link to="/" className="hover:opacity-90 transition">
          <BrandLogo size="md" showTagline={true} taglineText="Every Delivery. Every Mile. In Sight." />
        </Link>

        <div className="text-[12px] text-[#123B5D] font-medium hidden md:flex items-center gap-4">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#167A56] text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#167A56] animate-pulse"></span>
            SkyRoute Dispatch Network Active
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-center justify-center lg:gap-14">
          {/* Left Side: Logistics Overview (Desktop Only) */}
          <div className="hidden lg:flex flex-col justify-center max-w-md">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8EEF4] text-[#123B5D] text-xs font-semibold w-fit mb-4 border border-[#D5DEE7]">
              <MapPin className="w-3.5 h-3.5 text-[#00A6A6]" />
              <span>SkyRoute Delivery Management</span>
            </div>

            <h2 className="text-2xl font-bold text-[#142B45] tracking-tight leading-snug">
              Every Delivery. Every Mile. In Sight.
            </h2>
            <p className="text-sm text-[#607487] mt-2.5 leading-relaxed">
              Real-time courier tracking, GPS navigation, and secure delivery proof built for Indian logistics.
            </p>

            {/* Checklist */}
            <div className="mt-6 space-y-3 text-xs text-[#142B45] font-medium">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#00A6A6] shrink-0" />
                <span>Verified parcel tracking & live lifecycle timeline</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#00A6A6] shrink-0" />
                <span>Direct dispatch to assigned courier personnel</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#00A6A6] shrink-0" />
                <span>OTP verification and photographic proof of delivery</span>
              </div>
            </div>
          </div>

          {/* Right/Center Side: Compact White Card */}
          <div
            className={`w-full ${cardWidth} bg-white rounded-2xl border border-[#D5DEE7] p-6 sm:p-8 shadow-xs`}
          >
            {children}
          </div>
        </div>
      </main>

      {/* Clean Bottom Footer */}
      <footer className="relative z-10 py-3.5 px-6 border-t border-[#D5DEE7] text-center text-xs text-[#607487]">
        <span>© {new Date().getFullYear()} SkyRoute. All rights reserved.</span>
      </footer>
    </div>
  );
};

export default AuthLayout;
