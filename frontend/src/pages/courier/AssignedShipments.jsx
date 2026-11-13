import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ShipmentTable from '../../components/shipment/ShipmentTable';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import api from '../../services/api';
import { Search, Filter, Truck, RefreshCw, ArrowLeft, Play } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Active' },
  { value: 'Assigned', label: 'Assigned' },
  { value: 'Picked Up', label: 'Picked Up' },
  { value: 'In Transit', label: 'In Transit' },
  { value: 'Out for Delivery', label: 'Out for Delivery' },
  { value: 'Delivered', label: 'Delivered' },
];

const AssignedShipments = () => {
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
      const res = await api.get('/shipments/courier/assigned');
      if (res.data?.success) {
        setShipments(res.data.data.shipments || []);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to retrieve assigned deliveries'
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredShipments = shipments.filter((s) => {
    const tracking = (s.trackingId || '').toLowerCase();
    const destination = `${s.deliveryAddress?.city || ''} ${s.deliveryAddress?.state || ''}`.toLowerCase();
    const customer = (s.customerId?.name || s.customer?.name || '').toLowerCase();
    const query = searchTerm.toLowerCase().trim();

    const matchesSearch =
      tracking.includes(query) || destination.includes(query) || customer.includes(query);
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout title="Assigned Deliveries">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/courier"
              className="p-2.5 rounded-xl border border-[#DEDCD8] bg-white text-[#202020] hover:bg-[#F2F0ED] transition shadow-xs"
              aria-label="Back to courier dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-[#202020] tracking-tight">Assigned Deliveries</h1>
              <p className="text-xs text-[#777777]">
                Shipments dispatched to your personal route for collection and delivery.
              </p>
            </div>
          </div>

          <button
            onClick={fetchShipments}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#202020] bg-white border border-[#DEDCD8] rounded-xl hover:bg-[#F2F0ED] transition self-start sm:self-auto cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#FF7547]" />
            <span>Reload</span>
          </button>
        </div>

        {error && <ErrorMessage message={error} onRetry={fetchShipments} />}

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl border border-[#DEDCD8] p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-[#A7A7A7] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Tracking ID, City, Customer..."
                className="w-full pl-10 pr-4 h-10 text-xs sm:text-sm rounded-xl border border-[#DEDCD8] bg-[#F2F0ED] focus:bg-white focus:outline-hidden focus:border-[#FF7547] focus:ring-1 focus:ring-[#FF7547] text-[#202020] placeholder-[#A7A7A7] transition"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-[#A7A7A7] shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-3.5 h-10 text-xs sm:text-sm rounded-xl border border-[#DEDCD8] bg-white text-[#202020] focus:outline-hidden focus:border-[#FF7547] focus:ring-1 focus:ring-[#FF7547] cursor-pointer transition font-medium"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} {opt.value === 'ALL' ? `(${shipments.length})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 text-xs no-scrollbar">
            {STATUS_OPTIONS.map((opt) => {
              const count = opt.value === 'ALL'
                ? shipments.length
                : shipments.filter((s) => s.status === opt.value).length;
              const isActive = statusFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatusFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition cursor-pointer text-xs border ${
                    isActive
                      ? 'bg-[#171717] text-white border-[#171717] shadow-xs font-semibold'
                      : 'bg-[#F2F0ED] text-[#202020] hover:bg-white hover:text-[#171717] border-[#DEDCD8]'
                  }`}
                >
                  {opt.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Table / Cards */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-[#DEDCD8] p-12 shadow-xs">
            <LoadingSpinner message="Retrieving assigned shipments..." />
          </div>
        ) : filteredShipments.length === 0 ? (
          <EmptyState
            icon={Truck}
            title={searchTerm || statusFilter !== 'ALL' ? 'No matching deliveries' : 'No shipments assigned'}
            description={
              searchTerm || statusFilter !== 'ALL'
                ? 'Try adjusting your search query or filter selection.'
                : 'You currently have no deliveries assigned to your route.'
            }
            actionText={searchTerm || statusFilter !== 'ALL' ? 'Clear Filters' : null}
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
            showCustomer={true}
            viewLinkPrefix="/courier/shipments"
            renderActions={(s) => (
              <div className="inline-flex items-center justify-end gap-1.5 flex-nowrap whitespace-nowrap">
                <Link
                  to={`/courier/shipments/${s._id || s.id || s.trackingId}`}
                  className="h-8 px-3 text-xs font-semibold text-[#202020] hover:text-[#FF7547] bg-white border border-[#DEDCD8] hover:bg-[#F2F0ED] rounded-xl transition duration-150 shadow-xs inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  View
                </Link>
                <Link
                  to={`/courier/simulator?shipmentId=${s._id || s.id || s.trackingId}`}
                  className="h-8 px-3 text-xs font-semibold text-[#FF7547] bg-[#FFF2ED] hover:bg-[#FFE5DC] border border-[#FFD6C9] rounded-xl transition duration-150 shadow-xs inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <Play className="w-3 h-3 fill-current text-[#FF7547]" />
                  <span>Demo</span>
                </Link>
              </div>
            )}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default AssignedShipments;
