import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ErrorMessage from '../../components/common/ErrorMessage';
import AddressSearchInput from '../../components/booking/AddressSearchInput';
import LocationPickerMap from '../../components/booking/LocationPickerMap';
import { reverseGeocode } from '../../services/geocodingService';
import { getDrivingRoute } from '../../services/routingService';
import api from '../../services/api';
import {
  MapPin,
  Box,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  PackageCheck,
  RotateCcw,
  Route,
  Clock,
  Edit2,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Pickup' },
  { id: 2, title: 'Drop-off' },
  { id: 3, title: 'Package' },
  { id: 4, title: 'Review' },
];

export const CreateShipment = () => {
  const navigate = useNavigate();

  // Wizard state: 1: Pickup, 2: Drop, 3: Package, 4: Review
  const [currentStep, setCurrentStep] = useState(1);

  // Locations state
  const [pickup, setPickup] = useState({
    latitude: null,
    longitude: null,
    addressLine: '',
    city: '',
    state: '',
    postalCode: '',
    confirmed: false,
  });

  const [delivery, setDelivery] = useState({
    latitude: null,
    longitude: null,
    addressLine: '',
    city: '',
    state: '',
    postalCode: '',
    confirmed: false,
  });

  // Package details
  const [packageDetails, setPackageDetails] = useState({
    description: '',
    weight: '',
  });

  // Route preview state
  const [routeData, setRouteData] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState(null);

  // Reverse geocoding loading state
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [createdShipment, setCreatedShipment] = useState(null);

  // Address editing modal / expansion toggles
  const [isEditingPickupAddress, setIsEditingPickupAddress] = useState(false);
  const [isEditingDeliveryAddress, setIsEditingDeliveryAddress] = useState(false);

  // Abort controller ref for reverse geocoding
  const reverseAbortRef = useRef(null);

  // 1. Handle Selection from Search Autocomplete
  const handleSelectPickupSearch = (item) => {
    setPickup({
      latitude: item.latitude,
      longitude: item.longitude,
      addressLine: item.addressLine || item.displayName || '',
      city: item.city || '',
      state: item.state || '',
      postalCode: item.postalCode || '',
      confirmed: false,
    });
    setFormError('');
  };

  const handleSelectDeliverySearch = (item) => {
    setDelivery({
      latitude: item.latitude,
      longitude: item.longitude,
      addressLine: item.addressLine || item.displayName || '',
      city: item.city || '',
      state: item.state || '',
      postalCode: item.postalCode || '',
      confirmed: false,
    });
    setFormError('');
  };

  // 2. Handle Map Pin Move / Click / Drag
  const handleMapPickupChange = useCallback(async ({ latitude, longitude }) => {
    if (reverseAbortRef.current) reverseAbortRef.current.abort();
    reverseAbortRef.current = new AbortController();

    setPickup((prev) => ({
      ...prev,
      latitude,
      longitude,
      confirmed: false,
    }));
    setIsGeocoding(true);

    try {
      const resolved = await reverseGeocode(latitude, longitude, reverseAbortRef.current.signal);
      if (resolved) {
        setPickup((prev) => ({
          ...prev,
          latitude,
          longitude,
          addressLine: resolved.addressLine || prev.addressLine || 'Pinned Location',
          city: resolved.city || prev.city,
          state: resolved.state || prev.state,
          postalCode: resolved.postalCode || prev.postalCode,
          confirmed: false,
        }));
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Reverse geocode error:', err.message);
      }
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  const handleMapDeliveryChange = useCallback(async ({ latitude, longitude }) => {
    if (reverseAbortRef.current) reverseAbortRef.current.abort();
    reverseAbortRef.current = new AbortController();

    setDelivery((prev) => ({
      ...prev,
      latitude,
      longitude,
      confirmed: false,
    }));
    setIsGeocoding(true);

    try {
      const resolved = await reverseGeocode(latitude, longitude, reverseAbortRef.current.signal);
      if (resolved) {
        setDelivery((prev) => ({
          ...prev,
          latitude,
          longitude,
          addressLine: resolved.addressLine || prev.addressLine || 'Pinned Location',
          city: resolved.city || prev.city,
          state: resolved.state || prev.state,
          postalCode: resolved.postalCode || prev.postalCode,
          confirmed: false,
        }));
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Reverse geocode error:', err.message);
      }
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // 3. Confirm Step Handlers
  const handleConfirmPickup = () => {
    if (!pickup.latitude || !pickup.longitude) {
      setFormError('Please select a pickup location on the map or search by address.');
      return;
    }
    if (!pickup.addressLine?.trim()) {
      setFormError('Please provide a street or landmark name for the pickup location.');
      setIsEditingPickupAddress(true);
      return;
    }
    if (!pickup.city?.trim() || !pickup.state?.trim()) {
      setFormError('Please ensure city and state are provided for the pickup address.');
      setIsEditingPickupAddress(true);
      return;
    }

    setPickup((prev) => ({ ...prev, confirmed: true }));
    setFormError('');
    setCurrentStep(2);
  };

  const handleConfirmDelivery = () => {
    if (!delivery.latitude || !delivery.longitude) {
      setFormError('Please select a drop-off location on the map or search by address.');
      return;
    }
    if (!delivery.addressLine?.trim()) {
      setFormError('Please provide a street or landmark name for the delivery location.');
      setIsEditingDeliveryAddress(true);
      return;
    }
    if (!delivery.city?.trim() || !delivery.state?.trim()) {
      setFormError('Please ensure city and state are provided for the delivery address.');
      setIsEditingDeliveryAddress(true);
      return;
    }

    setDelivery((prev) => ({ ...prev, confirmed: true }));
    setFormError('');
    setCurrentStep(3);
  };

  const handleContinueToReview = () => {
    if (!packageDetails.description?.trim()) {
      setFormError('Please enter a package description.');
      return;
    }
    const weightNum = parseFloat(packageDetails.weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      setFormError('Please enter a valid weight in kg (greater than 0).');
      return;
    }

    setFormError('');
    setCurrentStep(4);
  };

  // 4. Fetch Driving Route Preview when both locations are confirmed
  const fetchRoutePreview = useCallback(async () => {
    if (
      !pickup.latitude ||
      !pickup.longitude ||
      !delivery.latitude ||
      !delivery.longitude
    ) {
      return;
    }

    setIsLoadingRoute(true);
    setRouteError(null);

    try {
      const route = await getDrivingRoute(
        { latitude: pickup.latitude, longitude: pickup.longitude },
        { latitude: delivery.latitude, longitude: delivery.longitude }
      );
      setRouteData(route);
    } catch (err) {
      console.warn('[RoutingPreview] Road route calculation failed:', err.message);
      setRouteError(
        'Road route preview is temporarily unavailable. You can still proceed with booking.'
      );
      setRouteData(null);
    } finally {
      setIsLoadingRoute(false);
    }
  }, [pickup.latitude, pickup.longitude, delivery.latitude, delivery.longitude]);

  // Recalculate route when entering Review step or when coordinates change
  useEffect(() => {
    if (currentStep === 4 && pickup.confirmed && delivery.confirmed) {
      fetchRoutePreview();
    }
  }, [currentStep, pickup.confirmed, delivery.confirmed, fetchRoutePreview]);

  // 5. Fill Sample Data Helper for Demo & Easy Evaluation
  const fillSampleData = () => {
    setPickup({
      latitude: 12.9784,
      longitude: 77.6408,
      addressLine: 'Chinmaya Mission Hospital Rd, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560038',
      confirmed: true,
    });
    setDelivery({
      latitude: 12.9756,
      longitude: 77.6066,
      addressLine: 'MG Road, Near Trinity Metro',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      confirmed: true,
    });
    setPackageDetails({
      description: 'Urgent Legal Contracts & Documents',
      weight: '1.5',
    });
    setFormError('');
    setCurrentStep(4);
  };

  // 6. Submit Shipment Creation
  const handleCreateShipment = async () => {
    setFormError('');

    if (!pickup.confirmed || !pickup.latitude || !pickup.longitude) {
      setFormError('Pickup location must be confirmed before submitting.');
      setCurrentStep(1);
      return;
    }

    if (!delivery.confirmed || !delivery.latitude || !delivery.longitude) {
      setFormError('Drop-off location must be confirmed before submitting.');
      setCurrentStep(2);
      return;
    }

    const weightNum = parseFloat(packageDetails.weight);
    if (!packageDetails.description || isNaN(weightNum) || weightNum <= 0) {
      setFormError('Please verify package description and positive weight.');
      setCurrentStep(3);
      return;
    }

    const payload = {
      pickupAddress: {
        addressLine: pickup.addressLine.trim(),
        city: pickup.city.trim() || 'Bengaluru',
        state: pickup.state.trim() || 'Karnataka',
        postalCode: pickup.postalCode.trim() || '560001',
        latitude: Number(pickup.latitude),
        longitude: Number(pickup.longitude),
      },
      deliveryAddress: {
        addressLine: delivery.addressLine.trim(),
        city: delivery.city.trim() || 'Bengaluru',
        state: delivery.state.trim() || 'Karnataka',
        postalCode: delivery.postalCode.trim() || '560001',
        latitude: Number(delivery.latitude),
        longitude: Number(delivery.longitude),
      },
      packageDetails: {
        description: packageDetails.description.trim(),
        weight: weightNum,
      },
    };

    setSubmitting(true);

    try {
      const response = await api.post('/shipments', payload);
      if (response.data && response.data.success) {
        setCreatedShipment(response.data.data.shipment);
      } else {
        setFormError(response.data?.message || 'Failed to create shipment.');
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Unable to create shipment. Please verify address fields and try again.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS SCREEN
  if (createdShipment) {
    return (
      <DashboardLayout title="Shipment Booked">
        <div className="max-w-xl mx-auto py-8">
          <div className="bg-white rounded-2xl border border-[#DCE5EF] p-6 sm:p-8 shadow-2xs text-center">
            <div className="w-14 h-14 rounded-full bg-[#E7F5F2] text-[#16875D] flex items-center justify-center mx-auto mb-4 border border-[#CCEAE3]">
              <PackageCheck className="w-7 h-7" />
            </div>

            <h1 className="text-xl font-bold text-[#142B45] tracking-tight">
              Shipment Booked Successfully!
            </h1>
            <p className="text-xs text-[#64748B] mt-1">
              Your pickup has been registered and is pending courier dispatch assignment.
            </p>

            <div className="my-6 p-4 rounded-xl bg-[#EAF2FA] border border-[#CFE1F4]">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#245B78] block mb-1">
                Generated Tracking ID
              </span>
              <span className="text-2xl font-mono font-bold text-[#142B45] tracking-wider">
                {createdShipment.trackingId}
              </span>
            </div>

            {/* Summary Details */}
            <div className="text-left text-xs space-y-3 mb-6 p-4 rounded-xl border border-[#DCE5EF] bg-white">
              <div className="flex items-start gap-2.5 pb-2.5 border-b border-[#DCE5EF]">
                <div className="w-5 h-5 rounded-full bg-[#EAF2FA] text-[#245B78] border border-[#CFE1F4] flex items-center justify-center mt-0.5 shrink-0 font-bold text-[10px]">
                  P
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#64748B] block">
                    Pickup Location
                  </span>
                  <span className="font-semibold text-[#142B45]">
                    {createdShipment.pickupAddress?.addressLine},{' '}
                    {createdShipment.pickupAddress?.city}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pb-2.5 border-b border-[#DCE5EF]">
                <div className="w-5 h-5 rounded-full bg-[#EAF5F8] text-[#126965] border border-[#CFEAEF] flex items-center justify-center mt-0.5 shrink-0 font-bold text-[10px]">
                  D
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#64748B] block">
                    Drop-off Location
                  </span>
                  <span className="font-semibold text-[#142B45]">
                    {createdShipment.deliveryAddress?.addressLine},{' '}
                    {createdShipment.deliveryAddress?.city}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-[#64748B]">Package & Weight:</span>
                <span className="font-semibold text-[#142B45]">
                  {createdShipment.packageDetails?.description} (
                  {createdShipment.packageDetails?.weight} kg)
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to={`/customer/shipments/${createdShipment.trackingId}`}
                className="w-full sm:w-auto px-6 py-2.5 rounded-[11px] bg-[#00A6A6] hover:bg-[#008F95] text-white font-bold text-xs transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Track Live Delivery</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/customer"
                className="w-full sm:w-auto px-6 py-2.5 rounded-[11px] bg-white hover:bg-[#F0F3F7] text-[#142B45] font-semibold text-xs border border-[#D5DEE7] transition text-center shadow-2xs"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Create Shipment">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with Sample Fill Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#142B45] tracking-tight">
              Create New Shipment
            </h1>
            <p className="text-xs sm:text-sm text-[#718096] mt-0.5">
              Select pickup and delivery addresses on the map with automatic road routing.
            </p>
          </div>

          <button
            type="button"
            onClick={fillSampleData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[11px] bg-[#E8EEF4] hover:bg-[#DCE5EC] text-[#123B5D] text-xs font-bold border border-[#D5DEE7] transition cursor-pointer self-start sm:self-auto shadow-2xs"
            title="Auto-fill sample Bangalore locations for quick testing"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00A6A6]" />
            <span>Fill Demo Locations</span>
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-4 gap-2">
          {STEPS.map((s) => {
            const isCompleted = s.id < currentStep;
            const isCurrent = s.id === currentStep;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  if (s.id < currentStep) setCurrentStep(s.id);
                }}
                disabled={s.id > currentStep}
                className={`py-2.5 px-3 rounded-xl border text-left transition flex items-center gap-2 ${
                  isCurrent
                    ? 'border-[#0B1F33] bg-[#0B1F33] text-white shadow-xs'
                    : isCompleted
                    ? 'border-[#CCEAE3] bg-[#E7F5F2] text-[#167A56] cursor-pointer hover:bg-[#CCEAE3]/60'
                    : 'border-[#D5DEE7] bg-[#E8EEF4] text-[#8A9BAA] cursor-not-allowed'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                    isCurrent
                      ? 'bg-[#00A6A6] text-white'
                      : isCompleted
                      ? 'bg-[#167A56] text-white'
                      : 'bg-[#D5DEE7] text-[#8A9BAA]'
                  }`}
                >
                  {isCompleted ? <Check className="w-3 h-3" /> : s.id}
                </div>
                <span className="text-xs font-semibold truncate hidden sm:inline">
                  {s.title}
                </span>
              </button>
            );
          })}
        </div>

        {formError && <ErrorMessage message={formError} />}

        {/* ==================================================== */}
        {/* STEP 1: PICKUP LOCATION */}
        {/* ==================================================== */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-[#CFE1F4] p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#CFE1F4]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#EAF2FA] text-[#245B78] border border-[#CFE1F4] flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h2 className="text-sm font-bold text-[#142B45]">Select Pickup Location</h2>
                </div>
                {pickup.confirmed && (
                  <span className="inline-flex items-center gap-1 text-xs text-[#16875D] font-semibold bg-[#E7F5F2] border border-[#CCEAE3] px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Confirmed
                  </span>
                )}
              </div>

              {/* Address Search Bar */}
              <AddressSearchInput
                type="pickup"
                placeholder="Search pickup address, area or landmark"
                onSelectLocation={handleSelectPickupSearch}
                showCurrentLocationButton={true}
              />

              {/* Interactive Map */}
              <div className="pt-1">
                <LocationPickerMap
                  pickup={pickup}
                  delivery={delivery.latitude ? delivery : null}
                  onPickupChange={handleMapPickupChange}
                  activeMode="pickup"
                  isGeocoding={isGeocoding}
                  height="340px"
                />
              </div>

              {/* Resolved Address Details Card */}
              {pickup.latitude ? (
                <div className="p-4 rounded-xl bg-[#EAF2FA]/50 border border-[#CFE1F4] space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#245B78] text-white flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#245B78] block">
                          Selected Pickup Address
                        </span>
                        <p className="text-sm font-bold text-[#142B45] mt-0.5">
                          {pickup.addressLine || 'Pinned Location'}
                        </p>
                        <p className="text-xs text-[#64748B]">
                          {[pickup.city, pickup.state, pickup.postalCode]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsEditingPickupAddress(!isEditingPickupAddress)}
                      className="text-xs text-[#245B78] font-semibold hover:underline flex items-center gap-1 shrink-0"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{isEditingPickupAddress ? 'Done' : 'Edit Fields'}</span>
                    </button>
                  </div>

                  {/* Optional address field manual correction accordion */}
                  {isEditingPickupAddress && (
                    <div className="pt-3 border-t border-[#CFE1F4] grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="sm:col-span-3">
                        <label className="block font-semibold text-[#182433] mb-1">
                          Address Line / Street *
                        </label>
                        <input
                          type="text"
                          value={pickup.addressLine}
                          onChange={(e) =>
                            setPickup((p) => ({ ...p, addressLine: e.target.value }))
                          }
                          className="w-full h-9 px-3 rounded-md border border-[#CFE1F4] text-xs bg-white text-[#182433] focus:outline-none focus:border-[#18A6A0]"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#182433] mb-1">City *</label>
                        <input
                          type="text"
                          value={pickup.city}
                          onChange={(e) => setPickup((p) => ({ ...p, city: e.target.value }))}
                          className="w-full h-9 px-3 rounded-md border border-[#CFE1F4] text-xs bg-white text-[#182433] focus:outline-none focus:border-[#18A6A0]"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#182433] mb-1">State *</label>
                        <input
                          type="text"
                          value={pickup.state}
                          onChange={(e) => setPickup((p) => ({ ...p, state: e.target.value }))}
                          className="w-full h-9 px-3 rounded-md border border-[#CFE1F4] text-xs bg-white text-[#182433] focus:outline-none focus:border-[#18A6A0]"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#182433] mb-1">Postal Code</label>
                        <input
                          type="text"
                          value={pickup.postalCode}
                          onChange={(e) =>
                            setPickup((p) => ({ ...p, postalCode: e.target.value }))
                          }
                          className="w-full h-9 px-3 rounded-md border border-[#CFE1F4] text-xs bg-white text-[#182433] focus:outline-none focus:border-[#18A6A0]"
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleConfirmPickup}
                      className="px-5 py-2.5 rounded-[11px] bg-[#00A6A6] hover:bg-[#008F95] text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirm Pickup Location</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-[#CFE1F4] rounded-xl text-xs text-[#64748B]">
                  Search for an address above or click anywhere on the map to place the pickup pin.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 2: DROP LOCATION */}
        {/* ==================================================== */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-[#CFEAEF] p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#CFEAEF]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#EAF5F8] text-[#126965] border border-[#CFEAEF] flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <h2 className="text-sm font-bold text-[#142B45]">Select Drop-off Destination</h2>
                </div>
                {delivery.confirmed && (
                  <span className="inline-flex items-center gap-1 text-xs text-[#16875D] font-semibold bg-[#E7F5F2] border border-[#CCEAE3] px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Confirmed
                  </span>
                )}
              </div>

              {/* Address Search Bar */}
              <AddressSearchInput
                type="delivery"
                placeholder="Search delivery address, area or landmark"
                onSelectLocation={handleSelectDeliverySearch}
                showCurrentLocationButton={false}
              />

              {/* Interactive Map (Shows confirmed pickup pin + active drop pin) */}
              <div className="pt-1">
                <LocationPickerMap
                  pickup={pickup}
                  delivery={delivery}
                  onPickupChange={handleMapPickupChange}
                  onDeliveryChange={handleMapDeliveryChange}
                  activeMode="delivery"
                  isGeocoding={isGeocoding}
                  height="340px"
                />
              </div>

              {/* Resolved Drop Address Details Card */}
              {delivery.latitude ? (
                <div className="p-4 rounded-xl bg-[#EAF5F8]/50 border border-[#CFEAEF] space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#18A6A0] text-white flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#126965] block">
                          Selected Drop-off Address
                        </span>
                        <p className="text-sm font-bold text-[#142B45] mt-0.5">
                          {delivery.addressLine || 'Pinned Location'}
                        </p>
                        <p className="text-xs text-[#64748B]">
                          {[delivery.city, delivery.state, delivery.postalCode]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsEditingDeliveryAddress(!isEditingDeliveryAddress)}
                      className="text-xs text-[#126965] font-semibold hover:underline flex items-center gap-1 shrink-0"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{isEditingDeliveryAddress ? 'Done' : 'Edit Fields'}</span>
                    </button>
                  </div>

                  {/* Optional address field manual correction accordion */}
                  {isEditingDeliveryAddress && (
                    <div className="pt-3 border-t border-[#CFEAEF] grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="sm:col-span-3">
                        <label className="block font-semibold text-[#182433] mb-1">
                          Address Line / Street *
                        </label>
                        <input
                          type="text"
                          value={delivery.addressLine}
                          onChange={(e) =>
                            setDelivery((d) => ({ ...d, addressLine: e.target.value }))
                          }
                          className="w-full h-9 px-3 rounded-md border border-[#CFEAEF] text-xs bg-white text-[#182433] focus:outline-none focus:border-[#18A6A0]"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#182433] mb-1">City *</label>
                        <input
                          type="text"
                          value={delivery.city}
                          onChange={(e) => setDelivery((d) => ({ ...d, city: e.target.value }))}
                          className="w-full h-9 px-3 rounded-md border border-[#CFEAEF] text-xs bg-white text-[#182433] focus:outline-none focus:border-[#18A6A0]"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#182433] mb-1">State *</label>
                        <input
                          type="text"
                          value={delivery.state}
                          onChange={(e) => setDelivery((d) => ({ ...d, state: e.target.value }))}
                          className="w-full h-9 px-3 rounded-md border border-[#CFEAEF] text-xs bg-white text-[#182433] focus:outline-none focus:border-[#18A6A0]"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#182433] mb-1">Postal Code</label>
                        <input
                          type="text"
                          value={delivery.postalCode}
                          onChange={(e) =>
                            setDelivery((d) => ({ ...d, postalCode: e.target.value }))
                          }
                          className="w-full h-9 px-3 rounded-md border border-[#CFEAEF] text-xs bg-white text-[#182433] focus:outline-none focus:border-[#18A6A0]"
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-4 py-2 rounded-lg text-xs font-semibold text-[#64748B] hover:text-[#142B45] transition flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Pickup</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleConfirmDelivery}
                      className="px-5 py-2.5 rounded-[11px] bg-[#00A6A6] hover:bg-[#008F95] text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirm Drop Location</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-[#CFEAEF] rounded-xl text-xs text-[#64748B]">
                  Search for destination address above or click on the map to place the drop-off pin.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 3: PACKAGE DETAILS */}
        {/* ==================================================== */}
        {currentStep === 3 && (
          <div className="bg-white rounded-2xl border border-[#DFDAF4] p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#DFDAF4]">
              <div className="w-6 h-6 rounded-full bg-[#F1EFFA] text-[#52438F] border border-[#DFDAF4] flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h2 className="text-sm font-bold text-[#142B45]">Package Information</h2>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#182433] mb-1">
                  Package Description *
                </label>
                <input
                  type="text"
                  value={packageDetails.description}
                  onChange={(e) =>
                    setPackageDetails((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="e.g. Legal documents, Laptop accessories, Clothing"
                  className="w-full h-10 px-3 rounded-xl border border-[#DFDAF4] text-sm text-[#182433] focus:outline-none focus:border-[#18A6A0] focus:ring-1 focus:ring-[#18A6A0]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#182433] mb-1">
                  Weight (in Kilograms) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={packageDetails.weight}
                  onChange={(e) =>
                    setPackageDetails((p) => ({ ...p, weight: e.target.value }))
                  }
                  placeholder="e.g. 1.5"
                  className="w-full h-10 px-3 rounded-xl border border-[#DFDAF4] text-sm text-[#182433] focus:outline-none focus:border-[#18A6A0] focus:ring-1 focus:ring-[#18A6A0]"
                  required
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-[#DFDAF4]">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-[#64748B] hover:text-[#142B45] transition flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Drop Location</span>
              </button>

              <button
                type="button"
                onClick={handleContinueToReview}
                className="px-5 py-2.5 rounded-[11px] bg-[#00A6A6] hover:bg-[#008F95] text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Review Shipment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 4: REVIEW & CREATE */}
        {/* ==================================================== */}
        {currentStep === 4 && (
          <div className="space-y-5">
            {/* Map Preview with OSRM Road Route */}
            <div className="bg-white rounded-2xl border border-[#DCE5EF] p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#DCE5EF]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#E7F5F2] text-[#16875D] border border-[#CCEAE3] flex items-center justify-center font-bold text-xs">
                    4
                  </div>
                  <h2 className="text-sm font-bold text-[#142B45]">
                    Review Delivery Route & Details
                  </h2>
                </div>

                {/* Route statistics badge */}
                {isLoadingRoute ? (
                  <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Calculating road route...</span>
                  </div>
                ) : routeData ? (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EAF5F8] text-[#126965] font-semibold border border-[#CFEAEF]">
                      <Route className="w-3.5 h-3.5" />
                      {routeData.distanceKm} km
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FFF4E8] text-[#9A5D12] font-semibold border border-[#FCE3C8]">
                      <Clock className="w-3.5 h-3.5 text-[#D99024]" />
                      ~{routeData.durationMinutes} mins drive
                    </span>
                  </div>
                ) : null}
              </div>

              {routeError && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-[#D99024] shrink-0" />
                    <span>{routeError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={fetchRoutePreview}
                    className="font-semibold underline hover:text-amber-900 ml-2 cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Map displaying both pins and road route */}
              <LocationPickerMap
                pickup={pickup}
                delivery={delivery}
                routeCoordinates={routeData?.coordinates}
                activeMode="review"
                height="320px"
              />

              {/* Review Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {/* Pickup summary */}
                <div className="p-4 rounded-xl border border-[#CFE1F4] bg-[#EAF2FA]/60 relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#245B78] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#245B78]"></span>
                      Origin (Pickup)
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-xs text-[#245B78] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                  <p className="text-xs font-bold text-[#142B45]">{pickup.addressLine}</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    {[pickup.city, pickup.state, pickup.postalCode].filter(Boolean).join(', ')}
                  </p>
                </div>

                {/* Drop-off summary */}
                <div className="p-4 rounded-xl border border-[#CFEAEF] bg-[#EAF5F8]/60 relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#126965] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#18A6A0]"></span>
                      Destination (Drop-off)
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="text-xs text-[#126965] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                  <p className="text-xs font-bold text-[#142B45]">{delivery.addressLine}</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    {[delivery.city, delivery.state, delivery.postalCode].filter(Boolean).join(', ')}
                  </p>
                </div>

                {/* Package summary */}
                <div className="sm:col-span-2 p-4 rounded-xl border border-[#DFDAF4] bg-[#F1EFFA]/60 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#52438F] block mb-0.5">
                      Package Specification
                    </span>
                    <p className="text-xs font-bold text-[#142B45]">
                      {packageDetails.description}{' '}
                      <span className="text-[#64748B] font-normal">
                        ({packageDetails.weight} kg)
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="text-xs text-[#52438F] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex items-center justify-between border-t border-[#DCE5EF]">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#142B45] transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Package</span>
                </button>

                <button
                  type="button"
                  onClick={handleCreateShipment}
                  disabled={submitting}
                  className="px-6 py-3 rounded-[11px] bg-[#00A6A6] hover:bg-[#008F95] text-white font-bold text-xs transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Shipment...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm & Create Shipment</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CreateShipment;
