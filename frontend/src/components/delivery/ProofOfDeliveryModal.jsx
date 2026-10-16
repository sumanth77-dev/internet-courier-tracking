import { useState, useRef } from 'react';
import api from '../../services/api';
import {
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  ShieldCheck,
  User,
  Users,
  Image as ImageIcon,
  KeyRound,
  Trash2,
} from 'lucide-react';

const RECIPIENT_TYPES = [
  { value: 'Customer', label: 'Customer (Package Owner)' },
  { value: 'Family Member', label: 'Family Member' },
  { value: 'Authorized Recipient', label: 'Authorized Recipient' },
  { value: 'Neighbor', label: 'Neighbor' },
  { value: 'Other', label: 'Other' },
];

export const ProofOfDeliveryModal = ({
  isOpen,
  onClose,
  shipment,
  onDeliveryComplete,
}) => {
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [otp, setOtp] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientType, setRecipientType] = useState('Customer');
  const [confirmation, setConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef(null);

  if (!isOpen || !shipment) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validations
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Photo exceeds 5 MB limit. Please choose a smaller photo.');
      return;
    }

    setError('');
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!photoFile) {
      setError('A package delivery photo is required.');
      return;
    }

    const cleanOtp = otp.trim();
    if (!cleanOtp || !/^\d{6}$/.test(cleanOtp)) {
      setError('Please enter a valid 6-digit numeric OTP provided by the customer.');
      return;
    }

    if (!confirmation) {
      setError('Please check the confirmation box verifying that the package was handed over.');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('photo', photoFile);
      formData.append('otp', cleanOtp);
      formData.append('confirmation', 'true');
      if (recipientName.trim()) {
        formData.append('recipientName', recipientName.trim());
      }
      formData.append('recipientType', recipientType);

      const targetId = shipment._id || shipment.id || shipment.trackingId;
      const res = await api.post(`/shipments/courier/${targetId}/proof-of-delivery`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data?.success) {
        setSuccess(true);
        if (onDeliveryComplete) {
          onDeliveryComplete(res.data.data?.shipment, res.data.data?.proof);
        }
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(res.data?.message || 'Failed to verify Proof of Delivery.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to verify Proof of Delivery. Please check the OTP and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-[#D9DEE5] shadow-2xl max-w-lg w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-[#172033] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#D97706]/20 text-[#D97706]">
              <ShieldCheck className="w-5 h-5 text-[#D97706]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Complete Delivery (POD)</h2>
              <p className="text-[11px] text-gray-300">
                Shipment <span className="font-mono font-bold text-amber-400">{shipment.trackingId}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        {success ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#172033]">Delivery Confirmed!</h3>
            <p className="text-xs text-[#667085]">
              Proof of Delivery and customer OTP have been verified by the backend. The shipment has been marked as{' '}
              <strong>Delivered</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Step 1: Package Photo Upload */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#172033] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>1. Package Delivery Photo</span>
                  <span className="text-red-500 font-bold">*</span>
                </span>
                <span className="text-[11px] text-[#667085] font-normal">Max 5 MB (JPEG, PNG, WebP)</span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
                id="pod-photo-input"
              />

              {photoPreview ? (
                <div className="relative rounded-xl border border-[#D9DEE5] overflow-hidden bg-gray-50">
                  <img
                    src={photoPreview}
                    alt="Delivery proof preview"
                    className="w-full h-44 object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between text-white text-xs">
                    <span className="text-[11px] font-medium truncate max-w-[200px]">
                      {photoFile?.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-[11px] font-semibold backdrop-blur-xs transition flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Retake</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="px-2 py-1 bg-red-600/80 hover:bg-red-600 rounded text-[11px] font-semibold transition flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="pod-photo-input"
                  className="border-2 border-dashed border-[#D9DEE5] hover:border-[#172033] bg-[#F4F6F8] hover:bg-gray-100/80 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition text-center group"
                >
                  <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-[#D9DEE5] flex items-center justify-center text-[#D97706] mb-2 group-hover:scale-105 transition">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-[#172033]">
                    Take photo or choose from device
                  </span>
                  <span className="text-[11px] text-[#667085] mt-0.5">
                    Capture the package placed at customer doorstep or handover point
                  </span>
                </label>
              )}
            </div>

            {/* Step 2: Customer 6-Digit OTP */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#172033] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>2. Customer Delivery OTP</span>
                  <span className="text-red-500 font-bold">*</span>
                </span>
                <span className="text-[11px] text-[#667085] font-normal">Provided by recipient</span>
              </label>

              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D9DEE5] bg-white font-mono text-center text-lg tracking-widest font-bold text-[#172033] focus:outline-hidden focus:border-[#172033] transition"
                  required
                />
              </div>
              <p className="text-[11px] text-[#667085]">
                Ask the recipient for the 6-digit OTP displayed on their Customer tracking page.
              </p>
            </div>

            {/* Step 3: Recipient Information (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Recipient Name (Optional)
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-[#667085] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-[#D9DEE5] focus:outline-hidden focus:border-[#172033]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Recipient Relationship
                </label>
                <div className="relative">
                  <Users className="w-3.5 h-3.5 text-[#667085] absolute left-3 top-2.5" />
                  <select
                    value={recipientType}
                    onChange={(e) => setRecipientType(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-[#D9DEE5] bg-white focus:outline-hidden focus:border-[#172033]"
                  >
                    {RECIPIENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Step 4: Handover Confirmation Checkbox */}
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmation}
                  onChange={(e) => setConfirmation(e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-[#172033] border-[#D9DEE5] rounded focus:ring-0 cursor-pointer"
                  required
                />
                <span className="text-xs text-[#263449] font-medium leading-relaxed">
                  I confirm that I handed over the package to the customer or an authorized recipient.
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#D9DEE5]/60">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-[#D9DEE5] hover:bg-gray-50 text-[#667085] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !photoFile || otp.length !== 6 || !confirmation}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying Delivery...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Submit Proof of Delivery</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProofOfDeliveryModal;
