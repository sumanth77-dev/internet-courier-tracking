import React from 'react';
import {
  PackagePlus,
  UserCheck,
  Navigation,
  CheckCircle,
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
    <section id="how-it-works" className="py-20 lg:py-28 bg-white border-b border-[#DEDCD8] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2F0ED] border border-[#DEDCD8] mb-3.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF7547]"></span>
            <span className="text-xs font-bold text-[#202020] uppercase tracking-wider">
              Workflow Lifecycle
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#202020] tracking-tight">
            How SkyRoute Works
          </h2>
          <p className="mt-3.5 text-sm sm:text-base text-[#777777] leading-relaxed max-w-2xl mx-auto">
            From initial booking to validated doorstep drop-off, the delivery journey unfolds seamlessly in 4 coordinated steps.
          </p>
        </div>

        {/* 4 Process Steps Layout with Dark Charcoal Cards & Coral Orange Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7 items-stretch">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="bg-[#242424] text-white rounded-2xl border border-[#383838] p-6 sm:p-7 relative flex flex-col justify-between shadow-md hover:border-[#FF7547] transition duration-200 h-full"
              >
                <div>
                  {/* Step Number & Icon */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="w-10 h-10 rounded-xl bg-[#171717] border border-[#383838] text-[#FF7547] font-black text-sm flex items-center justify-center shadow-xs">
                      {step.number}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-[#303030] text-[#FF7547] border border-[#414141] flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Subtitle & Title */}
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF7547] block mb-1">
                    {step.subtitle}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-white mb-2.5 tracking-tight">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-[#C5C5C5] leading-relaxed mb-4">
                    {step.description}
                  </p>
                </div>

                {/* Highlight Badge */}
                <div className="pt-3 border-t border-[#383838] mt-auto">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#FF7547] bg-[#FF7547]/10 px-2.5 py-1 rounded-md border border-[#FF7547]/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF7547]"></span>
                    <span>{step.highlight}</span>
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

export default LandingHowItWorks;
