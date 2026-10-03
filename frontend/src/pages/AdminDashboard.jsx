import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatsCard from '../components/common/StatsCard';
import ShipmentTable from '../components/shipment/ShipmentTable';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import AssignCourierModal from '../components/shipment/AssignCourierModal';
import UpdateStatusModal from '../components/shipment/UpdateStatusModal';
import api from '../services/api';
import {
  Package,
  Clock,
  Truck,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  RefreshCw,
  Eye,
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);

  useEffect(() => {
    fetchAdminShipments();
  }, []);

  const fetchAdminShipments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/shipments/admin/all');
      if (res.data?.success) {
        setShipments(res.data.data.shipments || []);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to retrieve shipments for admin'
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

  // 5 Real summary metrics as specified: Total Shipments, Pending, Assigned, In Transit, Delivered
  const totalCount = shipments.length;
  const pendingCount = shipments.filter((s) => s.status === 'Pending').length;
  const assignedCount = shipments.filter((s) => s.status === 'Assigned').length;
  const inTransitCount = shipments.filter((s) =>
    ['Picked Up', 'In Transit', 'Out for Delivery'].includes(s.status)
  ).length;
  const deliveredCount = shipments.filter((s) => s.status === 'Delivered').length;

  const recentShipments = shipments.slice(0, 5);

  return (
    <DashboardLayout title="Admin Dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
            Administrator Console
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-0.5">
            System dispatch, courier assignments, and delivery tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchAdminShipments}
            className="p-2 rounded-lg bg-white border border-[#D9DEE5] text-[#667085] hover:text-[#172033] hover:bg-[#F4F6F8] transition cursor-pointer shadow-xs"
            title="Refresh Data"
            aria-label="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/admin/shipments"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#172033] hover:bg-[#0F172A] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition"
          >
            <span>All Shipments</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#D97706]" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} onRetry={fetchAdminShipments} />
        </div>
      )}

      {/* 5 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <StatsCard
          title="Total"
          value={loading ? '...' : totalCount}
          icon={Package}
          color="navy"
          subtitle="All records"
        />
        <StatsCard
          title="Pending"
          value={loading ? '...' : pendingCount}
          icon={Clock}
          color="amber"
          subtitle="Awaiting courier"
        />
        <StatsCard
          title="Assigned"
          value={loading ? '...' : assignedCount}
          icon={UserCheck}
          color="blue"
          subtitle="Assigned to driver"
        />
        <StatsCard
          title="In Transit"
          value={loading ? '...' : inTransitCount}
          icon={Truck}
          color="blue"
          subtitle="En route"
        />
        <StatsCard
          title="Delivered"
          value={loading ? '...' : deliveredCount}
          icon={CheckCircle2}
          color="green"
          subtitle="Completed"
        />
      </div>

      {/* Recent Shipments Section */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#172033]">
              Recent Shipments
            </h2>
            <p className="text-xs text-[#667085]">Overview of latest parcel activity</p>
          </div>

          {shipments.length > 0 && (
            <Link
              to="/admin/shipments"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#172033] hover:text-[#D97706] transition"
            >
              <span>View All ({totalCount})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-[#D9DEE5] p-10">
            <LoadingSpinner message="Loading shipments..." />
          </div>
        ) : shipments.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No shipments found"
            description="There are currently no shipments registered in the system."
          />
        ) : (
          <ShipmentTable
            shipments={recentShipments}
            showCustomer={true}
            showCourier={true}
            viewLinkPrefix="/admin/shipments"
            renderActions={(s) => (
              <div className="flex items-center justify-end gap-1.5">
                <Link
                  to={`/admin/shipments/${s._id || s.trackingId}`}
                  className="px-2.5 py-1 text-xs font-semibold text-[#172033] hover:text-[#D97706] bg-white border border-[#D9DEE5] hover:bg-[#F4F6F8] rounded-md transition shadow-xs"
                >
                  View
                </Link>

                {/* Assign Courier button (Allowed for Pending or Assigned) */}
                {['Pending', 'Assigned'].includes(s.status) && (
                  <button
                    onClick={() => {
                      setSelectedShipment(s);
                      setAssignModalOpen(true);
                    }}
                    className="px-2 py-1 text-[11px] font-semibold text-white bg-[#172033] hover:bg-[#0F172A] rounded-md transition shadow-xs cursor-pointer"
                    title="Assign Courier"
                  >
                    Assign
                  </button>
                )}

                {/* Update Status button (if not terminal) */}
                {!['Delivered', 'Cancelled'].includes(s.status) && (
                  <button
                    onClick={() => {
                      setSelectedShipment(s);
                      setStatusModalOpen(true);
                    }}
                    className="px-2 py-1 text-[11px] font-semibold text-[#D97706] hover:text-[#B45309] bg-amber-50 hover:bg-amber-100 rounded-md transition border border-amber-200 cursor-pointer"
                    title="Update Status"
                  >
                    Status
                  </button>
                )}
              </div>
            )}
          />
        )}
      </div>

      {/* Modals */}
      <AssignCourierModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        shipment={selectedShipment}
        onSuccess={handleShipmentUpdated}
      />

      <UpdateStatusModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        shipment={selectedShipment}
        onSuccess={handleShipmentUpdated}
        role="admin"
      />
    </DashboardLayout>
  );
};

export default AdminDashboard;
