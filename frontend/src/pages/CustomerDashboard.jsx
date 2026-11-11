import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Search,
  Compass,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quickTrackingId, setQuickTrackingId] = useState('');
  const navigate = useNavigate();

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

  const handleQuickTrack = (e) => {
    e.preventDefault();
    if (!quickTrackingId.trim()) return;
    navigate(`/customer/shipments/${encodeURIComponent(quickTrackingId.trim())}`);
  };

  return (
    <DashboardLayout title="Customer Dashboard">
      <div className="space-y-6">
        {/* Welcome Hero Banner — Midnight Navy #0B1F33 */}
        <div className="bg-[#0B1F33] text-white rounded-[22px] border border-[#176B87]/40 p-5 sm:p-6 shadow-md relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#123B5D] border border-[#176B87]/60">
                <span className="w-2 h-2 rounded-full bg-[#00A6A6] animate-pulse"></span>
                <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                  SkyRoute Express Client
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Welcome back, {user?.name || 'Customer'}
              </h1>
              <p className="text-xs sm:text-sm text-[#DCE5EC] max-w-xl leading-relaxed">
                Track deliveries in real time, generate one-time verification passwords (OTP), and book new consignments across India.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={fetchMyShipments}
                className="p-2.5 rounded-xl border border-[#176B87]/60 bg-[#123B5D] hover:bg-[#176B87] text-[#DCE5EC] hover:text-white transition cursor-pointer shadow-xs"
                title="Refresh shipments"
                aria-label="Refresh shipments"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <Link
                to="/customer/shipments/create"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#00A6A6] hover:bg-[#008F95] text-white text-xs sm:text-sm font-bold rounded-[11px] shadow-sm transition duration-150 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>Create Shipment</span>
              </Link>
            </div>
          </div>

          {/* Quick Track Search Strip */}
          <div className="mt-5 pt-4 border-t border-[#176B87]/40 relative z-10">
            <form onSubmit={handleQuickTrack} className="flex flex-col sm:flex-row gap-2 max-w-lg">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#8A9BAA] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={quickTrackingId}
                  onChange={(e) => setQuickTrackingId(e.target.value)}
                  placeholder="Quick lookup by Tracking ID..."
                  className="w-full h-10 pl-9 pr-3 text-xs rounded-xl border border-[#176B87]/60 bg-[#071524] text-white placeholder-[#8A9BAA] focus:outline-none focus:border-[#00A6A6] focus:ring-1 focus:ring-[#00A6A6] transition font-medium font-mono"
                />
              </div>
              <button
                type="submit"
                className="h-10 px-4 rounded-[11px] bg-[#00A6A6] hover:bg-[#008F95] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0"
              >
                <Compass className="w-3.5 h-3.5 text-white" />
                <span>Track Now</span>
              </button>
            </form>
          </div>
        </div>

        {error && (
          <ErrorMessage message={error} onRetry={fetchMyShipments} />
        )}

        {/* 4 Summary Metrics KPI Grid with Solid Dark Deep Ocean Colors */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <StatsCard
            title="Total Shipments"
            value={loading ? '...' : totalCount}
            icon={Package}
            color="total"
            subtitle="All booked parcels"
          />
          <StatsCard
            title="Pending Pickup"
            value={loading ? '...' : pendingCount}
            icon={Clock}
            color="pending"
            subtitle="Awaiting courier dispatch"
          />
          <StatsCard
            title="In Transit"
            value={loading ? '...' : inTransitCount}
            icon={Truck}
            color="inTransit"
            subtitle="Live on the road"
          />
          <StatsCard
            title="Delivered"
            value={loading ? '...' : deliveredCount}
            icon={CheckCircle2}
            color="delivered"
            subtitle="Successfully completed"
          />
        </div>

        {/* Recent Shipments Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#142B45] tracking-tight">
                Recent Shipments
              </h2>
              <p className="text-xs text-[#607487]">
                Live tracking and status updates for your latest consignments
              </p>
            </div>
            {shipments.length > 0 && (
              <Link
                to="/customer/shipments"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#00A6A6] hover:text-[#123B5D] transition"
              >
                <span>View All ({shipments.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border border-[#D5DEE7] p-12 text-center shadow-2xs">
              <LoadingSpinner message="Retrieving your shipments..." />
            </div>
          ) : shipments.length === 0 ? (
            <EmptyState
              title="No shipments registered yet"
              description="You have not created any deliveries yet. Select pickup and delivery locations to begin dispatching with SkyRoute."
              actionText="Create First Shipment"
              actionLink="/customer/shipments/create"
              icon={Package}
            />
          ) : (
            <ShipmentTable
              shipments={recentShipments}
              showCourier={true}
              viewLinkPrefix="/customer/shipments"
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomerDashboard;
