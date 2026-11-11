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
  connectionStatus,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#18A6A0]/10 text-[#18A6A0] flex items-center justify-center">
            <Radio
              className={`w-4 h-4 ${
                isTracking ? 'text-[#16A36A] animate-pulse' : 'text-[#18A6A0]'
              }`}
            />
          </div>
          <div>
            <h2 className="text-xs font-bold text-[#182433] uppercase tracking-wider">
              Live Location Broadcast
            </h2>
            <p className="text-[11px] text-[#718096]">Stream real device GPS coordinates to customers and dispatch</p>
          </div>
        </div>

        {/* Location Source Selector / Status */}
        <div className="flex items-center gap-2">
          {isTracking ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#16A36A] font-semibold border border-emerald-200 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16A36A]"></span>
              </span>
              <span>GPS Streaming</span>
            </span>
          ) : isStarting ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-[#245B78] font-medium border border-blue-200 text-xs">
              <RefreshCw className="w-3 h-3 animate-spin text-[#18A6A0]" />
              <span>Acquiring GPS...</span>
            </span>
          ) : status === 'ERROR' ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-50 text-[#DC5353] font-medium border border-red-200 text-xs">
              <AlertCircle className="w-3 h-3" />
              <span>GPS Error</span>
            </span>
          ) : status === 'STOPPED' ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-[#718096] font-medium border border-[#E2E8F0] text-xs">
              <span>Sharing Inactive</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-[#718096] font-medium border border-[#E2E8F0] text-xs">
              <span>Ready</span>
            </span>
          )}
        </div>
      </div>

      {/* Mode Choice Notice / Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-[#F4F6F8] rounded-xl border border-[#E2E8F0] text-xs">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-[#142B45]" />
          <span className="font-semibold text-[#182433]">Tracking Source: Real Device GPS Hardware</span>
        </div>
        <Link
          to="/courier/simulator"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#F4F6F8] text-[#142B45] font-semibold border border-[#E2E8F0] shadow-xs transition self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#18A6A0]" />
          <span>Switch to GPS Simulator (Demo)</span>
        </Link>
      </div>

      {/* Main Body */}
      <div className="space-y-4">
        {status === 'NOT_SHARING' && (
          <p className="text-xs text-[#718096] leading-relaxed">
            Activate location sharing to broadcast your real-time vehicle coordinates to the customer and dispatch console. Coordinates are throttled for battery efficiency.
          </p>
        )}

        {status === 'STARTING' && (
          <div className="flex items-center gap-2.5 p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-[#245B78]">
            <RefreshCw className="w-4 h-4 animate-spin text-[#18A6A0] shrink-0" />
            <span>Requesting device location permissions... Please accept the browser geolocation prompt.</span>
          </div>
        )}

        {status === 'STOPPED' && (
          <p className="text-xs text-[#718096]">
            Location sharing has been halted. Customers will see your last recorded milestone.
          </p>
        )}

        {/* Error Alert */}
        {status === 'ERROR' && error && (
          <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-[#DC5353] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#DC5353]">Unable to access device location</p>
              <p className="text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Active GPS telemetry preview */}
        {isTracking && coords && (
          <div className="p-4 bg-[#F4F6F8] rounded-xl border border-[#E2E8F0] space-y-2.5">
            <div className="flex items-center justify-between text-xs text-[#182433] font-semibold border-b border-[#E2E8F0] pb-2">
              <span className="flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-[#18A6A0]" />
                <span>Live Hardware GPS Telemetry</span>
              </span>
              <span className="text-[11px] text-[#16A36A] font-medium">Streaming via Socket.IO</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs pt-1">
              <div>
                <span className="text-[#718096] text-[11px] block">Latitude</span>
                <span className="font-mono font-bold text-[#142B45]">
                  {coords.latitude ? coords.latitude.toFixed(6) : '—'}
                </span>
              </div>
              <div>
                <span className="text-[#718096] text-[11px] block">Longitude</span>
                <span className="font-mono font-bold text-[#142B45]">
                  {coords.longitude ? coords.longitude.toFixed(6) : '—'}
                </span>
              </div>
              <div>
                <span className="text-[#718096] text-[11px] block">Accuracy</span>
                <span className="font-semibold text-[#182433]">
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
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#DC5353] hover:bg-[#c44141] text-white text-xs font-semibold shadow-xs transition duration-150 cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Location Sharing</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartTracking}
              disabled={isStarting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#142B45] hover:bg-[#245B78] text-white text-xs font-semibold shadow-xs transition duration-150 disabled:opacity-60 cursor-pointer"
            >
              {isStarting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#18A6A0]" />
                  <span>Requesting GPS Access...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current text-[#18A6A0]" />
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
