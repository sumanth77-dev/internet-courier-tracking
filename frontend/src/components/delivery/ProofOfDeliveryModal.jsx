import { useState, useRef, useEffect } from 'react';
import api from '../../services/api';
import {
  compressDeliveryPhoto,
  formatFileSize,
} from '../../utils/imageCompressor';
import {
  Camera,
  FolderOpen,
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
  Sparkles,
  ArrowRight,
  Upload,
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
  // Image & Compression State
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionStats, setCompressionStats] = useState(null);

  // Delivery Form State
  const [otp, setOtp] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientType, setRecipientType] = useState('Customer');
  const [confirmation, setConfirmation] = useState(false);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Separate file input refs for Camera vs Gallery
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Clean up generated blob object URLs upon unmount or change
  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  if (!isOpen || !shipment) return null;

  /**
   * Handle image selection from either Camera or Gallery
   * Automatically invokes client-side compression
   */
  const handleImageSelection = async (file) => {
    if (!file) return;

    setError('');
    setIsCompressing(true);

    try {
      // Automatic client-side compression and optimization
      const result = await compressDeliveryPhoto(file);

      // Clean up previous blob URL
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }

      setPhotoFile(result.file);
      setPhotoPreview(result.previewUrl);
      setCompressionStats({
        originalName: file.name,
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        savingsPercent: result.savingsPercent,
        width: result.width,
        height: result.height,
        compressed: result.compressed,
      });
    } catch (err) {
      console.error('Image compression error:', err);
      setError(err.message || 'Unable to process the selected image. Please try another photo.');
    } finally {
      setIsCompressing(false);
      // Reset input values so selecting the same file again triggers onChange
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  /**
   * Remove current photo and return to selection buttons
   */
  const handleRemovePhoto = () => {
    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoFile(null);
    setPhotoPreview(null);
    setCompressionStats(null);
    setError('');
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  /**
   * Submit Proof of Delivery and verify recipient OTP
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || isCompressing) return;

    setError('');

    if (!photoFile) {
      setError('A package delivery photo is required to complete delivery.');
      return;
    }

    const cleanOtp = otp.trim();
    if (!cleanOtp || !/^\d{6}$/.test(cleanOtp)) {
      setError('Please enter a valid 6-digit numeric OTP provided by the recipient.');
      return;
    }

    if (!confirmation) {
      setError('Please confirm that you handed over the package to the recipient.');
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);

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
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
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
      console.error('Proof of delivery submission failed:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to verify Proof of Delivery. Please check the recipient OTP and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-[#0B1F33]/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-[#D5DEE7] shadow-2xl max-w-lg w-full overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header - Deep Ocean Midnight Navy */}
        <div className="px-5 sm:px-6 py-4 bg-[#0B1F33] text-white flex items-center justify-between border-b border-[#123B5D]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#123B5D] text-[#00A6A6]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Complete Delivery (POD)
              </h2>
              <p className="text-[11px] text-[#DCE5EC]/80">
                Shipment <span className="font-mono font-bold text-[#00A6A6]">{shipment.trackingId}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-[#DCE5EC]/70 hover:text-white hover:bg-white/10 transition cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hidden HTML File Inputs */}
        {/* Option A: Camera capture for mobile rear camera */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleImageSelection(e.target.files?.[0])}
          className="hidden"
          id="pod-camera-input"
        />

        {/* Option B: Standard file picker for phone gallery or desktop files */}
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          onChange={(e) => handleImageSelection(e.target.files?.[0])}
          className="hidden"
          id="pod-gallery-input"
        />

        {/* Form Body */}
        {success ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-[#167A56]/15 text-[#167A56] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#142B45]">Delivery Verified & Completed!</h3>
            <p className="text-xs text-[#607487] max-w-sm mx-auto leading-relaxed">
              Delivery photo and recipient OTP have been securely verified. Shipment is marked as{' '}
              <strong className="text-[#142B45]">Delivered</strong> in real-time.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-[#D64B4B] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Step 1: Package Photo Upload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#142B45] flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[#008F95]" />
                  <span>1. Package Handover Photo</span>
                  <span className="text-[#D64B4B] font-bold">*</span>
                </label>
                <span className="text-[11px] text-[#607487]">
                  Auto-compressed to &le; 1.5 MB
                </span>
              </div>

              {/* Compression in Progress Spinner */}
              {isCompressing && (
                <div className="p-5 rounded-xl border border-[#00A6A6]/40 bg-[#00A6A6]/5 text-center space-y-2 animate-pulse">
                  <RefreshCw className="w-6 h-6 text-[#008F95] animate-spin mx-auto" />
                  <p className="text-xs font-bold text-[#142B45]">Optimizing delivery photo...</p>
                  <p className="text-[11px] text-[#607487]">
                    Resizing & compressing for fast mobile upload while preserving clarity
                  </p>
                </div>
              )}

              {/* Case 1: Photo Preview with Optimization Stats */}
              {!isCompressing && photoPreview && (
                <div className="rounded-xl border border-[#D5DEE7] overflow-hidden bg-[#F0F3F7]">
                  <div className="relative aspect-16/9 bg-slate-900 flex items-center justify-center overflow-hidden">
                    <img
                      src={photoPreview}
                      alt="Delivery proof preview"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      {compressionStats?.compressed && (
                        <span className="px-2 py-0.5 rounded-full bg-[#167A56] text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>{compressionStats.savingsPercent}% Smaller</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Optimization Details Bar */}
                  <div className="p-3 bg-white border-t border-[#D5DEE7] space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <p className="font-semibold text-[#142B45] truncate max-w-[220px]">
                          {photoFile?.name}
                        </p>
                        <p className="text-[11px] text-[#607487] flex items-center gap-1.5 mt-0.5">
                          {compressionStats?.compressed ? (
                            <>
                              <span>Orig: {formatFileSize(compressionStats.originalSize)}</span>
                              <ArrowRight className="w-3 h-3 text-[#008F95]" />
                              <span className="font-bold text-[#167A56]">
                                {formatFileSize(compressionStats.compressedSize)}
                              </span>
                            </>
                          ) : (
                            <span className="font-medium text-[#167A56]">
                              Size: {formatFileSize(photoFile?.size)} (Ready)
                            </span>
                          )}
                          {compressionStats?.width && (
                            <span className="text-[#8A9BAA]">
                              &bull; {compressionStats.width}&times;{compressionStats.height}px
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Action buttons on active photo */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          title="Take another photo with camera"
                          className="px-2 py-1 rounded-md text-[11px] font-semibold text-[#123B5D] bg-[#E8EEF4] hover:bg-[#DCE5EC] transition flex items-center gap-1 cursor-pointer"
                        >
                          <Camera className="w-3 h-3 text-[#008F95]" />
                          <span className="hidden sm:inline">Camera</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => galleryInputRef.current?.click()}
                          title="Choose another photo from gallery"
                          className="px-2 py-1 rounded-md text-[11px] font-semibold text-[#123B5D] bg-[#E8EEF4] hover:bg-[#DCE5EC] transition flex items-center gap-1 cursor-pointer"
                        >
                          <FolderOpen className="w-3 h-3 text-[#176B87]" />
                          <span className="hidden sm:inline">Gallery</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          title="Remove photo"
                          className="px-2 py-1 rounded-md text-[11px] font-semibold text-[#D64B4B] bg-red-50 hover:bg-red-100 transition flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Case 2: Dual Selection Cards (Take Photo vs Choose from Gallery) */}
              {!isCompressing && !photoPreview && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Option A: Mobile Camera */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="p-4 rounded-xl border-2 border-dashed border-[#176B87]/40 hover:border-[#008F95] bg-[#E8EEF4]/60 hover:bg-[#E8EEF4] flex flex-col items-center justify-center text-center transition group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-[#D5DEE7] flex items-center justify-center text-[#008F95] mb-2 group-hover:scale-105 transition">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-[#142B45] group-hover:text-[#008F95] transition">
                      Take Photo
                    </span>
                    <span className="text-[11px] text-[#607487] mt-0.5">
                      Open mobile camera (rear)
                    </span>
                  </button>

                  {/* Option B: Device Gallery / Local Files */}
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="p-4 rounded-xl border-2 border-dashed border-[#D5DEE7] hover:border-[#176B87] bg-white hover:bg-[#F0F3F7] flex flex-col items-center justify-center text-center transition group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#F0F3F7] border border-[#D5DEE7] flex items-center justify-center text-[#176B87] mb-2 group-hover:scale-105 transition">
                      <FolderOpen className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-[#142B45] group-hover:text-[#176B87] transition">
                      Choose from Gallery
                    </span>
                    <span className="text-[11px] text-[#607487] mt-0.5">
                      Select photo or local file
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Customer 6-Digit OTP */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-[#142B45] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#008F95]" />
                  <span>2. Recipient Delivery OTP</span>
                  <span className="text-[#D64B4B] font-bold">*</span>
                </span>
                <span className="text-[11px] text-[#607487] font-normal">
                  Provided by recipient
                </span>
              </label>

              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="&bull; &bull; &bull; &bull; &bull; &bull;"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5DEE7] bg-white font-mono text-center text-lg tracking-widest font-bold text-[#142B45] placeholder-[#8A9BAA] focus:outline-hidden focus:border-[#008F95] focus:ring-2 focus:ring-[#008F95]/20 transition"
                  required
                />
              </div>
              <p className="text-[11px] text-[#607487]">
                Ask the recipient for the 6-digit OTP displayed on their SkyRoute tracking screen.
              </p>
            </div>

            {/* Step 3: Recipient Information (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-[#142B45] mb-1">
                  Recipient Name (Optional)
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-[#607487] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Sumanth Kumar"
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-[#D5DEE7] text-[#142B45] placeholder-[#8A9BAA] focus:outline-hidden focus:border-[#008F95]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#142B45] mb-1">
                  Recipient Relationship
                </label>
                <div className="relative">
                  <Users className="w-3.5 h-3.5 text-[#607487] absolute left-3 top-2.5" />
                  <select
                    value={recipientType}
                    onChange={(e) => setRecipientType(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-[#D5DEE7] bg-white text-[#142B45] focus:outline-hidden focus:border-[#008F95]"
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
            <div className="p-3 rounded-xl bg-[#E8EEF4] border border-[#D5DEE7]">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmation}
                  onChange={(e) => setConfirmation(e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-[#008F95] border-[#D5DEE7] rounded focus:ring-0 cursor-pointer"
                  required
                />
                <span className="text-xs text-[#142B45] font-medium leading-relaxed">
                  I confirm that I handed over the package to the customer or an authorized recipient.
                </span>
              </label>
            </div>

            {/* Upload Progress Bar (when active) */}
            {submitting && uploadProgress > 0 && uploadProgress < 100 && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-[#142B45]">
                  <span>Uploading Delivery Proof...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#D5DEE7] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#00A6A6] transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#D5DEE7]">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting || isCompressing}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-[#D5DEE7] hover:bg-[#F0F3F7] text-[#607487] transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  submitting ||
                  isCompressing ||
                  !photoFile ||
                  otp.length !== 6 ||
                  !confirmation
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#008F95] hover:bg-[#123B5D] text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying Delivery...</span>
                  </>
                ) : isCompressing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Optimizing Photo...</span>
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
