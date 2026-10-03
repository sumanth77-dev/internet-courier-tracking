import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatusBadge from '../../components/common/StatusBadge';
import ShipmentTimeline from '../../components/shipment/ShipmentTimeline';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import api from '../../services/api';
import {
  ArrowLeft,
  MapPin,
  Box,
  User,
  Calendar,
  Compass,
  Phone,
  Mail,
  AlertCircle,
  Radio,
} from 'lucide-react';

const ShipmentDetails = () => {
  const { trackingId } = useParams();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchShipmentDetails();
  }, [trackingId]);

  const fetchShipmentDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/shipments/${trackingId}`);
      if (res.data?.success && res.data.data?.shipment) {
        setShipment(res.data.data.shipment);
      } else {
        setError(res.data?.message || 'Shipment not found');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to retrieve shipment details'
      );
    } finally {
      setLoading(false);
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
      <DashboardLayout title="Shipment Details">
        <div className="bg-white rounded-xl border border-[#D9DEE5] p-12">
          <LoadingSpinner message={`Retrieving shipment ${trackingId}...`} />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !shipment) {
    return (
      <DashboardLayout title="Shipment Details">
        <div className="bg-white rounded-xl border border-[#D9DEE5] p-10 text-center max-w-md mx-auto">
          <div className="w-10 h-10 rounded-full bg-red-50 text-[#B91C1C] flex items-center justify-center mx-auto mb-2.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-[#172033] mb-1">
            Shipment Not Found
          </h2>
          <p className="text-xs text-[#667085] mb-5">{error || 'Shipment not found.'}</p>
          <Link
            to="/customer/shipments"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#172033] hover:bg-[#0F172A] rounded-lg transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Shipments</span>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const courier = shipment.courierId || shipment.courier;

  return (
    <DashboardLayout title={`Shipment ${shipment.trackingId}`}>
      <div className="space-y-5 max-w-5xl mx-auto">
        {/* Navigation Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D9DEE5]">
          <div className="flex items-center gap-3">
            <Link
              to="/customer/shipments"
              className="p-1.5 rounded-lg border border-[#D9DEE5] text-[#667085] hover:text-[#172033] hover:bg-white transition"
              aria-label="Back to shipments"
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
        </div>

        {/* Shipment Progress Timeline Card */}
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

        {/* Live Tracking Map Placeholder Section */}
        <div className="bg-white rounded-xl border border-[#D9DEE5] p-6 shadow-xs text-center">
          <div className="w-10 h-10 rounded-lg bg-[#172033]/5 text-[#172033] flex items-center justify-center mx-auto mb-2">
            <Compass className="w-5 h-5 text-[#D97706]" />
          </div>
          <h3 className="text-sm font-bold text-[#172033] mb-1">
            Live Tracking
          </h3>
          <p className="text-xs text-[#667085] max-w-md mx-auto">
            Live location tracking will appear here when the shipment is in transit.
          </p>
        </div>

        {/* Two-Column Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pickup and Delivery Addresses */}
          <div className="bg-white rounded-xl border border-[#D9DEE5] p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#D9DEE5]/60">
              <MapPin className="w-4 h-4 text-[#172033]" />
              <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                Route Addresses
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-[#F4F6F8] border border-[#D9DEE5]">
                <span className="font-semibold text-[#172033] block mb-1">
                  Pickup Address (Origin)
                </span>
                <p className="text-[#263449]">{shipment.pickupAddress?.addressLine}</p>
                <p className="text-[#667085] mt-0.5">
                  {shipment.pickupAddress?.city}, {shipment.pickupAddress?.state} - {shipment.pickupAddress?.postalCode}
                </p>
                <p className="text-[11px] text-[#667085] font-mono mt-1">
                  GPS: {shipment.pickupAddress?.latitude}, {shipment.pickupAddress?.longitude}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#F4F6F8] border border-[#D9DEE5]">
                <span className="font-semibold text-[#D97706] block mb-1">
                  Delivery Address (Destination)
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
          </div>

          {/* Package Details & Courier Info */}
          <div className="space-y-4">
            {/* Package Spec Card */}
            <div className="bg-white rounded-xl border border-[#D9DEE5] p-5 shadow-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-[#D9DEE5]/60 mb-3">
                <Box className="w-4 h-4 text-[#172033]" />
                <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                  Package Details
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
                  <span className="text-[#667085]">Declared Weight:</span>
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

            {/* Assigned Courier Card */}
            <div className="bg-white rounded-xl border border-[#D9DEE5] p-5 shadow-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-[#D9DEE5]/60 mb-3">
                <User className="w-4 h-4 text-[#172033]" />
                <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                  Assigned Courier
                </h3>
              </div>

              {courier ? (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-[#172033]">
                    <span>{courier.name}</span>
                  </div>
                  {courier.phone && (
                    <div className="flex items-center gap-2 text-[#667085]">
                      <Phone className="w-3.5 h-3.5 text-[#172033]" />
                      <span>{courier.phone}</span>
                    </div>
                  )}
                  {courier.email && (
                    <div className="flex items-center gap-2 text-[#667085]">
                      <Mail className="w-3.5 h-3.5 text-[#172033]" />
                      <span>{courier.email}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#667085] italic">
                  A courier has not been assigned to this delivery yet. The dispatch center will assign a driver soon.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ShipmentDetails;
