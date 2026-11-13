import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatsCard from '../components/common/StatsCard';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import UpdateStatusModal from '../components/shipment/UpdateStatusModal';
import api from '../services/api';
import {
  Truck,
  CheckCircle,
  Clock,
  ArrowRight,
  Package,
  RefreshCw,
  Navigation,
  Play,
  Compass,
  Calendar,
  Activity,
  ChevronRight,
} from 'lucide-react';

const CourierDashboard = () => {
  const { user } = useAuth();
  const [activeShipments, setActiveShipments] = useState([]);
  const [historyShipments, setHistoryShipments] = useState([]);
  const [loadingActive, setLoadingActive] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState('');

  // Modal for courier status change
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);

  // Helper to read per-shipment demo state from localStorage
  const getDemoState = useCallback((shipmentId) => {
    if (!shipmentId) return null;
    try {
      const key = `courierDemoState_${shipmentId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore JSON parse errors
    }
    return null;
  }, []);

  const fetchActiveDeliveries = useCallback(async () => {
    setLoadingActive(true);
    setError('');
    try {
      const res = await api.get('/shipments/courier/assigned');
      if (res.data?.success) {
        setActiveShipments(res.data.data?.shipments || []);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to retrieve assigned active deliveries'
      );
    } finally {
      setLoadingActive(false);
    }
  }, []);

  const fetchDeliveryHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get('/shipments/courier/history');
      if (res.data?.success) {
        setHistoryShipments(res.data.data?.shipments || []);
      }
    } catch (err) {
      console.error('Failed to load courier delivery history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const refreshAll = useCallback(() => {
    fetchActiveDeliveries();
    fetchDeliveryHistory();
  }, [fetchActiveDeliveries, fetchDeliveryHistory]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const handleShipmentUpdated = (updated) => {
    if (['Delivered', 'Cancelled'].includes(updated.status)) {
      setActiveShipments((prev) => prev.filter((s) => s._id !== updated._id));
      setHistoryShipments((prev) => [updated, ...prev.filter((s) => s._id !== updated._id)]);
    } else {
      setActiveShipments((prev) =>
        prev.map((s) => (s._id === updated._id || s.trackingId === updated.trackingId ? updated : s))
      );
    }
  };

  // Metrics calculation
  const assignedCount = activeShipments.filter((s) => s.status === 'Assigned').length;
  const pickedUpCount = activeShipments.filter((s) => s.status === 'Picked Up').length;
  const inTransitCount = activeShipments.filter((s) => s.status === 'In Transit').length;
  const outForDeliveryCount = activeShipments.filter((s) => s.status === 'Out for Delivery').length;
  const deliveredCount = historyShipments.filter((s) => s.status === 'Delivered').length;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  return (
    <DashboardLayout title="Courier Dashboard">
      <div className="space-y-6">
        {/* Charcoal Hero Banner */}
        <div className="bg-[#242424] text-white rounded-2xl border border-[#383838] p-5 sm:p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#171717] text-[#FF7547] border border-[#383838] flex items-center justify-center shrink-0 shadow-xs">
              <Truck className="w-5 h-5 text-[#FF7547]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Welcome back, {user?.name || 'Courier Driver'}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF7F1] text-[#238259] border border-[#C4E8D8]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#36A879] animate-pulse"></span>
                  Active On Duty
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#C5C5C5] mt-0.5">
                Manage your assigned delivery route, stream live GPS coordinates, and complete verification.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto w-full sm:w-auto">
            <button
              onClick={refreshAll}
              className="p-2.5 rounded-xl bg-[#171717] border border-[#383838] text-[#C5C5C5] hover:text-white hover:bg-[#303030] transition cursor-pointer shadow-xs"
              title="Refresh Deliveries"
              aria-label="Refresh Deliveries"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <Link
              to="/courier/simulator"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FF7547] hover:bg-[#F06438] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Compass className="w-4 h-4 text-white" />
              <span>GPS Simulator</span>
            </Link>
          </div>
        </div>

        {error && (
          <div>
            <ErrorMessage message={error} onRetry={refreshAll} />
          </div>
        )}

        {/* 5 Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <StatsCard
            title="Assigned"
            value={loadingActive ? '...' : assignedCount}
            icon={Package}
            color="assigned"
            subtitle="Ready for pickup"
          />
          <StatsCard
            title="Picked Up"
            value={loadingActive ? '...' : pickedUpCount}
            icon={Clock}
            color="total"
            subtitle="Collected parcel"
          />
          <StatsCard
            title="In Transit"
            value={loadingActive ? '...' : inTransitCount}
            icon={Truck}
            color="inTransit"
            subtitle="En route"
          />
          <StatsCard
            title="Out for Delivery"
            value={loadingActive ? '...' : outForDeliveryCount}
            icon={Navigation}
            color="pending"
            subtitle="Final delivery leg"
          />
          <StatsCard
            title="Delivered"
            value={loadingHistory ? '...' : deliveredCount}
            icon={CheckCircle}
            color="delivered"
            subtitle="Completed total"
          />
        </div>

        {/* SECTION 1: ACTIVE DELIVERIES */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#FF7547]" />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#202020] tracking-tight">
                  Active Route Deliveries ({activeShipments.length})
                </h2>
                <p className="text-xs text-[#777777]">Assigned shipments ready for collection and delivery</p>
              </div>
            </div>
            <Link
              to="/courier/shipments"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF7547] hover:text-[#F06438] transition"
            >
              <span>Queue View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingActive ? (
            <div className="bg-white rounded-2xl border border-[#DEDCD8] p-12 shadow-xs">
              <LoadingSpinner message="Retrieving assigned deliveries..." />
            </div>
          ) : activeShipments.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No active deliveries assigned"
              description="You currently have no in-progress deliveries. Newly dispatched shipments will appear here."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeShipments.map((shipment) => {
                const demoState = getDemoState(shipment._id);
                const hasDemo = Boolean(demoState);
                const progress = demoState ? Math.min(100, Math.max(0, Math.round(demoState.progress || 0))) : 0;
                const remainingKm = demoState?.distanceRemaining
                  ? Number(demoState.distanceRemaining).toFixed(1)
                  : null;
                const isPaused = demoState?.state === 'paused';
                const isRunning = demoState?.state === 'running';

                return (
                  <div
                    key={shipment._id}
                    className="bg-white rounded-2xl border border-[#DEDCD8] hover:border-[#FF7547]/60 p-5 shadow-xs transition duration-150 flex flex-col justify-between"
                  >
                    <div className="space-y-3.5">
                      {/* Card Header: Tracking ID & Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[10px] font-semibold text-[#777777] uppercase tracking-wider block">
                            Tracking ID
                          </span>
                          <Link
                            to={`/courier/shipments/${shipment._id}`}
                            className="font-mono font-bold text-sm text-[#202020] hover:text-[#FF7547] transition break-all"
                          >
                            {shipment.trackingId}
                          </Link>
                        </div>
                        <StatusBadge status={shipment.status} size="sm" />
                      </div>

                      {/* Route: Origin -> Destination */}
                      <div className="p-3 bg-[#F2F0ED] rounded-xl border border-[#DEDCD8] text-xs space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#171717] mt-1 shrink-0"></div>
                          <div>
                            <span className="text-[10px] text-[#777777] uppercase block font-semibold">
                              Pickup (Origin)
                            </span>
                            <span className="font-semibold text-[#202020]">
                              {shipment.pickupAddress?.city || 'Origin'}, {shipment.pickupAddress?.state || ''}
                            </span>
                          </div>
                        </div>

                        <div className="border-l border-dashed border-[#DEDCD8] ml-1 pl-3 py-0.5"></div>

                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#FF7547] mt-1 shrink-0"></div>
                          <div>
                            <span className="text-[10px] text-[#777777] uppercase block font-semibold">
                              Destination
                            </span>
                            <span className="font-semibold text-[#202020]">
                              {shipment.deliveryAddress?.city || 'Destination'}, {shipment.deliveryAddress?.state || ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Demo / Simulation State if present */}
                      {hasDemo && (
                        <div className="p-3 bg-[#FEF7ED] rounded-xl border border-[#FDE3C8] text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1 font-bold text-[#C48429] text-[11px] uppercase tracking-wide">
                              <Compass className="w-3.5 h-3.5 text-[#E9A23B]" />
                              DEMO {isRunning ? '(Broadcasting)' : isPaused ? '(Paused)' : ''}
                            </span>
                            <span className="font-mono font-bold text-[#C48429]">{progress}% complete</span>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full h-1.5 bg-[#FDE3C8] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#E9A23B] transition-all duration-300 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-[#777777]">
                            <span>{remainingKm ? `${remainingKm} km remaining` : 'On road route'}</span>
                            <span className="text-[#A7A7A7]">
                              {demoState.lastUpdatedAt
                                ? new Date(demoState.lastUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : 'Saved'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-4 mt-4 border-t border-[#DEDCD8] flex items-center justify-between gap-2 flex-wrap">
                      <Link
                        to={`/courier/shipments/${shipment._id}`}
                        className="px-3 py-1.5 text-xs font-semibold text-[#202020] hover:text-[#FF7547] bg-[#F2F0ED] hover:bg-[#E9E7E4] border border-[#DEDCD8] rounded-xl transition shadow-xs"
                      >
                        Details
                      </Link>

                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/courier/simulator?shipmentId=${shipment._id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#FF7547] bg-[#FFF2ED] hover:bg-[#FFE5DC] border border-[#FFD6C9] rounded-xl transition shadow-xs"
                        >
                          <Play className="w-3 h-3 fill-current text-[#FF7547]" />
                          <span>{hasDemo && progress > 0 ? 'Resume' : 'Simulate'}</span>
                        </Link>

                        <button
                          onClick={() => {
                            setSelectedShipment(shipment);
                            setStatusModalOpen(true);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-[#171717] hover:bg-[#303030] rounded-xl transition cursor-pointer shadow-xs"
                          title="Update status directly"
                        >
                          Advance
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 2: DELIVERY HISTORY */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#36A879]" />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#202020] tracking-tight">
                  Delivery History ({historyShipments.length})
                </h2>
                <p className="text-xs text-[#777777]">Completed and verified shipments in your service log</p>
              </div>
            </div>
          </div>

          {loadingHistory ? (
            <div className="bg-white rounded-2xl border border-[#DEDCD8] p-12 shadow-xs">
              <LoadingSpinner message="Retrieving delivery history..." />
            </div>
          ) : historyShipments.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="No delivery history yet"
              description="Completed and delivered shipments will be archived here."
            />
          ) : (
            <div className="bg-white rounded-2xl border border-[#DEDCD8] overflow-hidden shadow-xs">
              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#E9E7E4] text-[#202020] uppercase text-[11px] font-bold tracking-wider border-b border-[#DEDCD8]">
                      <th className="py-3.5 px-4">Tracking ID</th>
                      <th className="py-3.5 px-4">Route</th>
                      <th className="py-3.5 px-4">Recipient</th>
                      <th className="py-3.5 px-4">Delivered At</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DEDCD8] text-[#202020]">
                    {historyShipments.map((s) => {
                      const deliveredTime = s.deliveredAt || s.updatedAt;
                      return (
                        <tr key={s._id} className="hover:bg-[#F2F0ED] transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-[#202020]">
                            <Link
                              to={`/courier/shipments/${s._id}`}
                              className="hover:text-[#FF7547] transition break-all"
                            >
                              {s.trackingId}
                            </Link>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-[#202020]">
                              {s.pickupAddress?.city || 'Origin'}
                            </span>
                            <span className="mx-1.5 text-[#777777]">→</span>
                            <span className="font-semibold text-[#202020]">
                              {s.deliveryAddress?.city || 'Destination'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-[#202020]">
                              {s.customerId?.name || 'Customer'}
                            </div>
                            <div className="text-[11px] text-[#777777] truncate max-w-[180px]">
                              {s.deliveryAddress?.addressLine}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 text-[#777777]">
                              <Calendar className="w-3.5 h-3.5 text-[#777777]" />
                              <span>{formatDate(deliveredTime)}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <StatusBadge status={s.status} size="sm" />
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Link
                              to={`/courier/shipments/${s._id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#202020] hover:text-[#FF7547] bg-white border border-[#DEDCD8] hover:bg-[#F2F0ED] rounded-xl transition shadow-xs"
                            >
                              <span>Details</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View (< md) */}
              <div className="md:hidden divide-y divide-[#DEDCD8]">
                {historyShipments.map((s) => {
                  const deliveredTime = s.deliveredAt || s.updatedAt;
                  return (
                    <div key={s._id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link
                            to={`/courier/shipments/${s._id}`}
                            className="font-mono font-bold text-sm text-[#202020] hover:text-[#FF7547] transition break-all"
                          >
                            {s.trackingId}
                          </Link>
                          <div className="text-xs text-[#777777] mt-0.5">
                            {formatDate(deliveredTime)}
                          </div>
                        </div>
                        <StatusBadge status={s.status} size="sm" />
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#F2F0ED] text-xs space-y-1">
                        <div className="flex items-center gap-1 text-[#202020]">
                          <span className="font-semibold">{s.pickupAddress?.city || 'Origin'}</span>
                          <span className="text-[#777777]">→</span>
                          <span className="font-semibold">{s.deliveryAddress?.city || 'Destination'}</span>
                        </div>
                        <div className="text-[#777777] text-[11px]">
                          Recipient: {s.customerId?.name || 'Customer'}
                        </div>
                      </div>

                      <div className="flex items-center justify-end">
                        <Link
                          to={`/courier/shipments/${s._id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#202020] hover:text-[#FF7547] bg-white border border-[#DEDCD8] rounded-xl transition shadow-xs"
                        >
                          <span>View Details</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Status Update Modal */}
        <UpdateStatusModal
          isOpen={statusModalOpen}
          onClose={() => setStatusModalOpen(false)}
          shipment={selectedShipment}
          onSuccess={handleShipmentUpdated}
          role="courier"
        />
      </div>
    </DashboardLayout>
  );
};

export default CourierDashboard;
