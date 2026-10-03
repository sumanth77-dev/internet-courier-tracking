import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatusBadge from '../../components/common/StatusBadge';
import ShipmentTimeline from '../../components/shipment/ShipmentTimeline';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import UpdateStatusModal from '../../components/shipment/UpdateStatusModal';
import api from '../../services/api';
import {
  ArrowLeft,
  MapPin,
  Box,
  User,
  Phone,
  Mail,
  Navigation,
  RefreshCw,
  AlertCircle,
  Radio,
  CheckCircle,
} from 'lucide-react';

const NEXT_STAGE_LABELS = {
  Assigned: 'Mark as Picked Up',
  'Picked Up': 'Mark as In Transit',
  'In Transit': 'Mark Out for Delivery',
  'Out for Delivery': 'Confirm Delivery Completed',
};

const NEXT_STAGE_STATUS = {
  Assigned: 'Picked Up',
  'Picked Up': 'In Transit',
  'In Transit': 'Out for Delivery',
  'Out for Delivery': 'Delivered',
};

const CourierShipmentDetails = () => {
  const { id } = useParams();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingFast, setUpdatingFast] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  useEffect(() => {
    fetchDeliveryDetails();
  }, [id]);

  const fetchDeliveryDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/shipments/courier/${id}`);
      if (res.data?.success && res.data.data?.shipment) {
        setShipment(res.data.data.shipment);
      } else {
        setError(res.data?.message || 'Delivery task not found');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to retrieve assigned delivery details'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdated = (updated) => {
    setShipment(updated);
    setSuccessMsg(`Status updated successfully to '${updated.status}'`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Quick 1-click status progression following the linear state machine
  const handleQuickAdvance = async () => {
    if (!shipment) return;
    const nextStatus = NEXT_STAGE_STATUS[shipment.status];
    if (!nextStatus) return;

    setUpdatingFast(true);
    setError('');
    setSuccessMsg('');

    try {
      const shipmentId = shipment._id || shipment.id || shipment.trackingId;
      const res = await api.patch(`/shipments/courier/${shipmentId}/status`, {
        status: nextStatus,
      });

      if (res.data?.success && res.data.data?.shipment) {
        handleStatusUpdated(res.data.data.shipment);
      } else {
        setError(res.data?.message || 'Failed to update status');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server rejected status transition');
    } finally {
      setUpdatingFast(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Delivery Details">
        <div className="bg-white rounded-xl border border-[#D9DEE5] p-12">
          <LoadingSpinner message="Retrieving delivery task details..." />
        </div>
      </DashboardLayout>
    );
  }

  if (error && !shipment) {
    return (
      <DashboardLayout title="Delivery Details">
        <div className="bg-white rounded-xl border border-[#D9DEE5] p-10 text-center max-w-md mx-auto">
          <div className="w-10 h-10 rounded-full bg-red-50 text-[#B91C1C] flex items-center justify-center mx-auto mb-2.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-[#172033] mb-1">
            Unable to Load Delivery
          </h2>
          <p className="text-xs text-[#667085] mb-5">{error || 'Record does not exist'}</p>
          <Link
            to="/courier/shipments"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#172033] hover:bg-[#0F172A] rounded-lg transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Queue</span>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const customer = shipment?.customerId;
  const isCompleted = shipment?.status === 'Delivered';
  const isCancelled = shipment?.status === 'Cancelled';
  const canAdvance = NEXT_STAGE_STATUS[shipment?.status];

  return (
    <DashboardLayout title={`Delivery Task — ${shipment.trackingId}`}>
      <div className="space-y-5 max-w-5xl mx-auto">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D9DEE5]">
          <div className="flex items-center gap-3">
            <Link
              to="/courier/shipments"
              className="p-1.5 rounded-lg border border-[#D9DEE5] text-[#667085] hover:text-[#172033] hover:bg-white transition"
              aria-label="Back to assigned shipments"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base sm:text-lg font-bold text-[#172033]">
                  {shipment.trackingId}
                </span>
                <StatusBadge status={shipment.status} size="lg" />
              </div>
              <p className="text-xs text-[#667085] mt-0.5">
                Assigned: {formatDate(shipment.createdAt)}
              </p>
            </div>
          </div>

          {/* Quick Status Action Button */}
          {canAdvance && (
            <button
              onClick={handleQuickAdvance}
              disabled={updatingFast}
              className="px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition duration-150 flex items-center gap-2 disabled:opacity-60 cursor-pointer self-start sm:self-auto"
            >
              {updatingFast ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <span>{NEXT_STAGE_LABELS[shipment.status]}</span>
                  <CheckCircle className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>

        {error && <ErrorMessage message={error} />}

        {successMsg && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-[#15803D] flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Progress Timeline */}
        <div className="bg-white rounded-xl border border-[#D9DEE5] p-5 sm:p-6 shadow-xs">
          <h2 className="text-xs font-bold text-[#172033] uppercase tracking-wider mb-3">
            Delivery Lifecycle Progress
          </h2>
          <ShipmentTimeline
            currentStatus={shipment.status}
            pickedUpAt={shipment.pickedUpAt}
            deliveredAt={shipment.deliveredAt}
          />
        </div>

        {/* Location Sharing Placeholder Section */}
        <div className="bg-white rounded-xl border border-[#D9DEE5] p-6 shadow-xs text-center">
          <div className="w-10 h-10 rounded-lg bg-[#172033]/5 text-[#172033] flex items-center justify-center mx-auto mb-2">
            <Radio className="w-5 h-5 text-[#D97706]" />
          </div>
          <h3 className="text-sm font-bold text-[#172033] mb-1">
            Location Sharing
          </h3>
          <p className="text-xs text-[#667085] max-w-md mx-auto">
            Live location sharing will be available when GPS tracking is enabled.
          </p>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Origin and Destination Addresses */}
          <div className="bg-white rounded-xl border border-[#D9DEE5] p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#D9DEE5]/60">
              <MapPin className="w-4 h-4 text-[#172033]" />
              <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                Route Addresses
              </h3>
            </div>

            <div className="p-3 rounded-lg bg-[#F4F6F8] border border-[#D9DEE5] text-xs">
              <span className="font-semibold text-[#172033] block mb-1">
                Pickup Address (Sender)
              </span>
              <p className="text-[#263449]">{shipment.pickupAddress?.addressLine}</p>
              <p className="text-[#667085] mt-0.5">
                {shipment.pickupAddress?.city}, {shipment.pickupAddress?.state} - {shipment.pickupAddress?.postalCode}
              </p>
              <p className="text-[11px] text-[#667085] font-mono mt-1">
                Coordinates: {shipment.pickupAddress?.latitude}, {shipment.pickupAddress?.longitude}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#F4F6F8] border border-[#D9DEE5] text-xs">
              <span className="font-semibold text-[#D97706] block mb-1">
                Delivery Destination (Recipient)
              </span>
              <p className="text-[#263449]">{shipment.deliveryAddress?.addressLine}</p>
              <p className="text-[#667085] mt-0.5">
                {shipment.deliveryAddress?.city}, {shipment.deliveryAddress?.state} - {shipment.deliveryAddress?.postalCode}
              </p>
              <p className="text-[11px] text-[#667085] font-mono mt-1">
                Coordinates: {shipment.deliveryAddress?.latitude}, {shipment.deliveryAddress?.longitude}
              </p>
            </div>
          </div>

          {/* Customer & Package Details */}
          <div className="space-y-4">
            {/* Customer Details */}
            <div className="bg-white rounded-xl border border-[#D9DEE5] p-5 shadow-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-[#D9DEE5]/60 mb-3">
                <User className="w-4 h-4 text-[#172033]" />
                <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                  Customer Contact
                </h3>
              </div>

              {customer ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#D9DEE5]/60">
                    <span className="text-[#667085]">Customer Name:</span>
                    <span className="font-semibold text-[#172033]">{customer.name}</span>
                  </div>
                  {customer.phone && (
                    <div className="flex justify-between py-1 border-b border-[#D9DEE5]/60">
                      <span className="text-[#667085]">Phone:</span>
                      <a
                        href={`tel:${customer.phone}`}
                        className="font-semibold text-[#172033] hover:text-[#D97706] transition"
                      >
                        {customer.phone}
                      </a>
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex justify-between py-1">
                      <span className="text-[#667085]">Email:</span>
                      <span className="font-semibold text-[#172033]">{customer.email}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#667085] italic">Customer record unavailable.</p>
              )}
            </div>

            {/* Package Details */}
            <div className="bg-white rounded-xl border border-[#D9DEE5] p-5 shadow-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-[#D9DEE5]/60 mb-3">
                <Box className="w-4 h-4 text-[#172033]" />
                <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                  Package Specification
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#D9DEE5]/60">
                  <span className="text-[#667085]">Description:</span>
                  <span className="font-semibold text-[#172033]">
                    {shipment.packageDetails?.description || 'Standard Package'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#D9DEE5]/60">
                  <span className="text-[#667085]">Weight:</span>
                  <span className="font-semibold text-[#172033]">
                    {shipment.packageDetails?.weight} kg
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#667085]">Last Updated:</span>
                  <span className="font-semibold text-[#172033]">
                    {formatDate(shipment.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Status Modal Fallback */}
      <UpdateStatusModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        shipment={shipment}
        onSuccess={handleStatusUpdated}
        role="courier"
      />
    </DashboardLayout>
  );
};

export default CourierShipmentDetails;
