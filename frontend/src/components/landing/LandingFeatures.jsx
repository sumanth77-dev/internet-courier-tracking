import React from 'react';
import {
  MapPin,
  Layers,
  Radio,
  UserCheck,
  ShieldCheck,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const LandingFeatures = () => {
  const features = [
    {
      icon: MapPin,
      title: 'Real-Time GPS Tracking',
      description:
        'Continuous high-frequency GPS coordinate streaming with road-snapped route visualization on interactive Leaflet maps.',
      badge: 'Core Engine',
    },
    {
      icon: Layers,
      title: 'Smart Shipment Management',
      description:
        'End-to-end dispatching, manifest generation, package weight categorization, and multi-portal status synchronization.',
      badge: 'Operations',
    },
    {
      icon: Radio,
      title: 'Live Delivery Updates',
      description:
        'Instant multi-stage progression alerts as parcels move from booking and pickup to in-transit and final doorstep arrival.',
      badge: 'Real-Time',
    },
    {
      icon: UserCheck,
      title: 'Courier Assignment',
      description:
        'Efficient administrative allocation of available delivery agents with route readiness and instant mobile notification.',
      badge: 'Fleet Dispatch',
    },
    {
      icon: ShieldCheck,
      title: 'Secure Proof of Delivery',
      description:
        'Tamper-resistant delivery verification requiring recipient OTP authentication and photographic drop-off capture.',
      badge: 'Verification',
    },
    {
      icon: Clock,
      title: 'Shipment History & Timeline',
      description:
        'Complete chronological audit trail with exact milestone timestamps, courier notes, and immutable delivery records.',
      badge: 'Audit Trail',
    },
  ];

  return (
    <section id="features" className="py-16 lg:py-24 bg-white border-b border-[#D5DEE7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8EEF4] border border-[#D5DEE7] mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00A6A6]"></span>
            <span className="text-xs font-bold text-[#142B45] uppercase tracking-wider">
              Platform Capabilities
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#142B45] tracking-tight">
            Engineered for Precision Logistics
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#607487] leading-relaxed">
            Every feature in SkyRoute is purpose-built to deliver complete visibility, strict security, and effortless dispatch coordination.
          </p>
        </div>

        {/* 6 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="bg-[#F0F3F7] rounded-2xl border border-[#D5DEE7] p-6 hover:border-[#00A6A6] transition-colors duration-200 flex flex-col justify-between shadow-2xs group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-[#0B1F33] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:bg-[#123B5D] transition">
                      <Icon className="w-5 h-5 text-[#00A6A6]" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white border border-[#D5DEE7] text-[#123B5D]">
                      {feature.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#142B45] mb-2">
                    {feature.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#607487] leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-[#D5DEE7]/70 flex items-center justify-between text-xs font-semibold text-[#176B87] group-hover:text-[#00A6A6] transition-colors">
                  <span>Explore capability</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
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
