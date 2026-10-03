import React from 'react';
import { Check, Clock, AlertTriangle } from 'lucide-react';

const STAGES = [
  { key: 'Pending', label: 'Order Created', desc: 'Awaiting courier assignment' },
  { key: 'Assigned', label: 'Courier Assigned', desc: 'Ready for parcel pickup' },
  { key: 'Picked Up', label: 'Picked Up', desc: 'Package picked up from sender' },
  { key: 'In Transit', label: 'In Transit', desc: 'Package on the way to destination hub' },
  { key: 'Out for Delivery', label: 'Out for Delivery', desc: 'Courier is en route to recipient' },
  { key: 'Delivered', label: 'Delivered', desc: 'Package received by recipient' },
];

const ShipmentTimeline = ({ currentStatus = 'Pending', pickedUpAt, deliveredAt }) => {
  if (currentStatus === 'Cancelled') {
    return (
      <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-[#B91C1C]">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <div>
          <h4 className="text-sm font-bold">Shipment Cancelled</h4>
          <p className="text-xs text-red-700 mt-0.5">
            This shipment has been cancelled and will not progress further.
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = STAGES.findIndex((s) => s.key === currentStatus);

  return (
    <div className="py-2">
      <div className="relative">
        {/* Progress Line */}
        <div className="hidden sm:block absolute top-4 left-6 right-6 h-0.5 bg-[#D9DEE5] -z-0" />
        <div
          className="hidden sm:block absolute top-4 left-6 h-0.5 bg-[#172033] -z-0 transition-all duration-300"
          style={{
            width: `${Math.max(0, (currentIndex / (STAGES.length - 1)) * 100)}%`,
          }}
        />

        {/* Steps List */}
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 sm:gap-2">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;

            return (
              <div
                key={stage.key}
                className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2 relative z-10"
              >
                {/* Circle Icon Indicator */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                    isCompleted
                      ? 'bg-[#172033] border-[#172033] text-white shadow-xs'
                      : isCurrent
                      ? 'bg-white border-[#D97706] text-[#D97706] ring-3 ring-[#D97706]/20'
                      : 'bg-white border-[#D9DEE5] text-[#667085]'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : isCurrent ? (
                    <Clock className="w-4 h-4 animate-pulse text-[#D97706]" />
                  ) : (
                    <span className="text-[11px] font-bold text-[#667085]">{idx + 1}</span>
                  )}
                </div>

                {/* Text Content */}
                <div className="flex-1 sm:flex-none">
                  <p
                    className={`text-xs font-bold leading-tight ${
                      isCurrent
                        ? 'text-[#D97706]'
                        : isCompleted
                        ? 'text-[#172033]'
                        : 'text-[#667085]'
                    }`}
                  >
                    {stage.label}
                  </p>
                  <p className="text-[11px] text-[#667085] hidden sm:block mt-0.5 leading-snug">
                    {stage.desc}
                  </p>

                  {/* Dynamic Timestamps */}
                  {stage.key === 'Picked Up' && pickedUpAt && (
                    <span className="block text-[10px] text-[#172033] font-semibold mt-0.5">
                      {new Date(pickedUpAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  {stage.key === 'Delivered' && deliveredAt && (
                    <span className="block text-[10px] text-[#15803D] font-semibold mt-0.5">
                      {new Date(deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ShipmentTimeline;
