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
    <div className="p-4 sm:p-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-t-2xl">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-[#142B45]/10 text-[#142B45] flex items-center justify-center">
          <Compass className="w-4 h-4 text-[#18A6A0]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#142B45] tracking-tight">SkyRoute Live Tracking</h3>
          <p className="text-[11px] text-[#718096]">Real-time GPS courier navigation stream</p>
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F4F6F8] text-[#142B45] text-xs font-semibold shadow-xs transition cursor-pointer"
            title="Recenter map on courier"
          >
            <Navigation className="w-3.5 h-3.5 text-[#18A6A0]" />
            <span>Center Vehicle</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default TrackingHeader;
