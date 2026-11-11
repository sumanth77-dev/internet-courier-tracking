import React from 'react';
import { Check, Clock, AlertTriangle } from 'lucide-react';

const STAGES = [
  { key: 'Pending', label: 'Order Created', desc: 'Awaiting courier assignment' },
  { key: 'Assigned', label: 'Courier Assigned', desc: 'Ready for parcel pickup' },
  { key: 'Picked Up', label: 'Picked Up', desc: 'Package picked up from sender' },
  { key: 'In Transit', label: 'In Transit', desc: 'Package en route to hub/destination' },
  { key: 'Out for Delivery', label: 'Out for Delivery', desc: 'Courier en route to recipient' },
  { key: 'Delivered', label: 'Delivered', desc: 'Verified drop-off completed' },
];

const ShipmentTimeline = ({ currentStatus = 'Pending', pickedUpAt, deliveredAt }) => {
  if (currentStatus === 'Cancelled') {
    return (
      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-[#DC5353]">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <div>
          <h4 className="text-sm font-bold">Shipment Cancelled</h4>
          <p className="text-xs text-rose-800 mt-0.5">
            This shipment has been cancelled and will not progress further.
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = STAGES.findIndex((s) => s.key === currentStatus);

  return (
    <div className="py-2">
      {/* Desktop Horizontal View (>= 640px) */}
      <div className="hidden sm:block relative">
        {/* Background track line */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-[#E2E8F0] -z-0" />
        {/* Active progress fill */}
        <div
          className="absolute top-4 left-6 h-0.5 bg-[#18A6A0] -z-0 transition-all duration-300"
          style={{
            width: `${Math.max(0, (currentIndex / (STAGES.length - 1)) * 100)}%`,
          }}
        />

        <div className="grid grid-cols-6 gap-2">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;

            return (
              <div
                key={stage.key}
                className="flex flex-col items-center text-center gap-2 relative z-10"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                    isCompleted
                      ? 'bg-[#142B45] border-[#142B45] text-white shadow-2xs'
                      : isCurrent
                      ? 'bg-white border-[#18A6A0] text-[#18A6A0] ring-3 ring-[#18A6A0]/20'
                      : 'bg-white border-[#E2E8F0] text-[#718096]'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3] text-[#18A6A0]" />
                  ) : isCurrent ? (
                    <Clock className="w-4 h-4 animate-pulse text-[#18A6A0]" />
                  ) : (
                    <span className="text-[11px] font-bold text-[#718096]">{idx + 1}</span>
                  )}
                </div>

                <div>
                  <p
                    className={`text-xs font-bold leading-tight ${
                      isCurrent
                        ? 'text-[#18A6A0]'
                        : isCompleted
                        ? 'text-[#142B45]'
                        : 'text-[#718096]'
                    }`}
                  >
                    {stage.label}
                  </p>
                  <p className="text-[10px] text-[#718096] mt-0.5 leading-snug">
                    {stage.desc}
                  </p>

                  {stage.key === 'Picked Up' && pickedUpAt && (
                    <span className="inline-block text-[10px] text-[#142B45] font-bold mt-1 px-1.5 py-0.5 rounded bg-[#F4F6F8]">
                      {new Date(pickedUpAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  {stage.key === 'Delivered' && deliveredAt && (
                    <span className="inline-block text-[10px] text-[#16A36A] font-bold mt-1 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                      {new Date(deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Vertical View (< 640px) */}
      <div className="sm:hidden space-y-4 relative pl-2">
        {STAGES.map((stage, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isLast = idx === STAGES.length - 1;

          return (
            <div key={stage.key} className="flex items-start gap-3 relative">
              {/* Connecting Vertical Line */}
              {!isLast && (
                <div
                  className={`absolute left-3.5 top-7 bottom-0 w-0.5 -ml-[1px] ${
                    isCompleted ? 'bg-[#18A6A0]' : 'bg-[#E2E8F0]'
                  }`}
                  style={{ height: 'calc(100% + 8px)' }}
                />
              )}

              {/* Node Circle */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 relative z-10 ${
                  isCompleted
                    ? 'bg-[#142B45] border-[#142B45] text-white'
                    : isCurrent
                    ? 'bg-white border-[#18A6A0] text-[#18A6A0] ring-3 ring-[#18A6A0]/20'
                    : 'bg-white border-[#E2E8F0] text-[#718096]'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 text-[#18A6A0]" />
                ) : isCurrent ? (
                  <Clock className="w-3.5 h-3.5 text-[#18A6A0] animate-pulse" />
                ) : (
                  <span className="text-[10px] font-bold">{idx + 1}</span>
                )}
              </div>

              {/* Stage Info */}
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`text-xs font-bold leading-tight ${
                      isCurrent
                        ? 'text-[#18A6A0]'
                        : isCompleted
                        ? 'text-[#142B45]'
                        : 'text-[#718096]'
                    }`}
                  >
                    {stage.label}
                  </p>
                  {isCurrent && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-50 text-[#18A6A0] border border-teal-200">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#718096] leading-tight mt-0.5">
                  {stage.desc}
                </p>

                {stage.key === 'Picked Up' && pickedUpAt && (
                  <span className="inline-block text-[10px] text-[#142B45] font-semibold mt-1">
                    At {new Date(pickedUpAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                {stage.key === 'Delivered' && deliveredAt && (
                  <span className="inline-block text-[10px] text-[#16A36A] font-semibold mt-1">
                    At {new Date(deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShipmentTimeline;
