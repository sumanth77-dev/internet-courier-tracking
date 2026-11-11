import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatsCard from '../components/common/StatsCard';
import ShipmentTable from '../components/shipment/ShipmentTable';
import AdminShipmentActions from '../components/shipment/AdminShipmentActions';
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
  Shield,
  Layers,
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

  const recentShipments = shipments.slice(0, 6);

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-6">
        {/* Deep Ocean Header Banner */}
        <div className="bg-[#0B1F33] text-white rounded-[22px] border border-[#176B87]/40 p-5 sm:p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#123B5D] text-white border border-[#176B87]/50 flex items-center justify-center shrink-0 shadow-xs">
              <Shield className="w-5 h-5 text-[#00A6A6]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Administrator Dispatch Console
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#145C47] text-[#A7F3D0] border border-[#167A56]/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse"></span>
                  Live Control Active
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#DCE5EC] mt-0.5">
                Centralized shipment dispatch, courier assignments, and delivery tracking.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto w-full sm:w-auto">
            <button
              onClick={fetchAdminShipments}
              className="p-2.5 rounded-xl bg-[#123B5D] border border-[#176B87]/60 text-[#DCE5EC] hover:text-white hover:bg-[#176B87] transition cursor-pointer shadow-xs"
              title="Refresh Data"
              aria-label="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <Link
              to="/admin/shipments"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00A6A6] hover:bg-[#008F95] text-white text-xs sm:text-sm font-bold rounded-[11px] shadow-sm transition"
            >
              <Layers className="w-4 h-4 text-white" />
              <span>All Shipments</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {error && (
          <div>
            <ErrorMessage message={error} onRetry={fetchAdminShipments} />
          </div>
        )}

        {/* 5 Summary KPI Cards with Solid Dark Deep Ocean Colors */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <StatsCard
            title="Total Shipments"
            value={loading ? '...' : totalCount}
            icon={Package}
            color="total"
            subtitle="Platform records"
          />
          <StatsCard
            title="Pending Dispatch"
            value={loading ? '...' : pendingCount}
            icon={Clock}
            color="pending"
            subtitle="Awaiting courier"
          />
          <StatsCard
            title="Assigned"
            value={loading ? '...' : assignedCount}
            icon={UserCheck}
            color="assigned"
            subtitle="Courier assigned"
          />
          <StatsCard
            title="In Transit"
            value={loading ? '...' : inTransitCount}
            icon={Truck}
            color="inTransit"
            subtitle="Live on road"
          />
          <StatsCard
            title="Delivered"
            value={loading ? '...' : deliveredCount}
            icon={CheckCircle2}
            color="delivered"
            subtitle="Completed orders"
          />
        </div>

        {/* Recent Shipments Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#142B45] tracking-tight">
                Recent Shipments
              </h2>
              <p className="text-xs text-[#64748B]">Latest parcel registrations and delivery milestones</p>
            </div>

            {shipments.length > 0 && (
              <Link
                to="/admin/shipments"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#18A6A0] hover:text-[#245B78] transition"
              >
                <span>View All ({totalCount})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12">
              <LoadingSpinner message="Retrieving shipments..." />
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
                <AdminShipmentActions
                  shipment={s}
                  onAssign={(shipment) => {
                    setSelectedShipment(shipment);
                    setAssignModalOpen(true);
                  }}
                  onUpdateStatus={(shipment) => {
                    setSelectedShipment(shipment);
                    setStatusModalOpen(true);
                  }}
                  viewLinkPrefix="/admin/shipments"
                />
              )}
            />
          )}
        </div>

        {/* Modals */}
        {selectedShipment && (
          <>
            <AssignCourierModal
              isOpen={assignModalOpen}
              onClose={() => {
                setAssignModalOpen(false);
                setSelectedShipment(null);
              }}
              shipment={selectedShipment}
              onSuccess={handleShipmentUpdated}
            />

            <UpdateStatusModal
              isOpen={statusModalOpen}
              onClose={() => {
                setStatusModalOpen(false);
                setSelectedShipment(null);
              }}
              shipment={selectedShipment}
              onSuccess={handleShipmentUpdated}
              role="admin"
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
