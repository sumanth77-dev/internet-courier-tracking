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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>LIVE</span>
        </span>
      ) : showLastAvailable ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-medium border border-amber-200">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span>Last location available; courier currently offline</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 text-gray-600 font-medium border border-gray-200">
          <span className="w-2 h-2 rounded-full bg-gray-400"></span>
          <span>No location received yet</span>
        </span>
      )}

      {/* Socket connection indicator */}
      {connectionStatus === 'reconnecting' && (
        <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>Connection interrupted. Reconnecting...</span>
        </span>
      )}

      {connectionStatus === 'connecting' && (
        <span className="inline-flex items-center gap-1 text-[#667085] bg-gray-50 px-2 py-0.5 rounded border border-[#D9DEE5] text-[11px]">
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>Connecting...</span>
        </span>
      )}

      {connectionStatus === 'error' && (
        <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200 text-[11px]">
          <AlertCircle className="w-3 h-3" />
          <span>Disconnected</span>
        </span>
      )}

      {/* Last Updated Timestamp */}
      {lastUpdatedText && (
        <span className="text-[#667085] text-[11px] ml-auto">
          Last updated: <strong className="text-[#172033] font-medium">{lastUpdatedText}</strong>
        </span>
      )}
    </div>
  );
};

export default TrackingStatus;
