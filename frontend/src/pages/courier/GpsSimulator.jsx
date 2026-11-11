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
  ChevronRight,
} from 'lucide-react';

const TRACKABLE_STATUSES = ['Assigned', 'Picked Up', 'In Transit', 'Out for Delivery'];
const SPEED_OPTIONS = [
  { value: 0.5, label: '0.5x' },
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 5, label: '5x' },
  { value: 10, label: '10x' },
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
      <div className="space-y-5 max-w-6xl mx-auto">
        {/* Demonstration Notice */}
        <div className="p-4 rounded-2xl bg-[#FFF4E8] border border-[#FCE3C8] flex items-start gap-3.5 text-xs shadow-2xs">
          <div className="p-2 rounded-xl bg-[#D99024] text-white shrink-0 mt-0.5 shadow-2xs">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-[#D99024] text-white font-bold text-[10px] tracking-wider uppercase">
                Demo Mode
              </span>
              <span className="font-bold text-[#182433]">Real Road GPS Simulation Engine</span>
            </div>
            <p className="text-[#7A531A] leading-relaxed">
              This engine routes real road coordinates via OSRM, streams coordinate steps to the live Socket.IO server, and linearly advances the shipment status (<code className="bg-white px-1.5 py-0.5 rounded font-mono text-[11px] text-[#142B45] border border-[#FCE3C8]">Assigned → Picked Up → In Transit → Out for Delivery</code>). Upon reaching the doorstep, it halts at 100% in Out for Delivery and requires Proof of Delivery (Customer OTP + Parcel Photo) to mark as Delivered.
            </p>
          </div>
        </div>

        {/* Main Grid: Left Map + Right Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
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
            <div className="bg-white rounded-2xl border border-[#DCE5EF] p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#DCE5EF]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#EAF2FA] text-[#245B78] flex items-center justify-center">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-[#142B45] uppercase tracking-wider">
                    Simulation Controls
                  </h3>
                </div>
                {simulator.isRunning ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E7F5F2] text-[#16875D] text-[11px] font-semibold border border-[#CCEAE3]">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16875D] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16875D]"></span>
                    </span>
                    <span>Broadcasting</span>
                  </span>
                ) : simulator.isPaused ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFF4E8] text-[#9A5D12] text-[11px] font-semibold border border-[#FCE3C8]">
                    <span>Paused ({simulator.progress}%)</span>
                  </span>
                ) : simulator.isCompleted ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E7F5F2] text-[#16875D] text-[11px] font-semibold border border-[#CCEAE3]">
                    <span>Delivered</span>
                  </span>
                ) : simulator.isRouteLoading ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EAF5F8] text-[#126965] text-[11px] font-semibold border border-[#CFEAEF]">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin text-[#18A6A0]" />
                    <span>Routing</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E9EEF5] text-[#51647A] text-[11px] font-medium border border-[#DCE5EF]">
                    <span>Ready</span>
                  </span>
                )}
              </div>

              {/* Shipment Select Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-[#182433] mb-1.5">
                  Select Assigned Delivery
                </label>
                <select
                  value={selectedShipmentId}
                  onChange={handleSelectShipment}
                  disabled={simulator.isRunning}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#DCE5EF] bg-white text-[#182433] focus:outline-none focus:border-[#18A6A0] focus:ring-1 focus:ring-[#18A6A0] disabled:bg-[#F0F4F8] transition cursor-pointer font-medium"
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
              <div className="p-3.5 rounded-xl bg-[#EAF5F8] border border-[#CFEAEF] text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#126965] font-semibold flex items-center gap-1.5">
                    <Route className="w-3.5 h-3.5 text-[#18A6A0]" />
                    <span>OSRM Road Engine:</span>
                  </span>
                  {simulator.isLoadingRoute ? (
                    <span className="text-[#245B78] font-semibold flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin text-[#18A6A0]" />
                      <span>Finding road route...</span>
                    </span>
                  ) : simulator.routeError ? (
                    <span className="text-[#D94B4B] font-semibold">Route error</span>
                  ) : simulator.routeData ? (
                    <span className="text-[#16875D] font-semibold">Road route ready</span>
                  ) : (
                    <span className="text-[#64748B]">Awaiting coordinates</span>
                  )}
                </div>

                {simulator.routeData && (
                  <div className="flex items-center justify-between text-[#142B45] pt-1.5 border-t border-[#CFEAEF] text-[11px]">
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
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#F4F6F8] border border-[#E2E8F0]">
                  <span className="text-xs font-semibold text-[#718096]">Current Status:</span>
                  <StatusBadge status={simulator.currentShipmentStatus || selectedShipment.status} size="sm" />
                </div>
              )}

              {/* Ineligible state warnings */}
              {isPending && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#E6A23C] shrink-0 mt-0.5" />
                  <span>
                    Shipment must be assigned to a courier before simulation can start.
                  </span>
                </div>
              )}

              {/* Speed Multiplier */}
              <div>
                <label className="block text-xs font-semibold text-[#182433] mb-1.5 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-[#18A6A0]" />
                  <span>Simulation Speed Multiplier</span>
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {SPEED_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => simulator.setSpeed(opt.value)}
                      className={`py-2 text-xs font-semibold rounded-xl border transition cursor-pointer text-center ${
                        simulator.speed === opt.value
                          ? 'bg-[#0B1F33] text-white border-[#0B1F33] shadow-xs'
                          : 'bg-[#E8EEF4] text-[#123B5D] border-[#D5DEE7] hover:bg-[#DCE5EC] hover:text-[#0B1F33]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs font-semibold text-[#142B45]">
                  <span>Road Route Progress</span>
                  <span className="font-mono text-[#00A6A6] font-bold">{simulator.progress}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#E8EEF4] rounded-full overflow-hidden border border-[#D5DEE7]">
                  <div
                    className="h-full bg-[#00A6A6] transition-all duration-300 rounded-full"
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
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[11px] bg-[#123B5D]/70 text-white text-xs font-semibold shadow-xs cursor-not-allowed"
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00A6A6]" />
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
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[11px] bg-[#00A6A6] hover:bg-[#008F95] text-white text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current text-white" />
                    <span>Start GPS Simulation</span>
                  </button>
                )}

                {(simulator.isPaused || (!simulator.isRunning && simulator.progress > 0)) && !isDelivered && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleResumeSimulation}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#16A36A] hover:bg-[#138a59] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Resume ({simulator.progress}%)</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleStopSimulation}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#718096] hover:bg-[#5b677a] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                      >
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>Stop</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleRestartDemo}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[#E2E8F0] hover:bg-[#F4F6F8] text-[#718096] hover:text-[#182433] text-xs font-medium transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Demo to Start</span>
                    </button>
                  </div>
                )}

                {simulator.isRunning && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={simulator.pause}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#E6A23C] hover:bg-[#c98c32] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                    >
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Pause</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleStopSimulation}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#DC5353] hover:bg-[#c44141] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop Session</span>
                    </button>
                  </div>
                )}

                {/* Out for Delivery / Destination Reached POD Verification Prompt */}
                {(selectedShipment?.status === 'Out for Delivery' || simulator.progress >= 100) && !isDelivered && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-300 space-y-2">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#E6A23C] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-xs text-[#182433]">
                          {simulator.progress >= 100 ? 'Destination Reached (100%)' : 'Out for Delivery Stage'}
                        </h4>
                        <p className="text-[11px] text-[#182433]/80 leading-relaxed">
                          Package is at destination doorstep. Collect customer's 6-digit OTP and photograph parcel to complete delivery.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPodModalOpen(true)}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#18A6A0] hover:bg-[#138580] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Complete Delivery (POD)</span>
                    </button>
                  </div>
                )}

                {isDelivered && (
                  <div className="space-y-2">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-[#16A36A] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Demo Completed. Shipment has been marked as Delivered (100%).</span>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        to={`/courier/shipments/${selectedShipment?._id || selectedShipment?.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#142B45] hover:bg-[#245B78] text-white text-xs font-semibold shadow-xs transition"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={handleRestartDemo}
                        className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-[#E2E8F0] hover:bg-[#F4F6F8] text-[#182433] text-xs font-semibold shadow-xs transition cursor-pointer"
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
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-[#DC5353]">
                  {error || simulator.statusError}
                </div>
              )}
            </div>

            {/* Simulated GPS Telemetry Card */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#18A6A0]/10 text-[#18A6A0] flex items-center justify-center">
                    <Compass className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-[#182433] uppercase tracking-wider">
                    Simulated GPS Telemetry
                  </h3>
                </div>
                <span className="text-[10px] text-[#718096] font-mono">
                  Point {simulator.currentIndex + 1}/{simulator.totalPoints || 0}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#F4F6F8] border border-[#E2E8F0]">
                  <span className="text-[#718096] text-[11px] block">Latitude</span>
                  <span className="font-mono font-bold text-[#142B45]">
                    {simulator.currentPosition ? simulator.currentPosition[0].toFixed(6) : '—'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F4F6F8] border border-[#E2E8F0]">
                  <span className="text-[#718096] text-[11px] block">Longitude</span>
                  <span className="font-mono font-bold text-[#142B45]">
                    {simulator.currentPosition ? simulator.currentPosition[1].toFixed(6) : '—'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F4F6F8] border border-[#E2E8F0] flex justify-between text-xs">
                <span className="text-[#718096]">Simulated Accuracy:</span>
                <span className="font-semibold text-[#182433]">
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
