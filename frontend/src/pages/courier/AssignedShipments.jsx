import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ShipmentTable from '../../components/shipment/ShipmentTable';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import api from '../../services/api';
import { Search, Filter, Truck, RefreshCw } from 'lucide-react';

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
    <DashboardLayout title="Assigned Shipments">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#172033]">Assigned Shipments</h1>
            <p className="text-xs text-[#667085]">
              Deliveries assigned to your route.
            </p>
          </div>

          <button
            onClick={fetchShipments}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#172033] bg-white border border-[#D9DEE5] rounded-lg hover:bg-[#F4F6F8] transition self-start sm:self-auto cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload</span>
          </button>
        </div>

        {error && <ErrorMessage message={error} onRetry={fetchShipments} />}

        {/* Search & Filter */}
        <div className="bg-white rounded-xl border border-[#D9DEE5] p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#667085] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Tracking ID, City, Customer..."
              className="w-full pl-9 pr-3.5 h-10 text-xs sm:text-sm rounded-lg border border-[#D9DEE5] focus:outline-none focus:border-[#172033] focus:ring-1 focus:ring-[#172033] text-[#172033] placeholder-[#667085]/60"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-[#667085] shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3 h-10 text-xs sm:text-sm rounded-lg border border-[#D9DEE5] bg-white text-[#172033] focus:outline-none focus:border-[#172033] focus:ring-1 focus:ring-[#172033]"
            >
              <option value="ALL">All Active Statuses ({shipments.length})</option>
              <option value="Assigned">Assigned (Ready for Pickup)</option>
              <option value="Picked Up">Picked Up</option>
              <option value="In Transit">In Transit</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
        </div>

        {/* Table / Cards */}
        {loading ? (
          <div className="bg-white rounded-xl border border-[#D9DEE5] p-12">
            <LoadingSpinner message="Loading assigned shipments..." />
          </div>
        ) : filteredShipments.length === 0 ? (
          <EmptyState
            icon={Truck}
            title={searchTerm || statusFilter !== 'ALL' ? 'No matching deliveries' : 'No shipments assigned'}
            description={
              searchTerm || statusFilter !== 'ALL'
                ? 'Try adjusting your search criteria or status filter.'
                : 'You currently have no deliveries assigned.'
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
              <Link
                to={`/courier/shipments/${s._id || s.id || s.trackingId}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#172033] hover:text-[#D97706] bg-white border border-[#D9DEE5] hover:bg-[#F4F6F8] rounded-md transition shadow-xs"
              >
                View Delivery
              </Link>
            )}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default AssignedShipments;
