import React from 'react';
import {
  MapPin,
  Layers,
  Radio,
  UserCheck,
  ShieldCheck,
  Clock,
} from 'lucide-react';

export const LandingFeatures = () => {
  const features = [
    {
      icon: MapPin,
      title: 'Real-Time GPS Tracking',
      description:
        'Continuous high-frequency GPS coordinate streaming with road-snapped route visualization on interactive Leaflet maps.',
      badge: 'Core Engine',
      isDark: true,
    },
    {
      icon: Layers,
      title: 'Smart Shipment Management',
      description:
        'End-to-end dispatching, manifest generation, package weight categorization, and multi-portal status synchronization.',
      badge: 'Operations',
      isDark: false,
    },
    {
      icon: Radio,
      title: 'Live Delivery Updates',
      description:
        'Instant multi-stage progression alerts as parcels move from booking and pickup to in-transit and final doorstep arrival.',
      badge: 'Real-Time',
      isDark: true,
    },
    {
      icon: UserCheck,
      title: 'Courier Assignment',
      description:
        'Efficient administrative allocation of available delivery agents with route readiness and instant mobile notification.',
      badge: 'Fleet Dispatch',
      isDark: false,
    },
    {
      icon: ShieldCheck,
      title: 'Secure Proof of Delivery',
      description:
        'Tamper-resistant delivery verification requiring recipient OTP authentication and photographic drop-off capture.',
      badge: 'Verification',
      isDark: true,
    },
    {
      icon: Clock,
      title: 'Shipment History & Timeline',
      description:
        'Complete chronological audit trail with exact milestone timestamps, courier notes, and immutable delivery records.',
      badge: 'Audit Trail',
      isDark: false,
    },
  ];

  return (
    <section id="features" className="py-20 lg:py-28 bg-[#F2F0ED] border-b border-[#DEDCD8] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#DEDCD8] mb-3.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF7547]"></span>
            <span className="text-xs font-bold text-[#202020] uppercase tracking-wider">
              Platform Capabilities
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#202020] tracking-tight">
            Engineered for Precision Logistics
          </h2>
          <p className="mt-3.5 text-sm sm:text-base text-[#777777] leading-relaxed max-w-2xl mx-auto">
            Every feature in SkyRoute is purpose-built to deliver complete visibility, strict security, and effortless dispatch coordination.
          </p>
        </div>

        {/* 6 Informational Cards Grid (Mixture of Charcoal & Warm White Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 items-stretch">
          {features.map((feature) => {
            const Icon = feature.icon;
            const isDark = feature.isDark;

            return (
              <div
                key={feature.title}
                className={`rounded-2xl p-6 sm:p-7 flex flex-col justify-between h-full transition-shadow duration-200 ${
                  isDark
                    ? 'bg-[#242424] text-white border border-[#383838] shadow-md'
                    : 'bg-white text-[#202020] border border-[#DEDCD8] shadow-2xs'
                }`}
              >
                <div>
                  {/* Card Header: Icon & Category Tag */}
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                        isDark
                          ? 'bg-[#171717] border border-[#383838]'
                          : 'bg-[#F2F0ED] border border-[#DEDCD8]'
                      }`}
                    >
                      <Icon className="w-5 h-5 text-[#FF7547]" />
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                        isDark
                          ? 'bg-[#303030] border-[#414141] text-[#C5C5C5]'
                          : 'bg-[#F2F0ED] border-[#DEDCD8] text-[#202020]'
                      }`}
                    >
                      {feature.badge}
                    </span>
                  </div>

                  {/* Feature Title */}
                  <h3
                    className={`text-base sm:text-lg font-bold mb-2.5 tracking-tight ${
                      isDark ? 'text-white' : 'text-[#202020]'
                    }`}
                  >
                    {feature.title}
                  </h3>

                  {/* Feature Description */}
                  <p
                    className={`text-xs sm:text-sm leading-relaxed ${
                      isDark ? 'text-[#C5C5C5]' : 'text-[#777777]'
                    }`}
                  >
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LandingFeatures;
