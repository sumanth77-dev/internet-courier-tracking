import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatsCard from '../components/common/StatsCard';
import ShipmentTable from '../components/shipment/ShipmentTable';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import api from '../services/api';
import {
  Package,
  Clock,
  Truck,
  CheckCircle2,
  Plus,
  ArrowRight,
} from 'lucide-react';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyShipments();
  }, []);

  const fetchMyShipments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/shipments/my-shipments');
      if (res.data?.success) {
        setShipments(res.data.data.shipments || []);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to fetch your shipments from server'
      );
    } finally {
      setLoading(false);
    }
  };

  // Compute real metrics from customer shipments
  const totalCount = shipments.length;
  const pendingCount = shipments.filter((s) => s.status === 'Pending').length;
  const inTransitCount = shipments.filter((s) =>
    ['Assigned', 'Picked Up', 'In Transit', 'Out for Delivery'].includes(s.status)
  ).length;
  const deliveredCount = shipments.filter((s) => s.status === 'Delivered').length;

  const recentShipments = shipments.slice(0, 5);

  return (
    <DashboardLayout title="Customer Dashboard">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
            Welcome back, {user?.name || 'Customer'}
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-0.5">
            Manage your shipments and track deliveries.
          </p>
        </div>

        <Link
          to="/customer/shipments/create"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition duration-150 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Shipment</span>
        </Link>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} onRetry={fetchMyShipments} />
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <StatsCard
          title="Total Shipments"
          value={loading ? '...' : totalCount}
          icon={Package}
          color="navy"
          subtitle="All created parcels"
        />
        <StatsCard
          title="Pending"
          value={loading ? '...' : pendingCount}
          icon={Clock}
          color="amber"
          subtitle="Awaiting dispatch assignment"
        />
        <StatsCard
          title="In Transit"
          value={loading ? '...' : inTransitCount}
          icon={Truck}
          color="blue"
          subtitle="Currently on the move"
        />
        <StatsCard
          title="Delivered"
          value={loading ? '...' : deliveredCount}
          icon={CheckCircle2}
          color="green"
          subtitle="Successfully delivered"
        />
      </div>

      {/* Recent Shipments Section */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#172033]">
              Recent Shipments
            </h2>
            <p className="text-xs text-[#667085]">Your latest parcel activities</p>
          </div>

          {shipments.length > 0 && (
            <Link
              to="/customer/shipments"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#172033] hover:text-[#D97706] transition"
            >
              <span>View All ({totalCount})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-[#D9DEE5] p-10">
            <LoadingSpinner message="Loading your recent shipments..." />
          </div>
        ) : shipments.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No shipments yet"
            description="You haven't created any shipments."
            actionText="Create Your First Shipment"
            actionLink="/customer/shipments/create"
          />
        ) : (
          <ShipmentTable
            shipments={recentShipments}
            showCourier={true}
            viewLinkPrefix="/customer/shipments"
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default CustomerDashboard;
