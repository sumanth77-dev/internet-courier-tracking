import React from 'react';
import {
  Users,
  Truck,
  Shield,
  CheckCircle2,
} from 'lucide-react';

export const LandingBenefits = () => {
  const roles = [
    {
      role: 'For Customers',
      tagline: 'End-to-End Visibility & Peace of Mind',
      icon: Users,
      badge: 'Senders & Recipients',
      description:
        'Customers receive transparent, live updates at every stage, eliminating guesswork with precise ETAs and verified delivery receipts.',
      benefits: [
        'Live sub-second map tracking from initial dispatch to doorstep',
        'Transparent delivery status milestones with chronological timestamps',
        'Secure 6-digit OTP delivery verification prevents fraudulent handovers',
        'Interactive address pinpointing for accurate driver routing',
        'Immediate digital Proof of Delivery with photo inspection',
      ],
    },
    {
      role: 'For Couriers',
      tagline: 'Streamlined Navigation & Proof of Delivery',
      icon: Truck,
      badge: 'Field Operations',
      description:
        'Couriers get a dedicated, distraction-free driver portal with turnkey route navigation, GPS simulation, and quick photo verification.',
      benefits: [
        'Turn-by-turn road route visualization snapped directly to OpenStreetMap',
        'One-tap status updates (Picked Up, In Transit, Out for Delivery)',
        'Built-in GPS simulation tools for testing and training runs',
        'Fast mobile photo capture for delivery proof documentation',
        'Real-time OTP verification check ensuring successful drop-offs',
      ],
    },
    {
      role: 'For Administrators',
      tagline: 'Unified Fleet Command & Real-Time Oversight',
      icon: Shield,
      badge: 'Logistics Control Center',
      description:
        'Logistics managers gain complete operational oversight with instant fleet assignment, status override, and complete audit tracking.',
      benefits: [
        'Centralized dashboard tracking all registered shipments and drivers',
        'Instant courier assignment with active capacity and status indicators',
        'Comprehensive audit trail with immutable status modification logs',
        'Complete photo and OTP verification logs for dispute resolution',
        'High-reliability Socket.IO WebSocket streams for sub-second fleet monitoring',
      ],
    },
  ];

  return (
    <section id="benefits" className="py-16 lg:py-24 bg-[#F2F0ED] border-b border-[#DEDCD8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#DEDCD8] mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF7547]"></span>
            <span className="text-xs font-bold text-[#202020] uppercase tracking-wider">
              Tailored Value
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#202020] tracking-tight">
            Built for Every Stakeholder
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#777777] leading-relaxed">
            Discover how SkyRoute delivers superior coordination, visibility, and accountability across the entire logistics chain.
          </p>
        </div>

        {/* 3 Pillars Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {roles.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.role}
                className="bg-white rounded-2xl border border-[#DEDCD8] p-7 flex flex-col justify-between shadow-2xs hover:border-[#FF7547] transition duration-200"
              >
                <div>
                  {/* Role Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#171717] text-white flex items-center justify-center shadow-xs border border-[#303030]">
                      <Icon className="w-6 h-6 text-[#FF7547]" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#F2F0ED] border border-[#DEDCD8] text-[#202020]">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[#202020] mb-1">
                    {item.role}
                  </h3>
                  <p className="text-xs font-bold text-[#FF7547] mb-3">
                    {item.tagline}
                  </p>
                  <p className="text-xs sm:text-sm text-[#777777] leading-relaxed mb-6">
                    {item.description}
                  </p>

                  {/* Checklist */}
                  <div className="space-y-3 pt-4 border-t border-[#DEDCD8]">
                    {item.benefits.map((benefit, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-[#202020]">
                        <CheckCircle2 className="w-4 h-4 text-[#FF7547] shrink-0 mt-0.5" />
                        <span className="leading-snug">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-[#DEDCD8] text-center">
                  <span className="text-[11px] font-bold text-[#777777] uppercase tracking-wider">
                    SkyRoute Verified System
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LandingBenefits;
