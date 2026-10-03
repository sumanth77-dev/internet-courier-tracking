import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ErrorMessage from '../../components/common/ErrorMessage';
import api from '../../services/api';
import {
  MapPin,
  Box,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  PackageCheck,
} from 'lucide-react';

const CreateShipment = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    pickupAddress: {
      addressLine: '',
      city: '',
      state: '',
      postalCode: '',
      latitude: '',
      longitude: '',
    },
    deliveryAddress: {
      addressLine: '',
      city: '',
      state: '',
      postalCode: '',
      latitude: '',
      longitude: '',
    },
    packageDetails: {
      description: '',
      weight: '',
    },
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdShipment, setCreatedShipment] = useState(null);

  const handleAddressChange = (type, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  };

  const handlePackageChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      packageDetails: {
        ...prev.packageDetails,
        [field]: value,
      },
    }));
  };

  // Helper to fill sample coordinates for easy testing
  const fillSampleData = () => {
    setFormData({
      pickupAddress: {
        addressLine: 'RGUKT RK Valley Campus',
        city: 'Kadapa',
        state: 'Andhra Pradesh',
        postalCode: '516330',
        latitude: '14.3312',
        longitude: '78.5521',
      },
      deliveryAddress: {
        addressLine: 'Main Bazar Road, Near Clock Tower',
        city: 'Tirupati',
        state: 'Andhra Pradesh',
        postalCode: '517501',
        latitude: '13.6288',
        longitude: '79.4192',
      },
      packageDetails: {
        description: 'Electronic Components & Textbooks',
        weight: '2.5',
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { pickupAddress, deliveryAddress, packageDetails } = formData;

    // Validation
    if (
      !pickupAddress.addressLine ||
      !pickupAddress.city ||
      !pickupAddress.state ||
      !pickupAddress.postalCode ||
      !pickupAddress.latitude ||
      !pickupAddress.longitude
    ) {
      setError('Please complete all required fields for the Pickup Address');
      return;
    }

    if (
      !deliveryAddress.addressLine ||
      !deliveryAddress.city ||
      !deliveryAddress.state ||
      !deliveryAddress.postalCode ||
      !deliveryAddress.latitude ||
      !deliveryAddress.longitude
    ) {
      setError('Please complete all required fields for the Delivery Address');
      return;
    }

    if (!packageDetails.description || !packageDetails.weight) {
      setError('Please provide a package description and weight in kg');
      return;
    }

    const parsedWeight = parseFloat(packageDetails.weight);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      setError('Weight must be a positive number');
      return;
    }

    const payload = {
      pickupAddress: {
        addressLine: pickupAddress.addressLine.trim(),
        city: pickupAddress.city.trim(),
        state: pickupAddress.state.trim(),
        postalCode: pickupAddress.postalCode.trim(),
        latitude: parseFloat(pickupAddress.latitude),
        longitude: parseFloat(pickupAddress.longitude),
      },
      deliveryAddress: {
        addressLine: deliveryAddress.addressLine.trim(),
        city: deliveryAddress.city.trim(),
        state: deliveryAddress.state.trim(),
        postalCode: deliveryAddress.postalCode.trim(),
        latitude: parseFloat(deliveryAddress.latitude),
        longitude: parseFloat(deliveryAddress.longitude),
      },
      packageDetails: {
        description: packageDetails.description.trim(),
        weight: parsedWeight,
      },
    };

    setSubmitting(true);

    try {
      const response = await api.post('/shipments', payload);

      if (response.data && response.data.success) {
        setCreatedShipment(response.data.data.shipment);
      } else {
        setError(response.data?.message || 'Failed to create shipment');
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Unable to create shipment. Please verify all address details and try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS SCREEN
  if (createdShipment) {
    return (
      <DashboardLayout title="Shipment Created">
        <div className="max-w-xl mx-auto py-6">
          <div className="bg-white rounded-xl border border-[#D9DEE5] p-6 sm:p-8 shadow-xs text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#15803D] flex items-center justify-center mx-auto mb-3">
              <PackageCheck className="w-6 h-6" />
            </div>

            <h1 className="text-xl font-bold text-[#172033] tracking-tight">
              Shipment Created Successfully
            </h1>
            <p className="text-xs text-[#667085] mt-1">
              Your parcel request has been logged and is awaiting dispatch assignment.
            </p>

            <div className="my-5 p-4 rounded-lg bg-[#F4F6F8] border border-[#D9DEE5]">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#667085] block mb-1">
                Generated Tracking ID
              </span>
              <span className="text-xl font-mono font-bold text-[#172033]">
                {createdShipment.trackingId}
              </span>
            </div>

            {/* Summary Preview */}
            <div className="text-left text-xs space-y-2 mb-6 p-4 rounded-lg border border-[#D9DEE5] bg-white">
              <div className="flex justify-between border-b border-[#D9DEE5]/60 pb-2">
                <span className="text-[#667085]">Origin:</span>
                <span className="font-semibold text-[#172033]">
                  {createdShipment.pickupAddress?.city}, {createdShipment.pickupAddress?.state}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#D9DEE5]/60 pb-2">
                <span className="text-[#667085]">Destination:</span>
                <span className="font-semibold text-[#172033]">
                  {createdShipment.deliveryAddress?.city}, {createdShipment.deliveryAddress?.state}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Package & Weight:</span>
                <span className="font-semibold text-[#172033]">
                  {createdShipment.packageDetails?.description} ({createdShipment.packageDetails?.weight} kg)
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to={`/customer/shipments/${createdShipment.trackingId}`}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#172033] hover:bg-[#0F172A] text-white font-semibold text-xs transition shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>View Shipment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/customer"
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-white hover:bg-[#F4F6F8] text-[#172033] font-semibold text-xs border border-[#D9DEE5] transition"
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
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Header with Sample Fill Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D9DEE5]">
          <div>
            <h1 className="text-xl font-bold text-[#172033] tracking-tight">
              Create New Shipment
            </h1>
            <p className="text-xs text-[#667085] mt-0.5">
              Enter origin, destination coordinates, and package details.
            </p>
          </div>

          <button
            type="button"
            onClick={fillSampleData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#F4F6F8] hover:bg-[#E2E8F0] text-[#172033] text-xs font-semibold border border-[#D9DEE5] transition cursor-pointer self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Fill Sample Data</span>
          </button>
        </div>

        {error && <ErrorMessage message={error} />}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* SECTION 1: PICKUP ADDRESS */}
          <div className="bg-white rounded-xl border border-[#D9DEE5] p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#D9DEE5]/60">
              <MapPin className="w-4 h-4 text-[#172033]" />
              <h2 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                1. Pickup Address (Origin)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-[#172033] mb-1">
                  Street / Address Line *
                </label>
                <input
                  type="text"
                  value={formData.pickupAddress.addressLine}
                  onChange={(e) => handleAddressChange('pickupAddress', 'addressLine', e.target.value)}
                  placeholder="e.g. RGUKT RK Valley, Academic Block"
                  required
                  className="w-full h-10 px-3 rounded-lg border border-[#D9DEE5] text-sm text-[#172033] focus:outline-none focus:border-[#172033] focus:ring-1 focus:ring-[#172033]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172033] mb-1">City *</label>
                <input
                  type="text"
                  value={formData.pickupAddress.city}
                  onChange={(e) => handleAddressChange('pickupAddress', 'city', e.target.value)}
                  placeholder="e.g. Kadapa"
                  required
                  className="w-full h-10 px-3 rounded-lg border border-[#D9DEE5] text-sm text-[#172033] focus:outline-none focus:border-[#172033] focus:ring-1 focus:ring-[#172033]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172033] mb-1">State *</label>
                <input
                  type="text"
                  value={formData.pickupAddress.state}
                  onChange={(e) => handleAddressChange('pickupAddress', 'state', e.target.value)}
                  placeholder="e.g. Andhra Pradesh"
                  required
                  className="w-full h-10 px-3 rounded-lg border border-[#D9DEE5] text-sm text-[#172033] focus:outline-none focus:border-[#172033] focus:ring-1 focus:ring-[#172033]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172033] mb-1">Postal Code (PIN) *</label>
                <input
                  type="text"
                  value={formData.pickupAddress.postalCode}
                  onChange={(e) => handleAddressChange('pickupAddress', 'postalCode', e.target.value)}
                  placeholder="516330"
                  required
                  className="w-full h-10 px-3 rounded-lg border border-[#D9DEE5] text-sm text-[#172033] focus:outline-none focus:border-[#172033] focus:ring-1 focus:ring-[#172033]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[#172033] mb-1">Latitude *</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.pickupAddress.latitude}
                    onChange={(e) => handleAddressChange('pickupAddress', 'latitude', e.target.value)}
                    placeholder="14.3312"
                    required
                    className="w-full h-10 px-3 rounded-lg border border-[#D9DEE5] text-sm text-[#172033] focus:outline-none focus:border-[#172033] focus:ring-1 focus:ring-[#172033]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#172033] mb-1">Longitude *</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.pickupAddress.longitude}
                    onChange={(e) => handleAddressChange('pickupAddress', 'longitude', e.target.value)}
                    placeholder="78.5521"
                    required
                    className="w-full h-10 px-3 rounded-lg border border-[#D9DEE5] text-sm text-[#172033] focus:outline-none focus:border-[#172033] focus:ring-1 focus:ring-[#172033]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: DELIVERY ADDRESS */}
          <div className="bg-white rounded-xl border border-[#D9DEE5] p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#D9DEE5]/60">
              <MapPin className="w-4 h-4 text-[#D97706]" />
              <h2 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                2. Delivery Destination
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-[#172033] mb-1">
                  Street / Address Line *
                </label>
                <input
                  type="text"
                  value={formData.deliveryAddress.addressLine}
                  onChange={(e) => handleAddressChange('deliveryAddress', 'addressLine', e.target.value)}
                  placeholder="e.g. Main Bazar Road, Near Clock Tower"
                  required
                  className="w-full h-10 px-3 rounded-lg border border-[#D9DEE5] text-sm text-[#172033] focus:outline-none focus:border-[#172033] focus:ring-1 focus:ring-[#172033]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172033] mb-1">City *</label>
                <input
                  type="text"
                  value={formData.deliveryAddress.city}
                  onChange={(e) => handleAddressChange('deliveryAddress', 'city', e.target.value)}
                  placeholder="e.g. Tirupati"
                  required
                  className="w-full h-10 px-3 rounded-lg border border-[#D9DEE5] text-sm text-[#172033] focus:outline-none focus:border-[#172033] focus:ring-1 focus:ring-[#172033]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172033] mb-1">State *</label>
                <input
                  type="text"
                  value={formData.deliveryAddress.state}
                  onChange={(e) => handleAddressChange('deliveryAddress', 'state', e.target.value)}
                  placeholder="e.g. Andhra Pradesh"
                  required
                  className="w-full h-10 px-3 rounded-lg border border-[#D9DEE5] text-sm text-[#172033] focus:outline-none focus:border-[#172033] focus:ring-1 focus:ring-[#172033]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172033] mb-1">Postal Code (PIN) *</label>
                <input
                  type="text"
                  value={formData.deliveryAddress.postalCode}
                  onChange={(e) => handleAddressChange('deliveryAddress', 'postalCode', e.target.value)}
                  placeholder="517501"
                  required
                  className="w-full h-10 px-3 rounded-lg border border-[#D9DEE5] text-sm text-[#172033] focus:outline-none focus:border-[#172033] focus:ring-1 focus:ring-[#172033]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[#172033] mb-1">Latitude *</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.deliveryAddress.latitude}
                    onChange={(e) => handleAddressChange('deliveryAddress', 'latitude', e.target.value)}
                    placeholder="13.6288"
                    required
                    className="w-full h-10 px-3 rounded-lg border border-[#D9DEE5] text-sm text-[#172033] focus:outline-none focus:border-[#172033] focus:ring-1 focus:ring-[#172033]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#172033] mb-1">Longitude *</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.deliveryAddress.longitude}
                    onChange={(e) => handleAddressChange('deliveryAddress', 'longitude', e.target.value)}
                    placeholder="79.4192"
                    required
                    className="w-full h-10 px-3 rounded-lg border border-[#D9DEE5] text-sm text-[#172033] focus:outline-none focus:border-[#172033] focus:ring-1 focus:ring-[#172033]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: PACKAGE DETAILS */}
          <div className="bg-white rounded-xl border border-[#D9DEE5] p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#D9DEE5]/60">
              <Box className="w-4 h-4 text-[#172033]" />
              <h2 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                3. Package Details
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-[#172033] mb-1">
                  Package Description *
                </label>
                <input
                  type="text"
                  value={formData.packageDetails.description}
                  onChange={(e) => handlePackageChange('description', e.target.value)}
                  placeholder="e.g. Fragile Glassware / Confidential Documents"
                  required
                  className="w-full h-10 px-3 rounded-lg border border-[#D9DEE5] text-sm text-[#172033] focus:outline-none focus:border-[#172033] focus:ring-1 focus:ring-[#172033]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172033] mb-1">
                  Weight (in Kilograms) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.packageDetails.weight}
                  onChange={(e) => handlePackageChange('weight', e.target.value)}
                  placeholder="e.g. 2.5"
                  required
                  className="w-full h-10 px-3 rounded-lg border border-[#D9DEE5] text-sm text-[#172033] focus:outline-none focus:border-[#172033] focus:ring-1 focus:ring-[#172033]"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: REVIEW & SUBMIT */}
          <div className="bg-[#F4F6F8] rounded-xl border border-[#D9DEE5] p-5">
            <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider mb-2">
              4. Review Summary Before Dispatch
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#263449]">
              <div>
                <span className="text-[#667085] block">Origin:</span>
                <span className="font-semibold text-[#172033]">
                  {formData.pickupAddress.city
                    ? `${formData.pickupAddress.addressLine || '—'}, ${formData.pickupAddress.city}, ${formData.pickupAddress.state}`
                    : 'Not entered yet'}
                </span>
              </div>
              <div>
                <span className="text-[#667085] block">Destination:</span>
                <span className="font-semibold text-[#172033]">
                  {formData.deliveryAddress.city
                    ? `${formData.deliveryAddress.addressLine || '—'}, ${formData.deliveryAddress.city}, ${formData.deliveryAddress.state}`
                    : 'Not entered yet'}
                </span>
              </div>
              <div>
                <span className="text-[#667085] block">Package:</span>
                <span className="font-semibold text-[#172033]">
                  {formData.packageDetails.description || 'Not entered yet'}
                </span>
              </div>
              <div>
                <span className="text-[#667085] block">Declared Weight:</span>
                <span className="font-semibold text-[#172033]">
                  {formData.packageDetails.weight ? `${formData.packageDetails.weight} kg` : 'Not entered yet'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <Link
              to="/customer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-[#667085] hover:text-[#172033] hover:bg-white border border-transparent hover:border-[#D9DEE5] transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-lg bg-[#172033] hover:bg-[#0F172A] active:scale-[0.99] text-white font-semibold text-xs sm:text-sm shadow-xs transition duration-150 flex items-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Shipment...</span>
                </>
              ) : (
                <>
                  <span>Create Shipment</span>
                  <ArrowRight className="w-4 h-4 text-[#D97706]" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateShipment;
