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
  Shield,
  Layers,
  Calendar,
  Phone,
  Mail,
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
    fetchShipmentDetails(false);
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
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12">
          <LoadingSpinner message="Retrieving shipment details..." />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !shipment) {
    return (
      <DashboardLayout title="Admin Shipment View">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-10 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-[#DC5353] flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-[#182433] mb-1">
            Shipment Not Found
          </h2>
          <p className="text-xs text-[#718096] mb-5">{error || 'This record does not exist or has been removed.'}</p>
          <Link
            to="/admin/shipments"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#142B45] hover:bg-[#245B78] rounded-xl transition shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
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
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Deep Ocean Header Bar */}
        <div className="bg-[#0B1F33] text-white rounded-[22px] border border-[#176B87]/40 p-5 sm:p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <Link
              to="/admin/shipments"
              className="p-2.5 rounded-xl border border-[#176B87]/60 bg-[#123B5D] text-white hover:bg-[#176B87] transition shadow-2xs shrink-0"
              aria-label="Back to shipments list"
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
                <span>Created: {formatDate(shipment.createdAt)}</span>
              </p>
            </div>
          </div>

          {/* Quick Admin Actions */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            {['Pending', 'Assigned'].includes(shipment.status) && (
              <button
                onClick={() => setAssignModalOpen(true)}
                className={`px-3.5 py-2 rounded-[11px] text-xs font-semibold shadow-xs transition cursor-pointer ${
                  courier
                    ? 'text-[#543F8C] bg-[#F1EFFA] hover:bg-[#DFDAF4] border border-[#DFDAF4]'
                    : 'text-white bg-[#00A6A6] hover:bg-[#008F95]'
                }`}
              >
                {courier ? 'Reassign Courier' : 'Assign Courier'}
              </button>
            )}

            {!['Delivered', 'Cancelled'].includes(shipment.status) && (
              <button
                onClick={() => setStatusModalOpen(true)}
                className="px-3.5 py-2 rounded-[11px] bg-[#FFF4E8] hover:bg-[#FCE3C8] text-[#D99024] text-xs font-semibold border border-[#FCE3C8] transition cursor-pointer shadow-2xs"
              >
                Override Status
              </button>
            )}
          </div>
        </div>

        {/* Timeline */}
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
          <div className="bg-white rounded-2xl border border-[#DCE5EF] p-6 shadow-2xs text-center">
            <p className="text-xs text-[#64748B]">
              {shipment.status === 'Pending'
                ? 'Shipment is pending courier assignment. Live tracking will activate once a driver accepts dispatch.'
                : shipment.status === 'Delivered'
                ? `Delivery completed at ${formatDate(shipment.deliveredAt)}. Live tracking telemetry has concluded.`
                : 'Live tracking is not active for this shipment status.'}
            </p>
          </div>
        )}

        {/* Proof of Delivery Card (Visible when Delivered) */}
        {shipment.status === 'Delivered' && (
          <ProofOfDeliveryCard shipment={shipment} />
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Customer & Courier Cards */}
          <div className="space-y-5">
            {/* Customer Information Card */}
            <div className="bg-white rounded-2xl border border-[#DCE5EF] p-5 shadow-2xs">
              <div className="flex items-center gap-2 pb-3 border-b border-[#DCE5EF] mb-3.5">
                <div className="w-7 h-7 rounded-lg bg-[#EAF2FA] text-[#245B78] flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-[#142B45] uppercase tracking-wider">
                  Customer (Sender)
                </h3>
              </div>

              {customer ? (
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#DCE5EF]">
                    <span className="text-[#64748B]">Name:</span>
                    <span className="font-semibold text-[#142B45]">{customer.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#DCE5EF]">
                    <span className="text-[#64748B]">Email:</span>
                    <span className="font-semibold text-[#142B45] break-all">{customer.email}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#64748B]">Phone:</span>
                    <span className="font-semibold text-[#142B45]">{customer.phone}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#64748B] italic">Customer record unavailable.</p>
              )}
            </div>

            {/* Courier Information Card */}
            <div className="bg-[#F1EFFA]/50 rounded-2xl border border-[#DFDAF4] p-5 shadow-2xs">
              <div className="flex items-center gap-2 pb-3 border-b border-[#DFDAF4] mb-3.5">
                <div className="w-7 h-7 rounded-lg bg-[#52438F] text-white flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-[#52438F] uppercase tracking-wider">
                  Assigned Courier
                </h3>
              </div>

              {courier ? (
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#DFDAF4]/60">
                    <span className="text-[#64748B]">Courier Name:</span>
                    <span className="font-semibold text-[#142B45]">{courier.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#DFDAF4]/60">
                    <span className="text-[#64748B]">Email:</span>
                    <span className="font-semibold text-[#142B45] break-all">{courier.email}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#64748B]">Phone:</span>
                    <span className="font-semibold text-[#142B45]">{courier.phone}</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-[#64748B] italic">
                  No courier assigned yet.
                </div>
              )}
            </div>
          </div>

          {/* Addresses and Package Info */}
          <div className="space-y-5">
            {/* Addresses */}
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
                  Pickup (Origin)
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
                  Delivery (Destination)
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

            {/* Package Spec */}
            <div className="bg-white rounded-2xl border border-[#DCE5EF] p-5 shadow-2xs">
              <div className="flex items-center gap-2 pb-3 border-b border-[#DCE5EF] mb-3.5">
                <div className="w-7 h-7 rounded-lg bg-[#F1EFFA] text-[#52438F] flex items-center justify-center">
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
                    {shipment.packageDetails?.description || 'Standard Consignment'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#DCE5EF]">
                  <span className="text-[#64748B]">Weight:</span>
                  <span className="font-semibold text-[#142B45]">
                    {shipment.packageDetails?.weight} kg
                  </span>
                </div>
                {roadRoute && (
                  <div className="flex justify-between py-1 border-b border-[#DCE5EF]">
                    <span className="text-[#64748B]">Driving Route:</span>
                    <span className="font-semibold text-[#142B45]">
                      {roadRoute.distanceKm} km (~{roadRoute.durationMinutes} min)
                    </span>
                  </div>
                )}
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

      {/* Modals */}
      {shipment && (
        <>
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
        </>
      )}
    </DashboardLayout>
  );
};

export default AdminShipmentDetails;
