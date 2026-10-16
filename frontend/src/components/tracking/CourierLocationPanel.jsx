import { Link } from 'react-router-dom';
import { Radio, AlertCircle, Play, Square, RefreshCw, Compass, Sparkles, Smartphone } from 'lucide-react';

export const CourierLocationPanel = ({
  status,
  coords,
  error,
  isTracking,
  isStarting,
  onStartTracking,
  onStopTracking,
}) => {
  return (
    <div className="bg-white rounded-xl border border-[#D9DEE5] p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D9DEE5]/60">
        <div className="flex items-center gap-2">
          <Radio
            className={`w-4 h-4 ${
              isTracking ? 'text-emerald-600 animate-pulse' : 'text-[#D97706]'
            }`}
          />
          <h2 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
            Live Location Sharing
          </h2>
        </div>

        {/* Location Source Selector / Status */}
        <div className="flex items-center gap-2">
          {isTracking ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Real GPS Active</span>
            </span>
          ) : isStarting ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-200 text-xs">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Requesting GPS...</span>
            </span>
          ) : status === 'ERROR' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 font-medium border border-red-200 text-xs">
              <AlertCircle className="w-3 h-3" />
              <span>GPS Error</span>
            </span>
          ) : status === 'STOPPED' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-[#667085] font-medium border border-[#D9DEE5] text-xs">
              <span>Sharing Stopped</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-[#667085] font-medium border border-[#D9DEE5] text-xs">
              <span>Not Sharing</span>
            </span>
          )}
        </div>
      </div>

      {/* Mode Choice Notice / Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-[#F4F6F8] rounded-lg border border-[#D9DEE5] text-xs">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-[#172033]" />
          <span className="font-semibold text-[#172033]">Mode: Real Device GPS</span>
        </div>
        <Link
          to="/courier/simulator"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-amber-50 text-[#D97706] font-semibold border border-amber-300 shadow-2xs transition self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Switch to GPS Simulator (Demo)</span>
        </Link>
      </div>

      {/* Main Body */}
      <div className="space-y-4">
        {/* Status messages & description */}
        {status === 'NOT_SHARING' && (
          <p className="text-xs text-[#667085]">
            Start location sharing to make your real-time delivery location visible to the customer and dispatch center using your device GPS.
          </p>
        )}

        {status === 'STARTING' && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
            <span>Requesting device location permission... Please allow access when prompted.</span>
          </div>
        )}

        {status === 'STOPPED' && (
          <p className="text-xs text-[#667085]">
            Location sharing has been stopped. Customers will no longer receive live GPS coordinates.
          </p>
        )}

        {/* Error Alert */}
        {status === 'ERROR' && error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Unable to access device location</p>
              <p className="text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Active GPS telemetry preview */}
        {isTracking && coords && (
          <div className="p-3.5 bg-[#F4F6F8] rounded-lg border border-[#D9DEE5] space-y-2">
            <div className="flex items-center justify-between text-xs text-[#172033] font-semibold border-b border-[#D9DEE5]/60 pb-1.5">
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Current Device GPS Telemetry</span>
              </span>
              <span className="text-[11px] text-emerald-600 font-normal">Streaming to backend</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs pt-1">
              <div>
                <span className="text-[#667085] text-[11px] block">Latitude</span>
                <span className="font-mono font-bold text-[#172033]">
                  {coords.latitude ? coords.latitude.toFixed(6) : '—'}
                </span>
              </div>
              <div>
                <span className="text-[#667085] text-[11px] block">Longitude</span>
                <span className="font-mono font-bold text-[#172033]">
                  {coords.longitude ? coords.longitude.toFixed(6) : '—'}
                </span>
              </div>
              <div>
                <span className="text-[#667085] text-[11px] block">Accuracy</span>
                <span className="font-semibold text-[#172033]">
                  {coords.accuracy !== null ? `±${Math.round(coords.accuracy)} m` : '—'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div>
          {isTracking ? (
            <button
              type="button"
              onClick={onStopTracking}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition duration-150 cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Location Sharing</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartTracking}
              disabled={isStarting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#172033] hover:bg-[#0F172A] text-white text-xs font-semibold shadow-xs transition duration-150 disabled:opacity-60 cursor-pointer"
            >
              {isStarting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Requesting GPS Access...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current text-[#D97706]" />
                  <span>Start Device Location Sharing</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourierLocationPanel;
