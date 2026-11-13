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
      <div className="p-4 rounded-2xl bg-[#FDF1F0] border border-[#F8D0CE] flex items-center gap-3 text-[#E45B54]">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <div>
          <h4 className="text-sm font-bold">Shipment Cancelled</h4>
          <p className="text-xs text-[#C74740] mt-0.5">
            This shipment has been cancelled and will not progress further.
          </p>
        </div>
      </div>
    );
  }

  const isDelivered = currentStatus === 'Delivered';
  const currentIndex = STAGES.findIndex((s) => s.key === currentStatus);

  return (
    <div className="py-2">
      {/* Desktop Horizontal View (>= 640px) */}
      <div className="hidden sm:block relative">
        {/* Background track line */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-[#DEDCD8] -z-0" />
        {/* Active/Completed progress fill: Green (#36A879) when Delivered, Coral (#FF7547) when in-progress */}
        <div
          className={`absolute top-4 left-6 h-0.5 transition-all duration-300 -z-0 ${
            isDelivered ? 'bg-[#36A879]' : 'bg-[#FF7547]'
          }`}
          style={{
            width: `${Math.max(0, (currentIndex / (STAGES.length - 1)) * 100)}%`,
          }}
        />

        <div className="grid grid-cols-6 gap-2">
          {STAGES.map((stage, idx) => {
            // Once Delivered, all stages up to and including Delivered are marked completed
            const isCompleted = isDelivered ? idx <= currentIndex : idx < currentIndex;
            const isCurrent = !isDelivered && idx === currentIndex;

            return (
              <div
                key={stage.key}
                className="flex flex-col items-center text-center gap-2 relative z-10"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                    isCompleted
                      ? 'bg-[#171717] border-[#171717] text-white shadow-2xs'
                      : isCurrent
                      ? 'bg-white border-[#FF7547] text-[#FF7547] ring-3 ring-[#FF7547]/20'
                      : 'bg-white border-[#DEDCD8] text-[#A7A7A7]'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3] text-[#36A879]" />
                  ) : isCurrent ? (
                    <Clock className="w-4 h-4 animate-pulse text-[#FF7547]" />
                  ) : (
                    <span className="text-[11px] font-bold text-[#A7A7A7]">{idx + 1}</span>
                  )}
                </div>

                <div>
                  <p
                    className={`text-xs font-bold leading-tight ${
                      isCurrent
                        ? 'text-[#FF7547]'
                        : isCompleted
                        ? (stage.key === 'Delivered' && isDelivered ? 'text-[#36A879]' : 'text-[#202020]')
                        : 'text-[#777777]'
                    }`}
                  >
                    {stage.label}
                  </p>
                  <p className="text-[10px] text-[#777777] mt-0.5 leading-snug">
                    {stage.desc}
                  </p>

                  {stage.key === 'Picked Up' && pickedUpAt && (
                    <span className="inline-block text-[10px] text-[#202020] font-bold mt-1 px-1.5 py-0.5 rounded bg-[#F2F0ED]">
                      {new Date(pickedUpAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  {stage.key === 'Delivered' && deliveredAt && (
                    <span className="inline-block text-[10px] text-[#238259] font-bold mt-1 px-1.5 py-0.5 rounded bg-[#EAF7F1] border border-[#C4E8D8]">
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
          const isCompleted = isDelivered ? idx <= currentIndex : idx < currentIndex;
          const isCurrent = !isDelivered && idx === currentIndex;
          const isLast = idx === STAGES.length - 1;

          return (
            <div key={stage.key} className="flex items-start gap-3 relative">
              {/* Connecting Vertical Line */}
              {!isLast && (
                <div
                  className={`absolute left-3.5 top-7 bottom-0 w-0.5 -ml-[1px] ${
                    isCompleted
                      ? (isDelivered ? 'bg-[#36A879]' : 'bg-[#FF7547]')
                      : 'bg-[#DEDCD8]'
                  }`}
                  style={{ height: 'calc(100% + 8px)' }}
                />
              )}

              {/* Node Circle */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 relative z-10 ${
                  isCompleted
                    ? 'bg-[#171717] border-[#171717] text-white'
                    : isCurrent
                    ? 'bg-white border-[#FF7547] text-[#FF7547] ring-3 ring-[#FF7547]/20'
                    : 'bg-white border-[#DEDCD8] text-[#A7A7A7]'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 text-[#36A879]" />
                ) : isCurrent ? (
                  <Clock className="w-3.5 h-3.5 text-[#FF7547] animate-pulse" />
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
                        ? 'text-[#FF7547]'
                        : isCompleted
                        ? (stage.key === 'Delivered' && isDelivered ? 'text-[#36A879]' : 'text-[#202020]')
                        : 'text-[#777777]'
                    }`}
                  >
                    {stage.label}
                  </p>
                  {isCurrent && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#FFF2ED] text-[#FF7547] border border-[#FFD6C9]">
                      Active
                    </span>
                  )}
                  {isDelivered && stage.key === 'Delivered' && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#EAF7F1] text-[#238259] border border-[#C4E8D8]">
                      Delivered
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#777777] leading-tight mt-0.5">
                  {stage.desc}
                </p>

                {stage.key === 'Picked Up' && pickedUpAt && (
                  <span className="inline-block text-[10px] text-[#202020] font-semibold mt-1">
                    At {new Date(pickedUpAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                {stage.key === 'Delivered' && deliveredAt && (
                  <span className="inline-block text-[10px] text-[#238259] font-semibold mt-1">
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
