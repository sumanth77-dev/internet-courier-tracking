import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ShipmentTable from '../../components/shipment/ShipmentTable';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import api from '../../services/api';
import { Search, Filter, Plus, Package } from 'lucide-react';

const MyShipments = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/shipments/my-shipments');
      if (res.data?.success) {
        setShipments(res.data.data.shipments || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to fetch your shipments');
    } finally {
      setLoading(false);
    }
  };

  // Filtered shipments
  const filteredShipments = shipments.filter((s) => {
    const tracking = (s.trackingId || '').toLowerCase();
    const destination = `${s.deliveryAddress?.city || ''} ${s.deliveryAddress?.state || ''}`.toLowerCase();
    const query = searchTerm.toLowerCase().trim();

    const matchesSearch = tracking.includes(query) || destination.includes(query);
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout title="My Shipments">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#172033]">My Shipments</h1>
            <p className="text-xs text-[#667085]">
              View and manage your shipments.
            </p>
          </div>

          <Link
            to="/customer/shipments/create"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#172033] hover:bg-[#0F172A] rounded-lg transition shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-[#D97706]" />
            <span>New Shipment</span>
          </Link>
        </div>

        {error && <ErrorMessage message={error} onRetry={fetchShipments} />}

        {/* Filters and Search Bar */}
        <div className="bg-white rounded-xl border border-[#D9DEE5] p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#667085] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Tracking ID or City..."
              className="w-full pl-9 pr-3.5 h-10 text-xs sm:text-sm rounded-lg border border-[#D9DEE5] focus:outline-none focus:border-[#172033] focus:ring-1 focus:ring-[#172033] text-[#172033] placeholder-[#667085]/60"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-[#667085] shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3 h-10 text-xs sm:text-sm rounded-lg border border-[#D9DEE5] bg-white text-[#172033] focus:outline-none focus:border-[#172033] focus:ring-1 focus:ring-[#172033]"
            >
              <option value="ALL">All Statuses ({shipments.length})</option>
              <option value="Pending">Pending</option>
              <option value="Assigned">Assigned</option>
              <option value="Picked Up">Picked Up</option>
              <option value="In Transit">In Transit</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Shipments List */}
        {loading ? (
          <div className="bg-white rounded-xl border border-[#D9DEE5] p-12">
            <LoadingSpinner message="Loading shipments..." />
          </div>
        ) : filteredShipments.length === 0 ? (
          <EmptyState
            icon={Package}
            title={searchTerm || statusFilter !== 'ALL' ? 'No matching shipments' : 'No shipments yet'}
            description={
              searchTerm || statusFilter !== 'ALL'
                ? 'Try adjusting your search criteria or status filter.'
                : "You haven't created any shipments."
            }
            actionText={searchTerm || statusFilter !== 'ALL' ? 'Clear Filters' : 'Create Your First Shipment'}
            actionLink={searchTerm || statusFilter !== 'ALL' ? null : '/customer/shipments/create'}
            onAction={
              searchTerm || statusFilter !== 'ALL'
                ? () => {
                    setSearchTerm('');
                    setStatusFilter('ALL');
                  }
                : null
            }
          />
        ) : (
          <ShipmentTable
            shipments={filteredShipments}
            showCourier={true}
            viewLinkPrefix="/customer/shipments"
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyShipments;
