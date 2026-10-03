import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatsCard from '../components/common/StatsCard';
import ShipmentTable from '../components/shipment/ShipmentTable';
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
} from 'lucide-react';

const CourierDashboard = () => {
  const { user } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal for courier status change
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);

  useEffect(() => {
    fetchAssignedShipments();
  }, []);

  const fetchAssignedShipments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/shipments/courier/assigned');
      if (res.data?.success) {
        setShipments(res.data.data.shipments || []);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to retrieve your assigned shipments'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleShipmentUpdated = (updated) => {
    setShipments((prev) =>
      prev.map((s) => (s._id === updated._id || s.trackingId === updated.trackingId ? updated : s))
    );
  };

  // Metrics calculation
  const assignedCount = shipments.filter((s) => s.status === 'Assigned').length;
  const pickedUpCount = shipments.filter((s) => s.status === 'Picked Up').length;
  const inTransitCount = shipments.filter((s) => s.status === 'In Transit').length;
  const outForDeliveryCount = shipments.filter((s) => s.status === 'Out for Delivery').length;
  const deliveredCount = shipments.filter((s) => s.status === 'Delivered').length;

  const activeDeliveries = shipments.filter(
    (s) => s.status !== 'Delivered' && s.status !== 'Cancelled'
  );

  return (
    <DashboardLayout title="Courier Dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
            Welcome back, {user?.name || 'Courier'}
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-0.5">
            Manage your assigned deliveries.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchAssignedShipments}
            className="p-2 rounded-lg bg-white border border-[#D9DEE5] text-[#667085] hover:text-[#172033] hover:bg-[#F4F6F8] transition cursor-pointer shadow-xs"
            title="Refresh Deliveries"
            aria-label="Refresh Deliveries"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/courier/shipments"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#172033] hover:bg-[#0F172A] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition"
          >
            <span>Assigned Shipments</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#D97706]" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} onRetry={fetchAssignedShipments} />
        </div>
      )}

      {/* 5 Summary Metrics: Assigned, Picked Up, In Transit, Out for Delivery, Delivered */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <StatsCard
          title="Assigned"
          value={loading ? '...' : assignedCount}
          icon={Package}
          color="navy"
          subtitle="Ready for pickup"
        />
        <StatsCard
          title="Picked Up"
          value={loading ? '...' : pickedUpCount}
          icon={Clock}
          color="blue"
          subtitle="Collected"
        />
        <StatsCard
          title="In Transit"
          value={loading ? '...' : inTransitCount}
          icon={Truck}
          color="navy"
          subtitle="On the road"
        />
        <StatsCard
          title="Out for Delivery"
          value={loading ? '...' : outForDeliveryCount}
          icon={Navigation}
          color="amber"
          subtitle="Final leg"
        />
        <StatsCard
          title="Delivered"
          value={loading ? '...' : deliveredCount}
          icon={CheckCircle}
          color="green"
          subtitle="Completed"
        />
      </div>

      {/* Active Assigned Deliveries List */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#172033]">
              Active Deliveries
            </h2>
            <p className="text-xs text-[#667085]">
              Deliveries requiring your action ({activeDeliveries.length})
            </p>
          </div>

          {shipments.length > 0 && (
            <Link
              to="/courier/shipments"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#172033] hover:text-[#D97706] transition"
            >
              <span>View All ({shipments.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-[#D9DEE5] p-10">
            <LoadingSpinner message="Loading your assigned deliveries..." />
          </div>
        ) : activeDeliveries.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No shipments assigned"
            description="You currently have no deliveries assigned."
          />
        ) : (
          <ShipmentTable
            shipments={activeDeliveries}
            showCustomer={true}
            viewLinkPrefix="/courier/shipments"
            renderActions={(s) => (
              <div className="flex items-center justify-end gap-1.5">
                <Link
                  to={`/courier/shipments/${s._id || s.id || s.trackingId}`}
                  className="px-2.5 py-1 text-xs font-semibold text-[#172033] hover:text-[#D97706] bg-white border border-[#D9DEE5] hover:bg-[#F4F6F8] rounded-md transition shadow-xs"
                >
                  View Delivery
                </Link>

                {!['Delivered', 'Cancelled'].includes(s.status) && (
                  <button
                    onClick={() => {
                      setSelectedShipment(s);
                      setStatusModalOpen(true);
                    }}
                    className="px-2 py-1 text-[11px] font-semibold text-white bg-[#172033] hover:bg-[#0F172A] rounded-md transition cursor-pointer shadow-xs"
                  >
                    Advance Status
                  </button>
                )}
              </div>
            )}
          />
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
