import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ShipmentTable from '../../components/shipment/ShipmentTable';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import api from '../../services/api';
import { Search, Filter, Plus, Package, RefreshCw, X } from 'lucide-react';

const STATUS_OPTIONS = [
  'ALL',
  'Pending',
  'Assigned',
  'Picked Up',
  'In Transit',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

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
    const destination = `${s.deliveryAddress?.city || ''} ${s.deliveryAddress?.state || ''} ${s.deliveryAddress?.addressLine || ''}`.toLowerCase();
    const query = searchTerm.toLowerCase().trim();

    const matchesSearch = tracking.includes(query) || destination.includes(query);
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout title="My Shipments">
      <div className="space-y-5">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#142B45] tracking-tight">
              My Shipments
            </h1>
            <p className="text-xs sm:text-sm text-[#607487] mt-0.5">
              Review and monitor all your booked parcel deliveries across India.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={fetchShipments}
              className="p-2.5 rounded-xl border border-[#D5DEE7] bg-white hover:bg-[#F0F3F7] text-[#123B5D] hover:text-[#0B1F33] transition cursor-pointer shadow-2xs"
              title="Refresh shipments"
              aria-label="Refresh shipments"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <Link
              to="/customer/shipments/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-[#00A6A6] hover:bg-[#008F95] rounded-[11px] transition duration-150 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>New Shipment</span>
            </Link>
          </div>
        </div>

        {error && <ErrorMessage message={error} onRetry={fetchShipments} />}

        {/* Filters and Search Bar Card */}
        <div className="bg-white rounded-2xl border border-[#D5DEE7] p-4 sm:p-5 shadow-2xs space-y-3.5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-[#8A9BAA] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Tracking ID, City, or Address..."
                className="w-full pl-10 pr-9 h-11 text-xs sm:text-sm rounded-xl border border-[#D5DEE7] focus:outline-none focus:border-[#00A6A6] focus:ring-1 focus:ring-[#00A6A6] text-[#142B45] placeholder-[#8A9BAA] transition bg-[#F0F3F7]/70 font-medium"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A9BAA] hover:text-[#142B45]"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Status Select Filter */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-[#8A9BAA] shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full md:w-56 px-3.5 h-11 text-xs sm:text-sm rounded-xl border border-[#D5DEE7] bg-white text-[#142B45] font-medium focus:outline-none focus:border-[#00A6A6] focus:ring-1 focus:ring-[#00A6A6] cursor-pointer"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st === 'ALL' ? `All Statuses (${shipments.length})` : st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
            <span className="text-[11px] font-bold text-[#607487] uppercase tracking-wider mr-1 shrink-0">
              Filter:
            </span>
            {['ALL', 'Pending', 'In Transit', 'Out for Delivery', 'Delivered'].map((st) => {
              const count = st === 'ALL' ? shipments.length : shipments.filter((s) => s.status === st).length;
              const isActive = statusFilter === st;

              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                    isActive
                      ? 'bg-[#0B1F33] text-white border-[#0B1F33] shadow-2xs'
                      : 'bg-[#E8EEF4] text-[#123B5D] hover:text-[#0B1F33] border-[#D5DEE7] hover:bg-white'
                  }`}
                >
                  <span>{st}</span>
                  <span className={`ml-1.5 text-[10px] font-bold ${isActive ? 'text-[#00A6A6]' : 'text-[#607487]'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Shipments List */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-[#D5DEE7] p-12 text-center shadow-2xs">
            <LoadingSpinner message="Loading your shipments..." />
          </div>
        ) : filteredShipments.length === 0 ? (
          <EmptyState
            title="No shipments matched your criteria"
            description={
              searchTerm || statusFilter !== 'ALL'
                ? 'Try adjusting your search query or reset the status filters to view records.'
                : 'You have not registered any delivery parcels yet.'
            }
            actionText={searchTerm || statusFilter !== 'ALL' ? 'Reset Filters' : 'Create New Shipment'}
            actionLink={
              searchTerm || statusFilter !== 'ALL' ? undefined : '/customer/shipments/create'
            }
            onAction={
              searchTerm || statusFilter !== 'ALL'
                ? () => {
                    setSearchTerm('');
                    setStatusFilter('ALL');
                  }
                : undefined
            }
            icon={Package}
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
