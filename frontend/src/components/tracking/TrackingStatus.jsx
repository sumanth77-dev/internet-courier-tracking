import React from 'react';
import { Radio, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * Renders status indicators for Live GPS socket and coordinate freshness
 */
export const TrackingStatus = ({ isLive, connectionStatus, lastUpdatedText, hasLocation = false }) => {
  const showLastAvailable = !isLive && (hasLocation || Boolean(lastUpdatedText));

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {/* Live / Offline / Waiting Badge */}
      {isLive ? (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#16A36A] font-semibold border border-emerald-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16A36A]"></span>
          </span>
          <span>LIVE</span>
        </span>
      ) : showLastAvailable ? (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 font-medium border border-amber-200">
          <span className="w-2 h-2 rounded-full bg-[#E6A23C]"></span>
          <span>Last known coordinates; courier currently offline</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4F6F8] text-[#718096] font-medium border border-[#E2E8F0]">
          <span className="w-2 h-2 rounded-full bg-[#718096]"></span>
          <span>Awaiting coordinates</span>
        </span>
      )}

      {/* Socket connection indicator */}
      {connectionStatus === 'reconnecting' && (
        <span className="inline-flex items-center gap-1 text-[#E6A23C] bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 text-[11px]">
          <RefreshCw className="w-3 h-3 animate-spin text-[#E6A23C]" />
          <span>Reconnecting...</span>
        </span>
      )}

      {connectionStatus === 'connecting' && (
        <span className="inline-flex items-center gap-1 text-[#718096] bg-[#F4F6F8] px-2 py-0.5 rounded-lg border border-[#E2E8F0] text-[11px]">
          <RefreshCw className="w-3 h-3 animate-spin text-[#18A6A0]" />
          <span>Connecting...</span>
        </span>
      )}

      {connectionStatus === 'error' && (
        <span className="inline-flex items-center gap-1 text-[#DC5353] bg-red-50 px-2 py-0.5 rounded-lg border border-red-200 text-[11px]">
          <AlertCircle className="w-3 h-3" />
          <span>Disconnected</span>
        </span>
      )}

      {/* Last Updated Timestamp */}
      {lastUpdatedText && (
        <span className="text-[#718096] text-[11px] ml-auto">
          Last updated: <strong className="text-[#182433] font-medium">{lastUpdatedText}</strong>
        </span>
      )}
    </div>
  );
};

export default TrackingStatus;
