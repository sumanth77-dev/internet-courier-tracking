import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatusBadge from '../../components/common/StatusBadge';
import ShipmentTimeline from '../../components/shipment/ShipmentTimeline';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AssignCourierModal from '../../components/shipment/AssignCourierModal';
import UpdateStatusModal from '../../components/shipment/UpdateStatusModal';
import LiveTrackingMap from '../../components/tracking/LiveTrackingMap';
import { ProofOfDeliveryCard } from '../../components/delivery/ProofOfDeliveryCard';
import useTrackingSocket from '../../hooks/useTrackingSocket';
import { getDrivingRoute } from '../../services/routingService';
import api from '../../services/api';
import {
  ArrowLeft,
  MapPin,
  Box,
  User,
  Truck,
  AlertCircle,
  Route,
} from 'lucide-react';

const TRACKABLE_STATUSES = ['Assigned', 'Picked Up', 'In Transit', 'Out for Delivery'];
const STATUS_SYNC_INTERVAL_MS = 4000;

const AdminShipmentDetails = () => {
  const { id } = useParams();
  const [shipment, setShipment] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roadRoute, setRoadRoute] = useState(null);

  // Modals state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  // Live Socket.IO Tracking Hook for Admin - auto-joins with actual MongoDB _id once shipment loads
  const trackingSocket = useTrackingSocket({
    shipmentId: shipment?._id || null,
    role: 'admin',
    autoJoin: shipment ? TRACKABLE_STATUSES.includes(shipment.status) : false,
  });

  const fetchShipmentDetails = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await api.get(`/shipments/admin/${id}`);
      if (res.data?.success && res.data.data?.shipment) {
        setShipment(res.data.data.shipment);
        setError('');
      } else if (isInitial) {
        setError(res.data?.message || 'Shipment not found');
      }
    } catch (err) {
      if (isInitial) {
        setError(
          err.response?.data?.message || 'Unable to retrieve admin shipment details'
        );
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchShipmentDetails(true);
  }, [fetchShipmentDetails]);

  // Fetch latest saved location from backend separately from live updates
  useEffect(() => {
    let isMounted = true;
    if (!shipment?._id || !TRACKABLE_STATUSES.includes(shipment.status)) return;

    const fetchInitialLocation = async () => {
      try {
        const res = await api.get(`/shipments/${shipment._id}/location`);
        if (isMounted && res.data?.success && res.data.data?.location) {
          const loc = res.data.data.location;
          const locObj = {
            shipmentId: loc.shipmentId,
            trackingId: loc.trackingId,
            latitude: Number(loc.latitude),
            longitude: Number(loc.longitude),
            accuracy: loc.accuracy !== null ? Number(loc.accuracy) : null,
            timestamp: new Date(loc.timestamp),
          };
          setCurrentLocation((prev) => {
            if (prev?.timestamp && new Date(prev.timestamp).getTime() > new Date(loc.timestamp).getTime()) {
              return prev;
            }
            return locObj;
          });
        }
      } catch (err) {
        console.warn('[AdminTracking] Could not fetch latest location:', err.message);
      }
    };

    fetchInitialLocation();

    return () => {
      isMounted = false;
    };
  }, [shipment?._id, shipment?.status]);

  // Merge live socket location updates into currentLocation
  useEffect(() => {
    if (trackingSocket.liveLocation) {
      setCurrentLocation(trackingSocket.liveLocation);
    }
  }, [trackingSocket.liveLocation]);

  // Update shipment status immediately when live status broadcast arrives
  useEffect(() => {
    if (trackingSocket.liveStatusUpdate) {
      const update = trackingSocket.liveStatusUpdate;
      setShipment((prev) => {
        if (!prev) return prev;
        if (
          update.shipmentId &&
          update.shipmentId.toString() !== prev._id?.toString() &&
          update.trackingId !== prev.trackingId
        ) {
          return prev;
        }
        return {
          ...prev,
          status: update.status || prev.status,
          pickedUpAt: update.pickedUpAt || prev.pickedUpAt,
          deliveredAt: update.deliveredAt || prev.deliveredAt,
          updatedAt: update.updatedAt || prev.updatedAt,
        };
      });
    }
  }, [trackingSocket.liveStatusUpdate]);

  // On socket reconnect, re-fetch shipment to avoid stale state
  const prevConnStatusRef = useRef(trackingSocket.connectionStatus);
  useEffect(() => {
    if (prevConnStatusRef.current === 'reconnecting' && trackingSocket.connectionStatus === 'connected') {
      fetchShipmentDetails(false);
    }
    prevConnStatusRef.current = trackingSocket.connectionStatus;
  }, [trackingSocket.connectionStatus, fetchShipmentDetails]);

  // Background active status sync fallback for admin view
  useEffect(() => {
    if (!shipment || !TRACKABLE_STATUSES.includes(shipment.status)) {
      return;
    }

    const interval = setInterval(() => {
      fetchShipmentDetails(false);
    }, STATUS_SYNC_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [shipment?.status, fetchShipmentDetails]);

  // Fetch OSRM Road Route
  useEffect(() => {
    let isMounted = true;

    const fetchRoute = async () => {
      if (
        shipment?.pickupAddress?.latitude &&
        shipment?.deliveryAddress?.latitude
      ) {
        try {
          const route = await getDrivingRoute(
            shipment.pickupAddress,
            shipment.deliveryAddress
          );
          if (isMounted) {
            setRoadRoute(route);
          }
        } catch (err) {
          console.warn('Admin road route fetching warning:', err.message);
        }
      }
    };

    fetchRoute();

    return () => {
      isMounted = false;
    };
  }, [shipment?.pickupAddress, shipment?.deliveryAddress]);

  const handleShipmentUpdated = (updated) => {
    setShipment(updated);
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
      <DashboardLayout title="Admin Shipment View">
        <div className="bg-white rounded-xl border border-[#D9DEE5] p-12">
          <LoadingSpinner message={`Retrieving shipment details...`} />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !shipment) {
    return (
      <DashboardLayout title="Admin Shipment View">
        <div className="bg-white rounded-xl border border-[#D9DEE5] p-10 text-center max-w-md mx-auto">
          <div className="w-10 h-10 rounded-full bg-red-50 text-[#B91C1C] flex items-center justify-center mx-auto mb-2.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-[#172033] mb-1">
            Shipment Not Found
          </h2>
          <p className="text-xs text-[#667085] mb-5">{error || 'Record does not exist.'}</p>
          <Link
            to="/admin/shipments"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#172033] hover:bg-[#0F172A] rounded-lg transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Shipments</span>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const customer = shipment.customerId;
  const courier = shipment.courierId;
  const isTrackable = TRACKABLE_STATUSES.includes(shipment.status);

  return (
    <DashboardLayout title={`Admin View — ${shipment.trackingId}`}>
      <div className="space-y-5 max-w-5xl mx-auto">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D9DEE5]">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/shipments"
              className="p-1.5 rounded-lg border border-[#D9DEE5] text-[#667085] hover:text-[#172033] hover:bg-white transition"
              aria-label="Back to shipments list"
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
                Created: {formatDate(shipment.createdAt)}
              </p>
            </div>
          </div>

          {/* Quick Admin Actions */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {['Pending', 'Assigned'].includes(shipment.status) && (
              <button
                onClick={() => setAssignModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-[#172033] hover:bg-[#0F172A] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                {courier ? 'Reassign Courier' : 'Assign Courier'}
              </button>
            )}

            {!['Delivered', 'Cancelled'].includes(shipment.status) && (
              <button
                onClick={() => setStatusModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-[#D97706] text-xs font-semibold border border-amber-200 transition cursor-pointer"
              >
                Override Status
              </button>
            )}
          </div>
        </div>

        {/* Timeline */}
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

        {/* Admin Live Tracking Section */}
        {isTrackable ? (
          <LiveTrackingMap
            liveLocation={currentLocation || trackingSocket.liveLocation}
            pickupAddress={shipment.pickupAddress}
            deliveryAddress={shipment.deliveryAddress}
            fullRoute={roadRoute?.coordinates || []}
            routeDistanceKm={roadRoute?.distanceKm}
            routeDurationMinutes={roadRoute?.durationMinutes}
            connectionStatus={trackingSocket.connectionStatus}
            trackingId={shipment.trackingId}
            courierName={courier?.name}
            height="480px"
          />
        ) : (
          <div className="bg-white rounded-xl border border-[#D9DEE5] p-5 shadow-xs text-center">
            <p className="text-xs text-[#667085]">
              {shipment.status === 'Pending'
                ? 'Shipment is pending assignment. Live tracking will become active once courier is assigned.'
                : shipment.status === 'Delivered'
                ? `Delivery completed at ${formatDate(shipment.deliveredAt)}. Live tracking telemetry has ended.`
                : 'Live tracking is not active for this shipment status.'}
            </p>
          </div>
        )}

        {/* Proof of Delivery Card (Visible when Delivered) */}
        {shipment.status === 'Delivered' && (
          <ProofOfDeliveryCard shipment={shipment} />
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer & Courier Cards */}
          <div className="space-y-4">
            {/* Customer Information Card */}
            <div className="bg-white rounded-xl border border-[#D9DEE5] p-5 shadow-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-[#D9DEE5]/60 mb-3">
                <User className="w-4 h-4 text-[#172033]" />
                <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                  Customer Information
                </h3>
              </div>

              {customer ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#D9DEE5]/60">
                    <span className="text-[#667085]">Name:</span>
                    <span className="font-semibold text-[#172033]">{customer.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#D9DEE5]/60">
                    <span className="text-[#667085]">Email:</span>
                    <span className="font-semibold text-[#172033]">{customer.email}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#667085]">Phone:</span>
                    <span className="font-semibold text-[#172033]">{customer.phone}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#667085] italic">Customer record unavailable.</p>
              )}
            </div>

            {/* Courier Information Card */}
            <div className="bg-white rounded-xl border border-[#D9DEE5] p-5 shadow-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-[#D9DEE5]/60 mb-3">
                <Truck className="w-4 h-4 text-[#172033]" />
                <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                  Assigned Courier
                </h3>
              </div>

              {courier ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#D9DEE5]/60">
                    <span className="text-[#667085]">Courier Name:</span>
                    <span className="font-semibold text-[#172033]">{courier.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#D9DEE5]/60">
                    <span className="text-[#667085]">Email:</span>
                    <span className="font-semibold text-[#172033]">{courier.email}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#667085]">Phone:</span>
                    <span className="font-semibold text-[#172033]">{courier.phone}</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-[#667085] italic">
                  No courier assigned yet.
                </div>
              )}
            </div>
          </div>

          {/* Addresses and Package Info */}
          <div className="space-y-4">
            {/* Addresses */}
            <div className="bg-white rounded-xl border border-[#D9DEE5] p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#D9DEE5]/60">
                <MapPin className="w-4 h-4 text-[#172033]" />
                <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                  Route Addresses
                </h3>
              </div>

              <div className="p-3 rounded-lg bg-[#F4F6F8] border border-[#D9DEE5] text-xs">
                <span className="font-semibold text-[#172033] block mb-1">
                  Pickup (Origin)
                </span>
                <p className="text-[#263449]">{shipment.pickupAddress?.addressLine}</p>
                <p className="text-[#667085] mt-0.5">
                  {shipment.pickupAddress?.city}, {shipment.pickupAddress?.state} - {shipment.pickupAddress?.postalCode}
                </p>
                <p className="text-[11px] text-[#667085] font-mono mt-1">
                  GPS: {shipment.pickupAddress?.latitude}, {shipment.pickupAddress?.longitude}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#F4F6F8] border border-[#D9DEE5] text-xs">
                <span className="font-semibold text-[#D97706] block mb-1">
                  Delivery (Destination)
                </span>
                <p className="text-[#263449]">{shipment.deliveryAddress?.addressLine}</p>
                <p className="text-[#667085] mt-0.5">
                  {shipment.deliveryAddress?.city}, {shipment.deliveryAddress?.state} - {shipment.deliveryAddress?.postalCode}
                </p>
                <p className="text-[11px] text-[#667085] font-mono mt-1">
                  GPS: {shipment.deliveryAddress?.latitude}, {shipment.deliveryAddress?.longitude}
                </p>
              </div>
            </div>

            {/* Package Spec */}
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
                {roadRoute && (
                  <div className="flex justify-between py-1 border-b border-[#D9DEE5]/60">
                    <span className="text-[#667085]">Driving Route:</span>
                    <span className="font-semibold text-[#172033]">
                      {roadRoute.distanceKm} km (~{roadRoute.durationMinutes} min)
                    </span>
                  </div>
                )}
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

      {/* Modals */}
      <AssignCourierModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        shipment={shipment}
        onSuccess={handleShipmentUpdated}
      />

      <UpdateStatusModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        shipment={shipment}
        onSuccess={handleShipmentUpdated}
        role="admin"
      />
    </DashboardLayout>
  );
};

export default AdminShipmentDetails;
