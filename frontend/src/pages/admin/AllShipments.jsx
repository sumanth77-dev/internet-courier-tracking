import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ShipmentTable from '../../components/shipment/ShipmentTable';
import AdminShipmentActions from '../../components/shipment/AdminShipmentActions';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import AssignCourierModal from '../../components/shipment/AssignCourierModal';
import UpdateStatusModal from '../../components/shipment/UpdateStatusModal';
import api from '../../services/api';
import { Search, Filter, RefreshCw, Package, ArrowLeft } from 'lucide-react';

const STATUS_FILTERS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Assigned', label: 'Assigned' },
  { value: 'Picked Up', label: 'Picked Up' },
  { value: 'In Transit', label: 'In Transit' },
  { value: 'Out for Delivery', label: 'Out for Delivery' },
  { value: 'Delivered', label: 'Delivered' },
  { value: 'Cancelled', label: 'Cancelled' },
];

const AllShipments = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [error, setError] = useState('');

  // Modal controls
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);

  useEffect(() => {
    fetchAllShipments();
  }, []);

  const fetchAllShipments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/shipments/admin/all');
      if (res.data?.success) {
        setShipments(res.data.data.shipments || []);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to load all platform shipments'
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

  const filteredShipments = shipments.filter((s) => {
    const tracking = (s.trackingId || '').toLowerCase();
    const destination = `${s.deliveryAddress?.city || ''} ${s.deliveryAddress?.state || ''}`.toLowerCase();
    const customer = (s.customerId?.name || s.customer?.name || '').toLowerCase();
    const courier = (s.courierId?.name || s.courier?.name || '').toLowerCase();
    const query = searchTerm.toLowerCase().trim();

    const matchesSearch =
      tracking.includes(query) ||
      destination.includes(query) ||
      customer.includes(query) ||
      courier.includes(query);

    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout title="All Shipments">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="p-2.5 rounded-xl border border-[#D5DEE7] bg-white text-[#123B5D] hover:text-[#0B1F33] hover:bg-[#E8EEF4] transition shadow-2xs"
              aria-label="Back to admin dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-[#142B45] tracking-tight">All Platform Shipments</h1>
              <p className="text-xs text-[#607487]">
                Master registry of all consignments, status updates, and courier dispatches.
              </p>
            </div>
          </div>

          <button
            onClick={fetchAllShipments}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#142B45] bg-white border border-[#D5DEE7] rounded-xl hover:bg-[#F0F3F7] transition self-start sm:self-auto cursor-pointer shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#00A6A6]" />
            <span>Reload</span>
          </button>
        </div>

        {error && <ErrorMessage message={error} onRetry={fetchAllShipments} />}

        {/* Filters and Search Bar */}
        <div className="bg-white rounded-2xl border border-[#D5DEE7] p-4 sm:p-5 shadow-2xs space-y-3.5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-[#8A9BAA] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Tracking ID, City, Customer, Courier..."
                className="w-full pl-10 pr-4 h-10 text-xs sm:text-sm rounded-xl border border-[#D5DEE7] bg-[#F0F3F7]/60 focus:bg-white focus:outline-none focus:border-[#00A6A6] focus:ring-1 focus:ring-[#00A6A6] text-[#142B45] placeholder-[#8A9BAA] transition"
              />
            </div>

            {/* Status Dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-[#8A9BAA] shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-3.5 h-10 text-xs sm:text-sm rounded-xl border border-[#D5DEE7] bg-white text-[#142B45] focus:outline-none focus:border-[#00A6A6] focus:ring-1 focus:ring-[#00A6A6] cursor-pointer transition font-medium"
              >
                {STATUS_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label} {f.value === 'ALL' ? `(${shipments.length})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 text-xs no-scrollbar">
            {STATUS_FILTERS.map((f) => {
              const count = f.value === 'ALL'
                ? shipments.length
                : shipments.filter((s) => s.status === f.value).length;
              const isActive = statusFilter === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setStatusFilter(f.value)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition cursor-pointer text-xs border ${
                    isActive
                      ? 'bg-[#0B1F33] text-white border-[#0B1F33] shadow-2xs font-semibold'
                      : 'bg-[#E8EEF4] text-[#123B5D] hover:bg-white hover:text-[#0B1F33] border-[#D5DEE7]'
                  }`}
                >
                  {f.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Shipments List */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-[#D5DEE7] p-12 shadow-2xs">
            <LoadingSpinner message="Retrieving shipments..." />
          </div>
        ) : filteredShipments.length === 0 ? (
          <EmptyState
            icon={Package}
            title={searchTerm || statusFilter !== 'ALL' ? 'No matching shipments' : 'No shipments found'}
            description={
              searchTerm || statusFilter !== 'ALL'
                ? 'Try adjusting your search criteria or status filter.'
                : 'There are currently no shipments registered in the system.'
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

export default AllShipments;
