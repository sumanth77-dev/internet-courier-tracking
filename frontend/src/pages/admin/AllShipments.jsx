import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ShipmentTable from '../../components/shipment/ShipmentTable';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import AssignCourierModal from '../../components/shipment/AssignCourierModal';
import UpdateStatusModal from '../../components/shipment/UpdateStatusModal';
import api from '../../services/api';
import { Search, Filter, RefreshCw, Package } from 'lucide-react';

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
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#172033]">All Shipments</h1>
            <p className="text-xs text-[#667085]">
              Platform overview, courier assignments, and delivery tracking.
            </p>
          </div>

          <button
            onClick={fetchAllShipments}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#172033] bg-white border border-[#D9DEE5] rounded-lg hover:bg-[#F4F6F8] transition self-start sm:self-auto cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload</span>
          </button>
        </div>

        {error && <ErrorMessage message={error} onRetry={fetchAllShipments} />}

        {/* Filters and Search Bar */}
        <div className="bg-white rounded-xl border border-[#D9DEE5] p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#667085] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Tracking ID, Customer, Courier..."
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
              <div className="flex items-center justify-end gap-1.5">
                <Link
                  to={`/admin/shipments/${s._id || s.trackingId}`}
                  className="px-2.5 py-1 text-xs font-semibold text-[#172033] hover:text-[#D97706] bg-white border border-[#D9DEE5] hover:bg-[#F4F6F8] rounded-md transition shadow-xs"
                >
                  View
                </Link>

                {/* Assign Courier button */}
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

                {/* Update Status button */}
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

export default AllShipments;
