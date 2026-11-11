import React from 'react';
import {
  PackagePlus,
  UserCheck,
  Navigation,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

export const LandingHowItWorks = () => {
  const steps = [
    {
      number: '01',
      title: 'Create a Shipment',
      subtitle: 'Customer Booking',
      description:
        'Customers enter pickup and delivery details, package weight, and recipient contact information with interactive address confirmation.',
      icon: PackagePlus,
      highlight: 'Interactive Map Pinning',
    },
    {
      number: '02',
      title: 'Assign a Courier',
      subtitle: 'Admin Dispatch',
      description:
        'Admin reviews active bookings and assigns an available courier from the registered fleet, immediately alerting the driver.',
      icon: UserCheck,
      highlight: 'Optimized Fleet Allocation',
    },
    {
      number: '03',
      title: 'Track in Real Time',
      subtitle: 'Live Telemetry',
      description:
        'Customers and dispatchers follow the courier’s live road location, heading, and dynamic estimated arrival time on Leaflet maps.',
      icon: Navigation,
      highlight: 'Sub-Second GPS Stream',
    },
    {
      number: '04',
      title: 'Confirm Delivery',
      subtitle: 'Verified Handoff',
      description:
        'Courier submits delivery photo and verifies the one-time password (OTP) provided by the recipient to finalize delivery.',
      icon: CheckCircle,
      highlight: 'Tamper-Proof Verification',
    },
  ];

  return (
    <section id="how-it-works" className="py-16 lg:py-24 bg-[#F0F3F7] border-b border-[#D5DEE7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#D5DEE7] mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00A6A6]"></span>
            <span className="text-xs font-bold text-[#142B45] uppercase tracking-wider">
              Workflow Lifecycle
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#142B45] tracking-tight">
            How SkyRoute Works
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#607487] leading-relaxed">
            From initial booking to validated doorstep drop-off, the delivery journey unfolds seamlessly in 4 coordinated steps.
          </p>
        </div>

        {/* 4 Process Steps Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="bg-white rounded-2xl border border-[#D5DEE7] p-6 relative flex flex-col justify-between shadow-2xs hover:border-[#00A6A6] transition-colors"
              >
                <div>
                  {/* Step Number & Icon */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-2xl font-black font-mono text-[#0B1F33]">
                      {step.number}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-[#E8EEF4] text-[#123B5D] flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#00A6A6]" />
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-[#176B87] uppercase tracking-wider block mb-1">
                    {step.subtitle}
                  </span>

                  <h3 className="text-base font-bold text-[#142B45] mb-2.5">
                    {step.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#607487] leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[#D5DEE7] flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#123B5D]">
                    {step.highlight}
                  </span>
                  {idx < 3 && (
                    <ArrowRight className="w-3.5 h-3.5 text-[#8A9BAA] hidden lg:block" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LandingHowItWorks;
