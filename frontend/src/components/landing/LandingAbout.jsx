import React from 'react';
import {
  Navigation,
  MapPin,
  Users2,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Layers,
} from 'lucide-react';

export const LandingAbout = () => {
  const capabilities = [
    {
      icon: Navigation,
      title: 'Live GPS Tracking',
      description:
        'Continuous coordinate streaming allows dispatchers and customers to follow vehicle progression on live road networks with sub-second responsiveness.',
    },
    {
      icon: MapPin,
      title: 'Interactive Road Map Visualization',
      description:
        'Turn-by-turn route plotting snapped to actual road geometry using Leaflet and OpenStreetMap, with clear origin and delivery destination pins.',
    },
    {
      icon: Users2,
      title: 'Multi-Role Delivery Collaboration',
      description:
        'Dedicated, synchronized portals for Customers, Couriers, and Dispatch Administrators to manage the parcel lifecycle cohesively.',
    },
    {
      icon: ShieldCheck,
      title: 'OTP Verification & Proof of Delivery',
      description:
        'Strict handoff validation requiring secure 6-digit one-time password entry and drop-off photo inspection to ensure tamper-proof delivery completion.',
    },
  ];

  return (
    <section id="about" className="py-16 lg:py-24 bg-white border-b border-[#D5DEE7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8EEF4] border border-[#D5DEE7] mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00A6A6]"></span>
            <span className="text-xs font-bold text-[#142B45] uppercase tracking-wider">
              About SkyRoute
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#142B45] tracking-tight">
            Built for Real-Time Shipment Transparency
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#607487] leading-relaxed">
            SkyRoute is a modern courier tracking and delivery management platform built to provide complete real-time shipment transparency across every stage of parcel transit.
          </p>
        </div>

        {/* 2x2 Grid of Grounded Core Architecture */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {capabilities.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-[#F0F3F7] rounded-2xl border border-[#D5DEE7] p-7 flex items-start gap-4 hover:border-[#00A6A6] transition duration-200 shadow-2xs"
              >
                <div className="w-12 h-12 rounded-xl bg-[#0B1F33] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Icon className="w-6 h-6 text-[#00A6A6]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#142B45] mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#607487] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* System Summary Banner */}
        <div className="mt-12 max-w-4xl mx-auto bg-[#0B1F33] text-white rounded-[20px] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-base font-bold text-white">
              Every Delivery. Every Mile. In Sight.
            </h4>
            <p className="text-xs text-[#DCE5EC]">
              From booking and dispatch allocation to live GPS streaming and verified OTP completion.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#00A6A6] bg-[#123B5D] px-4 py-2 rounded-xl border border-[#176B87] shrink-0">
            <CheckCircle2 className="w-4 h-4 text-[#00A6A6]" />
            <span>Operational Integrity Guaranteed</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingAbout;

