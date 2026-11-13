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
        <div className="bg-white rounded-2xl border border-[#DEDCD8] p-12">
          <LoadingSpinner message="Retrieving delivery task details..." />
        </div>
      </DashboardLayout>
    );
  }

  if (error && !shipment) {
    return (
      <DashboardLayout title="Delivery Details">
        <div className="bg-white rounded-2xl border border-[#DEDCD8] p-10 text-center max-w-md mx-auto shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-[#FDF1F0] text-[#E45B54] flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-[#202020] mb-1">
            Unable to Load Delivery
          </h2>
          <p className="text-xs text-[#777777] mb-5">{error || 'This delivery task does not exist or has been reassigned.'}</p>
          <Link
            to="/courier/shipments"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#171717] hover:bg-[#303030] rounded-xl transition shadow-xs"
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
        {/* Charcoal Header Bar */}
        <div className="bg-[#242424] text-white rounded-2xl border border-[#383838] p-5 sm:p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <Link
              to="/courier/shipments"
              className="p-2.5 rounded-xl border border-[#383838] bg-[#171717] text-white hover:bg-[#303030] transition shadow-xs shrink-0"
              aria-label="Back to assigned shipments"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-base sm:text-lg font-bold text-[#FF7547] tracking-tight break-all">
                  {shipment.trackingId}
                </span>
                <StatusBadge status={shipment.status} size="lg" />
              </div>
              <p className="text-xs text-[#C5C5C5] mt-1 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#929292]" />
                <span>Assigned: {formatDate(shipment.createdAt)}</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            <Link
              to={`/courier/simulator?shipmentId=${shipment._id || shipment.id || id}`}
              className="px-3.5 py-2.5 bg-[#171717] hover:bg-[#303030] text-white text-xs sm:text-sm font-semibold rounded-xl border border-[#383838] shadow-xs transition duration-150 flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-[#FF7547]" />
              <span>Demo Simulator</span>
            </Link>

            {canAdvance && (
              <button
                onClick={handleQuickAdvance}
                disabled={updatingFast}
                className="px-4 py-2.5 bg-[#FF7547] hover:bg-[#F06438] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition duration-150 flex items-center gap-2 disabled:opacity-60 cursor-pointer"
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
          <div className="p-3.5 rounded-xl bg-[#EAF7F1] border border-[#C4E8D8] text-xs font-semibold text-[#238259] flex items-center gap-2 shadow-xs">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Progress Timeline */}
        <div className="bg-white rounded-2xl border border-[#DEDCD8] p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-xs font-bold text-[#202020] uppercase tracking-wider">
              Delivery Lifecycle Progress
            </h2>
            <span className="text-xs text-[#777777]">Updated: {formatDate(shipment.updatedAt)}</span>
          </div>
          <ShipmentTimeline
            currentStatus={shipment.status}
            pickedUpAt={shipment.pickedUpAt}
            deliveredAt={shipment.deliveredAt}
          />
        </div>

        {/* Out for Delivery Action Banner */}
        {shipment.status === 'Out for Delivery' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FEF7ED] border border-[#FDE3C8] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#E9A23B] text-white shrink-0 mt-0.5 shadow-xs">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#202020] tracking-tight">
                  Destination Reached — Proof of Delivery Required
                </h3>
                <p className="text-xs text-[#777777] mt-1 leading-relaxed">
                  Collect the 6-digit delivery OTP from the customer and capture a photo of the handed parcel to verify and complete delivery.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPodModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#FF7547] hover:bg-[#F06438] text-white text-xs sm:text-sm font-bold shadow-xs transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
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
          <div className="bg-white rounded-2xl border border-[#DEDCD8] p-6 shadow-xs text-center">
            <p className="text-xs text-[#777777]">
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
          <div className="bg-white rounded-2xl border border-[#DEDCD8] p-5 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 pb-3 border-b border-[#DEDCD8]">
              <div className="w-7 h-7 rounded-lg bg-[#F2F0ED] text-[#FF7547] flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-[#202020] uppercase tracking-wider">
                Route Addresses
              </h3>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F2F0ED] border border-[#DEDCD8] text-xs">
              <span className="font-semibold text-[#202020] block mb-1">
                Pickup Address (Sender)
              </span>
              <p className="text-[#202020] font-medium">{shipment.pickupAddress?.addressLine}</p>
              <p className="text-[#777777] mt-0.5">
                {shipment.pickupAddress?.city}, {shipment.pickupAddress?.state} - {shipment.pickupAddress?.postalCode}
              </p>
              <p className="text-[11px] text-[#A7A7A7] font-mono mt-1">
                GPS: {shipment.pickupAddress?.latitude}, {shipment.pickupAddress?.longitude}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F2F0ED] border border-[#DEDCD8] text-xs">
              <span className="font-semibold text-[#FF7547] block mb-1">
                Delivery Destination (Recipient)
              </span>
              <p className="text-[#202020] font-medium">{shipment.deliveryAddress?.addressLine}</p>
              <p className="text-[#777777] mt-0.5">
                {shipment.deliveryAddress?.city}, {shipment.deliveryAddress?.state} - {shipment.deliveryAddress?.postalCode}
              </p>
              <p className="text-[11px] text-[#A7A7A7] font-mono mt-1">
                GPS: {shipment.deliveryAddress?.latitude}, {shipment.deliveryAddress?.longitude}
              </p>
            </div>
          </div>

          {/* Customer & Package Details */}
          <div className="space-y-5">
            {/* Customer Details */}
            <div className="bg-white rounded-2xl border border-[#DEDCD8] p-5 shadow-xs">
              <div className="flex items-center gap-2 pb-3 border-b border-[#DEDCD8] mb-3.5">
                <div className="w-7 h-7 rounded-lg bg-[#171717] text-[#FF7547] flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-[#202020] uppercase tracking-wider">
                  Customer Contact
                </h3>
              </div>

              {customer ? (
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#DEDCD8]">
                    <span className="text-[#777777]">Customer Name:</span>
                    <span className="font-semibold text-[#202020]">{customer.name}</span>
                  </div>
                  {customer.phone && (
                    <div className="flex justify-between py-1 border-b border-[#DEDCD8]">
                      <span className="text-[#777777]">Phone:</span>
                      <a
                        href={`tel:${customer.phone}`}
                        className="font-semibold text-[#202020] hover:text-[#FF7547] transition flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3 text-[#FF7547]" />
                        <span>{customer.phone}</span>
                      </a>
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex justify-between py-1">
                      <span className="text-[#777777]">Email:</span>
                      <span className="font-semibold text-[#202020] break-all">{customer.email}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#777777] italic">Customer record unavailable.</p>
              )}
            </div>

            {/* Package Details */}
            <div className="bg-white rounded-2xl border border-[#DEDCD8] p-5 shadow-xs">
              <div className="flex items-center gap-2 pb-3 border-b border-[#DEDCD8] mb-3.5">
                <div className="w-7 h-7 rounded-lg bg-[#171717] text-[#FF7547] flex items-center justify-center">
                  <Box className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-[#202020] uppercase tracking-wider">
                  Package Specification
                </h3>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-[#DEDCD8]">
                  <span className="text-[#777777]">Description:</span>
                  <span className="font-semibold text-[#202020]">
                    {shipment.packageDetails?.description || 'Standard Parcel'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#DEDCD8]">
                  <span className="text-[#777777]">Weight:</span>
                  <span className="font-semibold text-[#202020]">
                    {shipment.packageDetails?.weight} kg
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#777777]">Last Updated:</span>
                  <span className="font-semibold text-[#202020]">
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
