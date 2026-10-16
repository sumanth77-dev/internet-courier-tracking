import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LiveTrackingMap from '../../components/tracking/LiveTrackingMap';
import StatusBadge from '../../components/common/StatusBadge';
import useTrackingSocket from '../../hooks/useTrackingSocket';
import useGpsSimulator from '../../hooks/useGpsSimulator';
import api from '../../services/api';
import { ProofOfDeliveryModal } from '../../components/delivery/ProofOfDeliveryModal';
import {
  Play,
  Pause,
  Square,
  RefreshCw,
  Compass,
  AlertTriangle,
  Radio,
  Gauge,
  Info,
  CheckCircle2,
  Sliders,
  Sparkles,
  Route,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';

const TRACKABLE_STATUSES = ['Assigned', 'Picked Up', 'In Transit', 'Out for Delivery'];
const SPEED_OPTIONS = [
  { value: 0.5, label: '0.5x (Slow)' },
  { value: 1, label: '1x (Normal)' },
  { value: 2, label: '2x (Fast)' },
  { value: 5, label: '5x (Presentation)' },
  { value: 10, label: '10x (Quick Test)' },
];

const GpsSimulator = () => {
  const [searchParams] = useSearchParams();
  const queryShipmentId = searchParams.get('shipmentId');

  const [shipments, setShipments] = useState([]);
  const [selectedShipmentId, setSelectedShipmentId] = useState(queryShipmentId || '');
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [podModalOpen, setPodModalOpen] = useState(false);

  // Socket.IO hook for courier
  const trackingSocket = useTrackingSocket({
    shipmentId: selectedShipment?._id || selectedShipment?.id || selectedShipmentId,
    role: 'courier',
    autoJoin: true,
  });

  // Handler passed to simulator to emit location to Socket.IO
  const handleLocationEmit = useCallback(
    ({ shipmentId, latitude, longitude, accuracy }) => {
      trackingSocket.sendLocationUpdate({
        shipmentId,
        latitude,
        longitude,
        accuracy,
      });
    },
    [trackingSocket]
  );

  // Callback when simulator automatically updates shipment status
  const handleStatusChange = useCallback((updatedShipment) => {
    setSelectedShipment((prev) => ({
      ...prev,
      status: updatedShipment.status,
      pickedUpAt: updatedShipment.pickedUpAt || prev?.pickedUpAt,
      deliveredAt: updatedShipment.deliveredAt || prev?.deliveredAt,
    }));
  }, []);

  // GPS Simulator hook (Per-shipment persistent state)
  const simulator = useGpsSimulator({
    shipmentId: selectedShipment?._id || selectedShipment?.id || selectedShipmentId,
    trackingId: selectedShipment?.trackingId,
    initialShipmentStatus: selectedShipment?.status || 'Assigned',
    pickupAddress: selectedShipment?.pickupAddress,
    deliveryAddress: selectedShipment?.deliveryAddress,
    onLocationEmit: handleLocationEmit,
    onStatusChange: handleStatusChange,
  });

  // Fetch assigned shipments for current courier
  const fetchAssignedShipments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/shipments/courier/assigned');
      if (res.data?.success) {
        const list = res.data.data?.shipments || [];
        setShipments(list);

        // Select matching or first trackable shipment
        if (list.length > 0) {
          let chosen = null;
          if (queryShipmentId) {
            chosen = list.find((s) => (s._id || s.id) === queryShipmentId || s.trackingId === queryShipmentId);
          }
          if (!chosen) {
            chosen = list.find((s) => TRACKABLE_STATUSES.includes(s.status)) || list[0];
          }
          if (chosen) {
            setSelectedShipmentId(chosen._id || chosen.id);
            setSelectedShipment(chosen);
          }
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assigned deliveries');
    } finally {
      setLoading(false);
    }
  }, [queryShipmentId]);

  useEffect(() => {
    fetchAssignedShipments();
  }, [fetchAssignedShipments]);

  // Handle shipment dropdown change
  const handleSelectShipment = (e) => {
    const sId = e.target.value;
    setSelectedShipmentId(sId);
    const found = shipments.find((s) => (s._id || s.id) === sId);
    setSelectedShipment(found || null);
    simulator.stop();
  };

  // Start Simulation
  const handleStartSimulation = async () => {
    if (!selectedShipment) return;

    if (!selectedShipment.pickupAddress?.latitude || !selectedShipment.deliveryAddress?.latitude) {
      setError('Pickup and delivery coordinates are required for GPS simulation.');
      return;
    }

    if (simulator.routeError) {
      setError(simulator.routeError);
      return;
    }

    setError('');
    const sId = selectedShipment._id || selectedShipment.id;

    // Join tracking room as courier (non-blocking)
    trackingSocket.startCourierTracking(sId);

    // If shipment already has progress or is paused, resume from saved position instead of resetting to 0
    if (simulator.progress > 0 || simulator.isPaused) {
      simulator.resume();
      return;
    }

    // Start simulation ticks
    const started = await simulator.start();
    if (!started && simulator.statusError) {
      setError(simulator.statusError);
    }
  };

  // Resume Simulation from paused/reopened state
  const handleResumeSimulation = () => {
    if (!selectedShipment) return;
    const sId = selectedShipment._id || selectedShipment.id;
    // Join tracking room as courier (non-blocking)
    trackingSocket.startCourierTracking(sId);
    simulator.resume();
  };

  // Stop Simulation (Preserves progress without deleting)
  const handleStopSimulation = () => {
    simulator.stop();
    if (selectedShipment) {
      const sId = selectedShipment._id || selectedShipment.id;
      trackingSocket.stopTracking(sId);
    }
  };

  // Restart Demo explicitly (user confirmation)
  const handleRestartDemo = () => {
    if (window.confirm('Reset this demo simulation back to the pickup location?')) {
      simulator.restartDemo();
    }
  };

  const isTrackable = selectedShipment ? TRACKABLE_STATUSES.includes(selectedShipment.status) : false;
  const isPending = selectedShipment?.status === 'Pending';
  const isDelivered = selectedShipment?.status === 'Delivered' || simulator.isCompleted;

  // Format liveLocation object to display on the simulation map
  const liveLocationForMap = simulator.currentPosition
    ? {
        latitude: simulator.currentPosition[0],
        longitude: simulator.currentPosition[1],
        accuracy: simulator.simulatedAccuracy,
        timestamp: new Date(),
        trackingId: selectedShipment?.trackingId,
      }
    : null;

  return (
    <DashboardLayout title="GPS Simulator">
      <div className="space-y-4 max-w-6xl mx-auto">
        {/* Amber Demonstration Notice */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-[#D97706] shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold text-[10px] tracking-wider uppercase">
                Demo Mode
              </span>
              <span className="font-bold text-[#172033]">Real Road GPS Simulation Engine</span>
            </div>
            <p className="text-[#263449] leading-relaxed">
              This simulator calculates the real road route via OSRM, streams coordinate steps through the live Socket.IO server, and advances the shipment status (<code className="bg-amber-100 px-1 py-0.5 rounded">Assigned → Picked Up → In Transit → Out for Delivery</code>). Upon reaching the destination, movement halts at 100% in Out for Delivery and requires Proof of Delivery (Package Photo + Customer OTP verification) before marking as Delivered.
            </p>
          </div>
        </div>

        {/* Main Grid: Left Map + Right Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Map Column (2 spans on desktop) */}
          <div className="lg:col-span-2 space-y-3">
            <LiveTrackingMap
              liveLocation={liveLocationForMap}
              pickupAddress={selectedShipment?.pickupAddress}
              deliveryAddress={selectedShipment?.deliveryAddress}
              fullRoute={simulator.routePoints}
              travelledPath={simulator.travelledPath}
              routeDistanceKm={simulator.routeData?.distanceKm}
              routeDurationMinutes={simulator.routeData?.durationMinutes}
              connectionStatus={trackingSocket.connectionStatus}
              trackingId={selectedShipment?.trackingId}
              courierName={selectedShipment?.courierId?.name || 'Courier (Simulated)'}
              height="520px"
            />
          </div>

          {/* Controls Column */}
          <div className="space-y-4">
            {/* Shipment Selection & Controls */}
            <div className="bg-white rounded-xl border border-[#D9DEE5] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#D9DEE5]/60">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#172033]" />
                  <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                    Simulation Controls
                  </h3>
                </div>
                {simulator.isRunning ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>Broadcasting</span>
                  </span>
                ) : simulator.isPaused ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold border border-amber-200">
                    <span>Paused ({simulator.progress}%)</span>
                  </span>
                ) : simulator.isCompleted ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                    <span>Delivered</span>
                  </span>
                ) : simulator.isRouteLoading ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-200">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    <span>Finding Route</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-[#667085] text-[11px] font-medium border border-[#D9DEE5]">
                    <span>Ready</span>
                  </span>
                )}
              </div>

              {/* Shipment Select Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                  Select Assigned Delivery
                </label>
                <select
                  value={selectedShipmentId}
                  onChange={handleSelectShipment}
                  disabled={simulator.isRunning}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#D9DEE5] bg-white text-[#172033] focus:outline-hidden focus:border-[#172033] disabled:bg-[#F4F6F8] transition"
                >
                  {shipments.length === 0 ? (
                    <option value="">No assigned shipments found</option>
                  ) : (
                    shipments.map((s) => (
                      <option key={s._id || s.id} value={s._id || s.id}>
                        {s.trackingId} — {s.status} ({s.deliveryAddress?.city || 'Destination'})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Real Road Route Discovery Status */}
              <div className="p-3 rounded-lg bg-[#F4F6F8] border border-[#D9DEE5] text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[#667085] font-medium flex items-center gap-1.5">
                    <Route className="w-3.5 h-3.5 text-[#D97706]" />
                    <span>OSRM Road Engine:</span>
                  </span>
                  {simulator.isLoadingRoute ? (
                    <span className="text-blue-600 font-semibold flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Finding road route...</span>
                    </span>
                  ) : simulator.routeError ? (
                    <span className="text-red-600 font-semibold">Route error</span>
                  ) : simulator.routeData ? (
                    <span className="text-emerald-700 font-semibold">Road route ready</span>
                  ) : (
                    <span className="text-[#667085]">Awaiting coordinates</span>
                  )}
                </div>

                {simulator.routeData && (
                  <div className="flex items-center justify-between text-[#172033] pt-1 border-t border-[#D9DEE5]/60 text-[11px]">
                    <span>
                      Total: <strong>{simulator.routeData.distanceKm} km</strong>
                    </span>
                    <span>
                      Remaining: <strong>{simulator.distanceRemainingKm} km</strong>
                    </span>
                    <span>
                      Est: <strong>~{simulator.routeData.durationMinutes} min</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Status Milestone Display */}
              {selectedShipment && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F4F6F8] border border-[#D9DEE5]">
                  <span className="text-xs font-semibold text-[#667085]">Current Status:</span>
                  <StatusBadge status={simulator.currentShipmentStatus || selectedShipment.status} size="sm" />
                </div>
              )}

              {/* Ineligible state warnings */}
              {isPending && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Shipment must be assigned to a courier before simulation can start.
                  </span>
                </div>
              )}

              {/* Speed Multiplier */}
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1.5 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>Simulation Speed</span>
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {SPEED_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => simulator.setSpeed(opt.value)}
                      className={`py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer text-center ${
                        simulator.speed === opt.value
                          ? 'bg-[#172033] text-white border-[#172033] shadow-xs'
                          : 'bg-white text-[#667085] border-[#D9DEE5] hover:bg-[#F4F6F8]'
                      }`}
                    >
                      {opt.value}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs font-semibold text-[#172033]">
                  <span>Road Route Progress</span>
                  <span className="font-mono">{simulator.progress}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#F4F6F8] rounded-full overflow-hidden border border-[#D9DEE5]">
                  <div
                    className="h-full bg-gradient-to-r from-[#172033] to-[#D97706] transition-all duration-300 rounded-full"
                    style={{ width: `${simulator.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Simulator Action Buttons (Non-auto-start) */}
              <div className="pt-2 space-y-2">
                {simulator.isRouteLoading && !isDelivered && (
                  <button
                    type="button"
                    disabled
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#172033]/70 text-white text-xs font-semibold shadow-xs cursor-not-allowed"
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#D97706]" />
                    <span>Finding Road Route...</span>
                  </button>
                )}

                {(simulator.isReady || (simulator.isIdle && simulator.progress === 0)) && !simulator.isRouteLoading && !isDelivered && (
                  <button
                    type="button"
                    onClick={handleStartSimulation}
                    disabled={
                      !selectedShipment ||
                      !isTrackable ||
                      simulator.isLoadingRoute ||
                      !simulator.routeData
                    }
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#172033] hover:bg-[#0F172A] text-white text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current text-[#D97706]" />
                    <span>Start GPS Simulation</span>
                  </button>
                )}

                {(simulator.isPaused || (!simulator.isRunning && simulator.progress > 0)) && !isDelivered && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleResumeSimulation}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Resume ({simulator.progress}%)</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleStopSimulation}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                      >
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>Stop</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleRestartDemo}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D9DEE5] hover:bg-[#F4F6F8] text-[#667085] hover:text-[#172033] text-[11px] font-medium transition cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Demo to Start</span>
                    </button>
                  </div>
                )}

                {simulator.isRunning && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={simulator.pause}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                    >
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Pause</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleStopSimulation}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop Session</span>
                    </button>
                  </div>
                )}

                {/* Out for Delivery / Destination Reached POD Verification Prompt */}
                {(selectedShipment?.status === 'Out for Delivery' || simulator.progress >= 100) && !isDelivered && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-400 space-y-2">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-xs text-[#172033]">
                          {simulator.progress >= 100 ? 'Destination Reached (100%)' : 'Out for Delivery Stage'}
                        </h4>
                        <p className="text-[11px] text-[#263449] leading-relaxed">
                          Package is at destination. Collect the customer's 6-digit OTP and take a package photo to verify delivery.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPodModalOpen(true)}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Complete Delivery (POD)</span>
                    </button>
                  </div>
                )}

                {isDelivered && (
                  <div className="space-y-2">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Demo Completed. Shipment has been marked as Delivered (100%).</span>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        to={`/courier/shipments/${selectedShipment?._id || selectedShipment?.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-[#172033] hover:bg-[#0F172A] text-white text-xs font-semibold shadow-xs transition"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={handleRestartDemo}
                        className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-[#D9DEE5] hover:bg-[#F4F6F8] text-[#172033] text-xs font-semibold shadow-xs transition cursor-pointer"
                        title="Restart simulation for testing"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restart</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {(error || simulator.statusError) && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  {error || simulator.statusError}
                </div>
              )}
            </div>

            {/* Simulated GPS Telemetry Card */}
            <div className="bg-white rounded-xl border border-[#D9DEE5] p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#D9DEE5]/60">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#D97706]" />
                  <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                    Simulated GPS Telemetry
                  </h3>
                </div>
                <span className="text-[10px] text-[#667085] font-mono">
                  Road Point {simulator.currentIndex + 1}/{simulator.totalPoints || 0}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-[#F4F6F8] border border-[#D9DEE5]">
                  <span className="text-[#667085] text-[11px] block">Latitude</span>
                  <span className="font-mono font-bold text-[#172033]">
                    {simulator.currentPosition ? simulator.currentPosition[0].toFixed(6) : '—'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#F4F6F8] border border-[#D9DEE5]">
                  <span className="text-[#667085] text-[11px] block">Longitude</span>
                  <span className="font-mono font-bold text-[#172033]">
                    {simulator.currentPosition ? simulator.currentPosition[1].toFixed(6) : '—'}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#F4F6F8] border border-[#D9DEE5] flex justify-between text-xs">
                <span className="text-[#667085]">Accuracy (Simulated):</span>
                <span className="font-semibold text-[#172033]">
                  ±{simulator.simulatedAccuracy} meters
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Proof of Delivery Modal */}
      <ProofOfDeliveryModal
        isOpen={podModalOpen}
        onClose={() => setPodModalOpen(false)}
        shipment={selectedShipment}
        onDeliveryComplete={(updatedShipment) => {
          handleStatusChange(updatedShipment);
          setPodModalOpen(false);
        }}
      />
    </DashboardLayout>
  );
};

export default GpsSimulator;
