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
            <h1 className="text-xl sm:text-2xl font-black text-[#202020] tracking-tight">
              My Shipments
            </h1>
            <p className="text-xs sm:text-sm text-[#777777] mt-0.5">
              Review and monitor all your booked parcel deliveries across India.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={fetchShipments}
              className="p-2.5 rounded-xl border border-[#DEDCD8] bg-white hover:bg-[#F2F0ED] text-[#202020] transition cursor-pointer shadow-xs"
              title="Refresh shipments"
              aria-label="Refresh shipments"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <Link
              to="/customer/shipments/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-[#FF7547] hover:bg-[#F06438] rounded-xl transition duration-150 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>New Shipment</span>
            </Link>
          </div>
        </div>

        {error && <ErrorMessage message={error} onRetry={fetchShipments} />}

        {/* Filters and Search Bar Card */}
        <div className="bg-white rounded-2xl border border-[#DEDCD8] p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-[#A7A7A7] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Tracking ID, City, or Address..."
                className="w-full pl-10 pr-9 h-11 text-xs sm:text-sm rounded-xl border border-[#DEDCD8] focus:outline-hidden focus:border-[#FF7547] focus:ring-1 focus:ring-[#FF7547] text-[#202020] placeholder-[#A7A7A7] transition bg-[#F2F0ED] font-medium"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A7A7A7] hover:text-[#202020]"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Status Select Filter */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-[#A7A7A7] shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full md:w-56 px-3.5 h-11 text-xs sm:text-sm rounded-xl border border-[#DEDCD8] bg-white text-[#202020] font-medium focus:outline-hidden focus:border-[#FF7547] focus:ring-1 focus:ring-[#FF7547] cursor-pointer"
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
            <span className="text-[11px] font-bold text-[#777777] uppercase tracking-wider mr-1 shrink-0">
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
                      ? 'bg-[#171717] text-white border-[#171717] shadow-xs'
                      : 'bg-[#F2F0ED] text-[#202020] hover:text-[#171717] border-[#DEDCD8] hover:bg-white'
                  }`}
                >
                  <span>{st}</span>
                  <span className={`ml-1.5 text-[10px] font-bold ${isActive ? 'text-[#FF7547]' : 'text-[#777777]'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Shipments List */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-[#DEDCD8] p-12 text-center shadow-xs">
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
