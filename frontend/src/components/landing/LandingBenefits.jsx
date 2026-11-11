import React from 'react';
import {
  Users,
  Truck,
  Shield,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Clock,
  Camera,
  Smartphone,
  BarChart3,
  FileCheck,
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
      color: '#18A6A0',
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
      color: '#245B78',
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
      color: '#142B45',
    },
  ];

  return (
    <section id="benefits" className="py-16 lg:py-24 bg-[#F0F3F7] border-b border-[#D5DEE7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#D5DEE7] mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00A6A6]"></span>
            <span className="text-xs font-bold text-[#142B45] uppercase tracking-wider">
              Tailored Value
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#142B45] tracking-tight">
            Built for Every Stakeholder
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#607487] leading-relaxed">
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
                className="bg-white rounded-2xl border border-[#D5DEE7] p-7 flex flex-col justify-between shadow-2xs hover:border-[#00A6A6] transition duration-200"
              >
                <div>
                  {/* Role Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#0B1F33] text-white flex items-center justify-center shadow-xs">
                      <Icon className="w-6 h-6 text-[#00A6A6]" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#E8EEF4] border border-[#D5DEE7] text-[#123B5D]">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[#142B45] mb-1">
                    {item.role}
                  </h3>
                  <p className="text-xs font-semibold text-[#00A6A6] mb-3">
                    {item.tagline}
                  </p>
                  <p className="text-xs sm:text-sm text-[#607487] leading-relaxed mb-6">
                    {item.description}
                  </p>

                  {/* Checklist */}
                  <div className="space-y-3 pt-4 border-t border-[#D5DEE7]">
                    {item.benefits.map((benefit, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-[#142B45]">
                        <CheckCircle2 className="w-4 h-4 text-[#00A6A6] shrink-0 mt-0.5" />
                        <span className="leading-snug">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-[#D5DEE7] text-center">
                  <span className="text-[11px] font-bold text-[#123B5D] uppercase tracking-wider">
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

