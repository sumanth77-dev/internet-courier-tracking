import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../common/BrandLogo';
import {
  Mail,
  Phone,
  MapPin,
  Shield,
  Truck,
  Package,
} from 'lucide-react';

export const LandingFooter = () => {
  const currentYear = new Date().getFullYear();

  const handleScrollTo = (e, href) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <footer id="contact" className="bg-[#171717] text-white border-t border-[#303030]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-[#303030]">
          {/* Brand Info (col-span-4) */}
          <div className="lg:col-span-4 space-y-4">
            <BrandLogo
              size="lg"
              showTagline={true}
              theme="light"
              taglineText="Every Delivery. Every Mile. In Sight."
            />
            <p className="text-xs text-[#C5C5C5] leading-relaxed max-w-sm">
              SkyRoute is an enterprise-grade real-time courier tracking and delivery management platform engineered for modern logistics networks, delivering sub-second GPS accuracy and tamper-resistant proof of delivery.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#242424] border border-[#383838] text-[11px] text-[#FF7547] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF7547]"></span>
              <span>100% Cloud-Native Dispatch System</span>
            </div>
          </div>

          {/* Quick Platform Links (col-span-3) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Platform Navigation
            </h4>
            <ul className="space-y-2 text-xs text-[#C5C5C5]">
              <li>
                <a
                  href="#hero"
                  onClick={(e) => handleScrollTo(e, '#hero')}
                  className="hover:text-[#FF7547] transition"
                >
                  Home & Tracking Search
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  onClick={(e) => handleScrollTo(e, '#features')}
                  className="hover:text-[#FF7547] transition"
                >
                  Features & Capabilities
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  onClick={(e) => handleScrollTo(e, '#how-it-works')}
                  className="hover:text-[#FF7547] transition"
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="#live-preview"
                  onClick={(e) => handleScrollTo(e, '#live-preview')}
                  className="hover:text-[#FF7547] transition"
                >
                  Interactive Live Tracking Map
                </a>
              </li>
              <li>
                <a
                  href="#benefits"
                  onClick={(e) => handleScrollTo(e, '#benefits')}
                  className="hover:text-[#FF7547] transition"
                >
                  Benefits for Teams & Customers
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  onClick={(e) => handleScrollTo(e, '#about')}
                  className="hover:text-[#FF7547] transition"
                >
                  About SkyRoute
                </a>
              </li>
            </ul>
          </div>

          {/* Dedicated Portal Access (col-span-2) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Role Portals
            </h4>
            <ul className="space-y-2 text-xs text-[#C5C5C5]">
              <li>
                <Link
                  to="/customer"
                  className="hover:text-[#FF7547] transition flex items-center gap-1.5"
                >
                  <Package className="w-3.5 h-3.5 text-[#FF7547]" />
                  <span>Customer Portal</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/courier"
                  className="hover:text-[#FF7547] transition flex items-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5 text-[#FF7547]" />
                  <span>Courier Portal</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/admin"
                  className="hover:text-[#FF7547] transition flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5 text-[#FF7547]" />
                  <span>Admin Console</span>
                </Link>
              </li>
              <li className="pt-1">
                <Link
                  to="/login"
                  className="text-white hover:text-[#FF7547] font-semibold transition"
                >
                  Sign In →
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="text-[#FF7547] hover:underline font-semibold transition"
                >
                  Register Account →
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details (col-span-3) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Contact & Dispatch HQ
            </h4>
            <div className="space-y-2.5 text-xs text-[#C5C5C5]">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#FF7547] shrink-0 mt-0.5" />
                <span>
                  SkyRoute Operations Center<br />
                  100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#FF7547] shrink-0" />
                <span className="font-mono">support@skyroute.in</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#FF7547] shrink-0" />
                <span>+91 (80) 4567-8900</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & System Notice */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#929292] gap-3">
          <p>© {currentYear} SkyRoute. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="text-[11px] text-[#C5C5C5]">
              Every Delivery. Every Mile. In Sight.
            </span>
            <span className="text-[11px] text-[#929292] border-l border-[#383838] pl-6 hidden sm:inline">
              Modern Logistics Architecture
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
