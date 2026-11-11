import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatusBadge from '../../components/common/StatusBadge';
import ShipmentTimeline from '../../components/shipment/ShipmentTimeline';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import UpdateStatusModal from '../../components/shipment/UpdateStatusModal';
import CourierLocationPanel from '../../components/tracking/CourierLocationPanel';
import { ProofOfDeliveryModal } from '../../components/delivery/ProofOfDeliveryModal';
import { ProofOfDeliveryCard } from '../../components/delivery/ProofOfDeliveryCard';
import useCourierLocation from '../../hooks/useCourierLocation';
import useTrackingSocket from '../../hooks/useTrackingSocket';
import api from '../../services/api';
import {
  ArrowLeft,
  MapPin,
  Box,
  User,
  AlertCircle,
  CheckCircle,
  Compass,
  ShieldCheck,
  Calendar,
  Phone,
  Mail,
  ChevronRight,
} from 'lucide-react';

const NEXT_STAGE_LABELS = {
  Assigned: 'Mark as Picked Up',
  'Picked Up': 'Mark as In Transit',
  'In Transit': 'Mark Out for Delivery',
  'Out for Delivery': 'Complete Delivery (POD)',
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
  const [podModalOpen, setPodModalOpen] = useState(false);

  // GPS & Socket Tracking Hooks
  const courierLocation = useCourierLocation();
  const trackingSocket = useTrackingSocket({
    shipmentId: shipment?._id || shipment?.id || id,
    role: 'courier',
    autoJoin: false,
  });

  const fetchDeliveryDetails = useCallback(async () => {
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
  }, [id]);

  useEffect(() => {
    fetchDeliveryDetails();
  }, [fetchDeliveryDetails]);

  const handleStartSharing = async () => {
    const sId = shipment?._id || shipment?.id || id;
    const ok = courierLocation.startTracking();
    if (ok !== false) {
      await trackingSocket.startCourierTracking(sId);
    }
  };

  const handleStopSharing = async () => {
    const sId = shipment?._id || shipment?.id || id;
    courierLocation.stopTracking();
    await trackingSocket.stopTracking(sId);
  };

  // Stream throttled GPS location updates to backend via Socket.IO
  useEffect(() => {
    if (courierLocation.isTracking && courierLocation.coords && shipment) {
      const sId = shipment._id || shipment.id || id;
      trackingSocket.sendLocationUpdate({
        shipmentId: sId,
        latitude: courierLocation.coords.latitude,
        longitude: courierLocation.coords.longitude,
        accuracy: courierLocation.coords.accuracy,
      });
    }
  }, [courierLocation.coords, courierLocation.isTracking, shipment, id, trackingSocket]);

  const handleStatusUpdated = (updated) => {
    setShipment(updated);
    setSuccessMsg(`Status updated successfully to '${updated.status}'`);
    setTimeout(() => setSuccessMsg(''), 4000);

    // If delivered or cancelled, automatically halt tracking
    if (['Delivered', 'Cancelled'].includes(updated.status)) {
      handleStopSharing();
    }
  };

  // Quick 1-click status progression following the linear state machine
  const handleQuickAdvance = async () => {
    if (!shipment) return;

    // Out for Delivery requires full Proof of Delivery (Photo + OTP verification)
    if (shipment.status === 'Out for Delivery') {
      setPodModalOpen(true);
      return;
    }

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
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12">
          <LoadingSpinner message="Retrieving delivery task details..." />
        </div>
      </DashboardLayout>
    );
  }

  if (error && !shipment) {
    return (
      <DashboardLayout title="Delivery Details">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-10 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-[#DC5353] flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-[#182433] mb-1">
            Unable to Load Delivery
          </h2>
          <p className="text-xs text-[#718096] mb-5">{error || 'This delivery task does not exist or has been reassigned.'}</p>
          <Link
            to="/courier/shipments"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#142B45] hover:bg-[#245B78] rounded-xl transition shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
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
  const isTrackableState = ['Assigned', 'Picked Up', 'In Transit', 'Out for Delivery'].includes(shipment?.status);

  return (
    <DashboardLayout title={`Delivery Task — ${shipment.trackingId}`}>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Deep Ocean Header Bar */}
        <div className="bg-[#0B1F33] text-white rounded-[22px] border border-[#176B87]/40 p-5 sm:p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <Link
              to="/courier/shipments"
              className="p-2.5 rounded-xl border border-[#176B87]/60 bg-[#123B5D] text-white hover:bg-[#176B87] transition shadow-2xs shrink-0"
              aria-label="Back to assigned shipments"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-base sm:text-lg font-bold text-[#00A6A6] tracking-tight break-all">
                  {shipment.trackingId}
                </span>
                <StatusBadge status={shipment.status} size="lg" />
              </div>
              <p className="text-xs text-[#DCE5EC] mt-1 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#8A9BAA]" />
                <span>Assigned: {formatDate(shipment.createdAt)}</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            <Link
              to={`/courier/simulator?shipmentId=${shipment._id || shipment.id || id}`}
              className="px-3.5 py-2.5 bg-[#123B5D] hover:bg-[#176B87] text-white text-xs sm:text-sm font-semibold rounded-[11px] border border-[#176B87] shadow-xs transition duration-150 flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-[#00A6A6]" />
              <span>Demo Simulator</span>
            </Link>

            {canAdvance && (
              <button
                onClick={handleQuickAdvance}
                disabled={updatingFast}
                className="px-4 py-2.5 bg-[#00A6A6] hover:bg-[#008F95] text-white text-xs sm:text-sm font-bold rounded-[11px] shadow-xs transition duration-150 flex items-center gap-2 disabled:opacity-60 cursor-pointer"
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
        </div>

        {error && <ErrorMessage message={error} />}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-[#E7F5F2] border border-[#CCEAE3] text-xs font-semibold text-[#16875D] flex items-center gap-2 shadow-2xs">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Progress Timeline */}
        <div className="bg-white rounded-2xl border border-[#DCE5EF] p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-xs font-bold text-[#142B45] uppercase tracking-wider">
              Delivery Lifecycle Progress
            </h2>
            <span className="text-xs text-[#64748B]">Updated: {formatDate(shipment.updatedAt)}</span>
          </div>
          <ShipmentTimeline
            currentStatus={shipment.status}
            pickedUpAt={shipment.pickedUpAt}
            deliveredAt={shipment.deliveredAt}
          />
        </div>

        {/* Out for Delivery Action Banner */}
        {shipment.status === 'Out for Delivery' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF4E8] border border-[#FCE3C8] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#D99024] text-white shrink-0 mt-0.5 shadow-2xs">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#182433] tracking-tight">
                  Destination Reached — Proof of Delivery Required
                </h3>
                <p className="text-xs text-[#7A531A] mt-1 leading-relaxed">
                  Collect the 6-digit delivery OTP from the customer and capture a photo of the handed parcel to verify and complete delivery.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPodModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#16875D] hover:bg-[#136B4A] text-white text-xs sm:text-sm font-semibold shadow-xs transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Complete Delivery (POD)</span>
            </button>
          </div>
        )}

        {/* Proof of Delivery Card (Visible when Delivered) */}
        {shipment.status === 'Delivered' && (
          <ProofOfDeliveryCard shipment={shipment} />
        )}

        {/* Live GPS Location Sharing Panel */}
        {isTrackableState ? (
          <CourierLocationPanel
            status={courierLocation.status}
            coords={courierLocation.coords}
            error={courierLocation.error}
            isTracking={courierLocation.isTracking}
            isStarting={courierLocation.isStarting}
            onStartTracking={handleStartSharing}
            onStopTracking={handleStopSharing}
            connectionStatus={trackingSocket.connectionStatus}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-[#DCE5EF] p-6 shadow-2xs text-center">
            <p className="text-xs text-[#64748B]">
              {isCompleted
                ? `Delivery completed at ${formatDate(shipment.deliveredAt)}. Live location tracking has concluded.`
                : isCancelled
                ? 'Shipment cancelled. Live location sharing is disabled.'
                : 'Location sharing is not available for this shipment status.'}
            </p>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Origin and Destination Addresses */}
          <div className="bg-white rounded-2xl border border-[#DCE5EF] p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2 pb-3 border-b border-[#DCE5EF]">
              <div className="w-7 h-7 rounded-lg bg-[#EAF5F8] text-[#126965] flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-[#142B45] uppercase tracking-wider">
                Route Addresses
              </h3>
            </div>

            <div className="p-3.5 rounded-xl bg-[#EAF2FA] border border-[#CFE1F4] text-xs">
              <span className="font-semibold text-[#245B78] block mb-1">
                Pickup Address (Sender)
              </span>
              <p className="text-[#182433] font-medium">{shipment.pickupAddress?.addressLine}</p>
              <p className="text-[#64748B] mt-0.5">
                {shipment.pickupAddress?.city}, {shipment.pickupAddress?.state} - {shipment.pickupAddress?.postalCode}
              </p>
              <p className="text-[11px] text-[#64748B] font-mono mt-1">
                GPS: {shipment.pickupAddress?.latitude}, {shipment.pickupAddress?.longitude}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#EAF5F8] border border-[#CFEAEF] text-xs">
              <span className="font-semibold text-[#126965] block mb-1">
                Delivery Destination (Recipient)
              </span>
              <p className="text-[#182433] font-medium">{shipment.deliveryAddress?.addressLine}</p>
              <p className="text-[#64748B] mt-0.5">
                {shipment.deliveryAddress?.city}, {shipment.deliveryAddress?.state} - {shipment.deliveryAddress?.postalCode}
              </p>
              <p className="text-[11px] text-[#64748B] font-mono mt-1">
                GPS: {shipment.deliveryAddress?.latitude}, {shipment.deliveryAddress?.longitude}
              </p>
            </div>
          </div>

          {/* Customer & Package Details */}
          <div className="space-y-5">
            {/* Customer Details */}
            <div className="bg-[#F1EFFA]/50 rounded-2xl border border-[#DFDAF4] p-5 shadow-2xs">
              <div className="flex items-center gap-2 pb-3 border-b border-[#DFDAF4] mb-3.5">
                <div className="w-7 h-7 rounded-lg bg-[#52438F] text-white flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-[#52438F] uppercase tracking-wider">
                  Customer Contact
                </h3>
              </div>

              {customer ? (
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#DFDAF4]/60">
                    <span className="text-[#64748B]">Customer Name:</span>
                    <span className="font-semibold text-[#142B45]">{customer.name}</span>
                  </div>
                  {customer.phone && (
                    <div className="flex justify-between py-1 border-b border-[#DFDAF4]/60">
                      <span className="text-[#64748B]">Phone:</span>
                      <a
                        href={`tel:${customer.phone}`}
                        className="font-semibold text-[#142B45] hover:text-[#18A6A0] transition flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3 text-[#18A6A0]" />
                        <span>{customer.phone}</span>
                      </a>
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex justify-between py-1">
                      <span className="text-[#64748B]">Email:</span>
                      <span className="font-semibold text-[#142B45] break-all">{customer.email}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#64748B] italic">Customer record unavailable.</p>
              )}
            </div>

            {/* Package Details */}
            <div className="bg-white rounded-2xl border border-[#DCE5EF] p-5 shadow-2xs">
              <div className="flex items-center gap-2 pb-3 border-b border-[#DCE5EF] mb-3.5">
                <div className="w-7 h-7 rounded-lg bg-[#EAF2FA] text-[#245B78] flex items-center justify-center">
                  <Box className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-[#142B45] uppercase tracking-wider">
                  Package Specification
                </h3>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-[#DCE5EF]">
                  <span className="text-[#64748B]">Description:</span>
                  <span className="font-semibold text-[#142B45]">
                    {shipment.packageDetails?.description || 'Standard Parcel'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#DCE5EF]">
                  <span className="text-[#64748B]">Weight:</span>
                  <span className="font-semibold text-[#142B45]">
                    {shipment.packageDetails?.weight} kg
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#64748B]">Last Updated:</span>
                  <span className="font-semibold text-[#142B45]">
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

      {/* Proof of Delivery Modal */}
      <ProofOfDeliveryModal
        isOpen={podModalOpen}
        onClose={() => setPodModalOpen(false)}
        shipment={shipment}
        onDeliveryComplete={handleStatusUpdated}
      />
    </DashboardLayout>
  );
};

export default CourierShipmentDetails;
