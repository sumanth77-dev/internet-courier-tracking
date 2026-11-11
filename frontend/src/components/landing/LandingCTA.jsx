import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, ShieldCheck } from 'lucide-react';

export const LandingCTA = () => {
  const handleScrollToSearch = () => {
    const el = document.getElementById('tracking-search-bar');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const inputEl = el.querySelector('input');
      if (inputEl) inputEl.focus();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-16 lg:py-20 bg-[#0B1F33] text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#123B5D] border border-[#176B87] text-xs font-bold text-[#00A6A6] uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#00A6A6]" />
            <span>SkyRoute Enterprise Delivery System</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Every Delivery Deserves a Clear Journey.
          </h2>

          <p className="text-base sm:text-lg text-[#DCE5EC] max-w-2xl mx-auto leading-relaxed">
            Experience reliable parcel tracking, verified handoffs, and live route transparency with SkyRoute.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-[11px] bg-[#00A6A6] hover:bg-[#008F95] text-white font-bold text-sm transition shadow-sm cursor-pointer"
            >
              <span>Create SkyRoute Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={handleScrollToSearch}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-[11px] bg-[#123B5D] hover:bg-[#176B87] text-white font-bold text-sm border border-[#176B87] transition shadow-sm cursor-pointer"
            >
              <Search className="w-4 h-4 text-[#00A6A6]" />
              <span>Track a Shipment</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingCTA;
