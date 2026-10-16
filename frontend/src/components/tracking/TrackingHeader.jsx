import React from 'react';
import TrackingStatus from './TrackingStatus';
import { Navigation, Compass } from 'lucide-react';

export const TrackingHeader = ({
  isLive,
  connectionStatus,
  lastUpdatedText,
  onCenterCourier,
  hasCourierLocation,
}) => {
  return (
    <div className="p-4 sm:p-5 border-b border-[#D9DEE5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-t-xl">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[#172033]/5 text-[#172033] flex items-center justify-center">
          <Compass className="w-4 h-4 text-[#D97706]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#172033]">Live Route & Courier Tracking</h3>
          <p className="text-[11px] text-[#667085]">Real-time GPS positioning stream</p>
        </div>
      </div>

      <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end flex-wrap">
        <TrackingStatus
          isLive={isLive}
          connectionStatus={connectionStatus}
          lastUpdatedText={lastUpdatedText}
          hasLocation={hasCourierLocation}
        />

        {hasCourierLocation && onCenterCourier && (
          <button
            type="button"
            onClick={onCenterCourier}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#D9DEE5] bg-white hover:bg-[#F4F6F8] text-[#172033] text-xs font-semibold shadow-2xs transition cursor-pointer"
            title="Recenter map on courier"
          >
            <Navigation className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Center on Courier</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default TrackingHeader;
