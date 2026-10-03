import React from 'react';
import { Package, CheckCircle2, ShieldCheck, MapPin } from 'lucide-react';

/**
 * Minimal, clean, realistic logistics AuthLayout.
 * Features a clean light gray canvas (#F4F6F8), subtle route watermarks,
 * and a compact, professional white card with dark navy and amber accents.
 */
const AuthLayout = ({ children, cardWidth = 'max-w-[420px]' }) => {
  return (
    <div className="min-h-screen bg-[#F4F6F8] text-[#172033] flex flex-col justify-between relative overflow-hidden">
      {/* Subtle Logistics Grid / Route Watermark (barely visible) */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.035]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="lightGrid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#172033" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#lightGrid)" />
          {/* Subtle curved transit lines */}
          <path
            d="M 50 150 C 300 120, 600 450, 950 350 S 1400 200, 1600 280"
            fill="none"
            stroke="#172033"
            strokeWidth="1.5"
            strokeDasharray="6 6"
          />
          <path
            d="M 100 800 C 450 650, 800 900, 1200 700 S 1500 550, 1700 620"
            fill="none"
            stroke="#172033"
            strokeWidth="1.5"
            strokeDasharray="6 6"
          />
        </svg>
      </div>

      {/* Top Simple Header */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-[#D9DEE5]/60 bg-white/70 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#172033] text-[#D97706] flex items-center justify-center shadow-xs">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm text-[#172033] tracking-tight block leading-tight">
              Internet-Based Live Courier Tracking
            </span>
            <span className="text-[11px] text-[#667085] hidden sm:inline">
              Reliable delivery management system
            </span>
          </div>
        </div>

        <div className="text-[12px] text-[#667085] font-medium hidden md:flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#15803D]"></span>
            Dispatch Network Active
          </span>
        </div>
      </header>

      {/* Main Content Area (Split on Desktop, Centered on Mobile) */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-center justify-center lg:gap-14">
          {/* Left Side: Minimal Logistics Overview (Desktop Only) */}
          <div className="hidden lg:flex flex-col justify-center max-w-md">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#172033]/5 text-[#172033] text-xs font-semibold w-fit mb-4 border border-[#D9DEE5]">
              <MapPin className="w-3.5 h-3.5 text-[#D97706]" />
              <span>Logistics & Dispatch Operations</span>
            </div>

            <h2 className="text-2xl font-bold text-[#172033] tracking-tight leading-snug">
              Reliable tracking from pickup to delivery.
            </h2>
            <p className="text-sm text-[#667085] mt-2.5 leading-relaxed">
              Secure portal for customers, couriers, and dispatchers to coordinate package shipments and status updates.
            </p>

            {/* Simple realistic checklist */}
            <div className="mt-6 space-y-3 text-xs text-[#263449] font-medium">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                <span>Verified parcel tracking & lifecycle timeline</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                <span>Direct dispatch to assigned courier personnel</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#D97706] shrink-0" />
                <span>Role-restricted operations with token security</span>
              </div>
            </div>
          </div>

          {/* Right/Center Side: Compact White Card */}
          <div
            className={`w-full ${cardWidth} bg-white rounded-xl border border-[#D9DEE5] p-6 sm:p-8 shadow-xs`}
          >
            {children}
          </div>
        </div>
      </main>

      {/* Clean Bottom Footer */}
      <footer className="relative z-10 py-3.5 px-6 border-t border-[#D9DEE5]/60 text-center text-xs text-[#667085]">
        <span>© {new Date().getFullYear()} Internet-Based Live Courier Tracking. All rights reserved.</span>
      </footer>
    </div>
  );
};

export default AuthLayout;
