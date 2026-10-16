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
  RotateCcw,
  Compass,
  MapPin,
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
    // If completed or cancelled, move to history
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight flex items-center gap-2">
            <span>Welcome back, {user?.name || 'Courier'}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
              On Duty
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-0.5">
            Manage live active shipments and simulate routes with real road GPS tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={refreshAll}
            className="p-2 rounded-lg bg-white border border-[#D9DEE5] text-[#667085] hover:text-[#172033] hover:bg-[#F4F6F8] transition cursor-pointer shadow-xs"
            title="Refresh Deliveries"
            aria-label="Refresh Deliveries"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Link
            to="/courier/simulator"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition"
          >
            <Compass className="w-4 h-4" />
            <span>GPS Simulator</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} onRetry={refreshAll} />
        </div>
      )}

      {/* 5 Summary Metrics: Assigned, Picked Up, In Transit, Out for Delivery, Delivered */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-7">
        <StatsCard
          title="Assigned"
          value={loadingActive ? '...' : assignedCount}
          icon={Package}
          color="navy"
          subtitle="Ready for pickup"
        />
        <StatsCard
          title="Picked Up"
          value={loadingActive ? '...' : pickedUpCount}
          icon={Clock}
          color="blue"
          subtitle="Collected"
        />
        <StatsCard
          title="In Transit"
          value={loadingActive ? '...' : inTransitCount}
          icon={Truck}
          color="navy"
          subtitle="On the road"
        />
        <StatsCard
          title="Out for Delivery"
          value={loadingActive ? '...' : outForDeliveryCount}
          icon={Navigation}
          color="amber"
          subtitle="Final leg"
        />
        <StatsCard
          title="Delivered"
          value={loadingHistory ? '...' : deliveredCount}
          icon={CheckCircle}
          color="green"
          subtitle="Delivered history"
        />
      </div>

      {/* SECTION 1: ACTIVE DELIVERIES */}
      <div className="mb-9 space-y-4">
        <div className="flex items-center justify-between border-b border-[#D9DEE5] pb-2.5">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#172033]" />
            <h2 className="text-base font-bold text-[#172033] uppercase tracking-wider">
              Active Deliveries ({activeShipments.length})
            </h2>
          </div>
          <Link
            to="/courier/shipments"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#172033] hover:text-[#D97706] transition"
          >
            <span>Assigned Deliveries List</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loadingActive ? (
          <div className="bg-white rounded-xl border border-[#D9DEE5] p-10 shadow-xs">
            <LoadingSpinner message="Loading active deliveries..." />
          </div>
        ) : activeShipments.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No active deliveries assigned"
            description="You currently have no in-progress deliveries. New assigned tasks will appear here."
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
                  className="bg-white rounded-xl border border-[#D9DEE5] hover:border-[#172033]/40 p-5 shadow-xs transition duration-150 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Card Header: Tracking ID & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider block">
                          Tracking ID
                        </span>
                        <Link
                          to={`/courier/shipments/${shipment._id}`}
                          className="font-mono font-bold text-sm text-[#172033] hover:text-[#D97706] transition"
                        >
                          {shipment.trackingId}
                        </Link>
                      </div>
                      <StatusBadge status={shipment.status} size="sm" />
                    </div>

                    {/* Route: Origin -> Destination */}
                    <div className="p-3 bg-[#F4F6F8] rounded-lg border border-[#D9DEE5]/60 text-xs space-y-1.5">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-[#667085] uppercase block font-semibold">
                            Pickup
                          </span>
                          <span className="font-semibold text-[#172033]">
                            {shipment.pickupAddress?.city || 'Origin'}, {shipment.pickupAddress?.state || ''}
                          </span>
                        </div>
                      </div>
                      <div className="border-l-2 border-dashed border-[#D9DEE5] ml-1.5 pl-3 py-0.5"></div>
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-[#667085] uppercase block font-semibold">
                            Delivery
                          </span>
                          <span className="font-semibold text-[#172033]">
                            {shipment.deliveryAddress?.city || 'Destination'}, {shipment.deliveryAddress?.state || ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Demo / Simulation State if present */}
                    {hasDemo && (
                      <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 font-bold text-amber-900 text-[11px] uppercase tracking-wide">
                            <Compass className="w-3.5 h-3.5 text-amber-700" />
                            DEMO MODE {isRunning ? '(Active)' : isPaused ? '(Paused)' : ''}
                          </span>
                          <span className="font-mono font-bold text-amber-800">{progress}% complete</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-amber-200/80 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-600 transition-all duration-300 rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-amber-800">
                          <span>{remainingKm ? `${remainingKm} km remaining` : 'On road route'}</span>
                          <span className="text-[#667085]">
                            {demoState.lastUpdatedAt
                              ? new Date(demoState.lastUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : 'Saved'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-4 mt-3 border-t border-[#D9DEE5]/80 flex items-center justify-between gap-2">
                    <Link
                      to={`/courier/shipments/${shipment._id}`}
                      className="px-3 py-1.5 text-xs font-semibold text-[#172033] hover:text-[#D97706] bg-[#F4F6F8] hover:bg-[#E5E7EB] border border-[#D9DEE5] rounded-lg transition shadow-xs"
                    >
                      Track
                    </Link>

                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/courier/simulator?shipmentId=${shipment._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition shadow-xs"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{hasDemo && progress > 0 ? 'Resume Demo' : 'Demo Mode'}</span>
                      </Link>

                      <button
                        onClick={() => {
                          setSelectedShipment(shipment);
                          setStatusModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 text-xs font-semibold text-white bg-[#172033] hover:bg-[#0F172A] rounded-lg transition cursor-pointer shadow-xs"
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
        <div className="flex items-center justify-between border-b border-[#D9DEE5] pb-2.5">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-[#172033] uppercase tracking-wider">
              Delivery History ({historyShipments.length})
            </h2>
          </div>
          <span className="text-xs text-[#667085]">
            Past completed and delivered shipments
          </span>
        </div>

        {loadingHistory ? (
          <div className="bg-white rounded-xl border border-[#D9DEE5] p-10 shadow-xs">
            <LoadingSpinner message="Loading delivery history..." />
          </div>
        ) : historyShipments.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title="No delivery history yet"
            description="Completed and delivered shipments will be preserved here indefinitely."
          />
        ) : (
          <div className="bg-white rounded-xl border border-[#D9DEE5] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F4F6F8] text-[#172033] uppercase text-[11px] font-bold tracking-wider border-b border-[#D9DEE5]">
                    <th className="py-3 px-4">Tracking ID</th>
                    <th className="py-3 px-4">Route</th>
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Delivered At</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9DEE5] text-[#263449]">
                  {historyShipments.map((s) => {
                    const deliveredTime = s.deliveredAt || s.updatedAt;
                    return (
                      <tr key={s._id} className="hover:bg-[#F4F6F8]/60 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#172033]">
                          <Link
                            to={`/courier/shipments/${s._id}`}
                            className="hover:text-[#D97706] transition"
                          >
                            {s.trackingId}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-[#172033]">
                            {s.pickupAddress?.city || 'Origin'}
                          </span>
                          <span className="mx-1 text-[#667085]">→</span>
                          <span className="font-semibold text-[#172033]">
                            {s.deliveryAddress?.city || 'Destination'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#172033]">
                            {s.customerId?.name || 'Customer'}
                          </div>
                          <div className="text-[11px] text-[#667085]">
                            {s.deliveryAddress?.addressLine}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-[#172033]">
                            <Calendar className="w-3.5 h-3.5 text-[#667085]" />
                            <span>{formatDate(deliveredTime)}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={s.status} size="sm" />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/courier/shipments/${s._id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#172033] hover:text-[#D97706] bg-white border border-[#D9DEE5] hover:bg-[#F4F6F8] rounded-md transition shadow-xs"
                            >
                              <span>View Route</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>

                            <Link
                              to={`/courier/simulator?shipmentId=${s._id}`}
                              className="px-2 py-1 text-[11px] font-semibold text-[#667085] hover:text-[#172033] bg-[#F4F6F8] border border-[#D9DEE5] rounded-md transition"
                              title="View Demo Simulation History"
                            >
                              Demo State
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
    </DashboardLayout>
  );
};

export default CourierDashboard;
