import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  CheckCircle2,
  ShieldCheck,
  Calendar,
  User,
  Users,
  Image as ImageIcon,
  ExternalLink,
  X,
  FileCheck,
} from 'lucide-react';

// Helper to resolve stable browser-accessible photo URL with authentication token query
const resolveProofPhotoUrl = (rawUrl) => {
  if (!rawUrl) return null;
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    return rawUrl;
  }
  const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const serverOrigin = rawApiUrl.replace(/\/api\/?$/, '');
  const cleanPath = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
  const token = localStorage.getItem('authToken');
  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : '';
  return `${serverOrigin}${cleanPath}${tokenQuery}`;
};

export const ProofOfDeliveryCard = ({ shipment, initialProof = null }) => {
  const [proof, setProof] = useState(initialProof);
  const [loading, setLoading] = useState(!initialProof);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const shipmentId = shipment?._id || shipment?.id || shipment?.trackingId;

  useEffect(() => {
    let isMounted = true;
    if (initialProof) {
      setProof(initialProof);
      return;
    }

    if (!shipmentId || shipment?.status !== 'Delivered') {
      return;
    }

    const fetchProof = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/shipments/${shipmentId}/proof-of-delivery`);
        if (isMounted && res.data?.success && res.data.data?.proof) {
          setProof(res.data.data.proof);
        }
      } catch (err) {
        // Non-blocking
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProof();

    return () => {
      isMounted = false;
    };
  }, [shipmentId, shipment?.status, initialProof]);

  if (shipment?.status !== 'Delivered') {
    return null;
  }

  const formatDeliveredDate = (dateStr) => {
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

  const photoSrc = resolveProofPhotoUrl(proof?.photoUrl);

  const handleRetryImage = () => {
    setImageError(false);
    setImageLoading(true);
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-emerald-300 shadow-xs overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-emerald-500/10 border-b border-emerald-300/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center gap-1.5">
                <span>Proof of Delivery (POD)</span>
                <span className="px-2 py-0.5 rounded-full bg-[#16845B] text-white text-[10px] font-bold">
                  VERIFIED
                </span>
              </h3>
              <p className="text-[11px] text-[#65748B]">
                Verified with customer OTP & package delivery photo
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5">
          {loading ? (
            <div className="py-8 text-center text-xs text-[#65748B] flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-[#17243A] border-t-transparent rounded-full animate-spin"></div>
              <span>Loading delivery proof details...</span>
            </div>
          ) : proof ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Photo Column */}
              <div className="md:col-span-1 space-y-1.5">
                <span className="text-xs font-bold text-[#17243A] block">
                  Package Handover Photo
                </span>
                {photoSrc ? (
                  <div className="relative rounded-xl border border-[#E1E7EF] overflow-hidden group aspect-4/3 bg-[#F5F7FA] flex items-center justify-center shadow-xs">
                    {imageLoading && !imageError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#F5F7FA] text-[#65748B] text-xs">
                        <span className="w-5 h-5 border-2 border-[#17243A] border-t-transparent rounded-full animate-spin"></span>
                      </div>
                    )}
                    {imageError ? (
                      <div className="p-4 text-center text-xs text-[#65748B] space-y-2">
                        <ImageIcon className="w-8 h-8 text-[#65748B]/60 mx-auto" />
                        <p className="text-[11px] text-[#C0392B] font-medium">
                          Unable to load delivery photo
                        </p>
                        <button
                          type="button"
                          onClick={handleRetryImage}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-[#E1E7EF] hover:bg-[#F5F7FA] rounded-md transition shadow-xs cursor-pointer"
                        >
                          Retry Loading
                        </button>
                      </div>
                    ) : (
                      <>
                        <img
                          src={photoSrc}
                          alt="Package delivery handover proof"
                          onLoad={() => setImageLoading(false)}
                          onError={() => {
                            setImageLoading(false);
                            setImageError(true);
                          }}
                          className={`w-full h-full object-cover group-hover:scale-105 transition duration-200 cursor-pointer ${
                            imageLoading ? 'opacity-0' : 'opacity-100'
                          }`}
                          onClick={() => setModalOpen(true)}
                        />
                        <div
                          onClick={() => setModalOpen(true)}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white gap-1.5 text-xs font-semibold cursor-pointer"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Enlarge Photo</span>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-[#E1E7EF] p-6 text-center text-xs text-[#65748B]">
                    No photo uploaded
                  </div>
                )}
              </div>

              {/* Details Column */}
              <div className="md:col-span-2 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-[#F5F7FA] border border-[#E1E7EF]">
                    <span className="text-[#65748B] text-[11px] block mb-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#F59E0B]" />
                      <span>Delivered Timestamp</span>
                    </span>
                    <span className="font-semibold text-[#17243A]">
                      {formatDeliveredDate(proof.deliveredAt || shipment.deliveredAt)}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#F5F7FA] border border-[#E1E7EF]">
                    <span className="text-[#65748B] text-[11px] block mb-0.5 flex items-center gap-1">
                      <FileCheck className="w-3 h-3 text-[#16845B]" />
                      <span>Verification Method</span>
                    </span>
                    <span className="font-semibold text-[#16845B] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Customer OTP Confirmed</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-[#F5F7FA] border border-[#E1E7EF]">
                    <span className="text-[#65748B] text-[11px] block mb-0.5 flex items-center gap-1">
                      <User className="w-3 h-3 text-[#65748B]" />
                      <span>Recipient Name</span>
                    </span>
                    <span className="font-semibold text-[#17243A]">
                      {proof.recipientName || shipment?.customerId?.name || 'Customer'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#F5F7FA] border border-[#E1E7EF]">
                    <span className="text-[#65748B] text-[11px] block mb-0.5 flex items-center gap-1">
                      <Users className="w-3 h-3 text-[#65748B]" />
                      <span>Recipient Relationship</span>
                    </span>
                    <span className="font-semibold text-[#17243A]">
                      {proof.recipientType || 'Customer'}
                    </span>
                  </div>
                </div>

                {proof.confirmation && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#16845B] shrink-0" />
                    <span>
                      Courier confirmed: Handed over package directly to recipient.
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-gray-50 border border-[#E1E7EF] text-xs text-[#65748B] text-center">
              Delivery has been completed for this shipment.
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {modalOpen && photoSrc && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[90vh] bg-[#17243A] rounded-2xl overflow-hidden flex flex-col items-center p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-2 border-b border-white/10 mb-2 px-2 text-white">
              <span className="text-xs font-semibold">Proof of Delivery — Package Photo</span>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                aria-label="Close photo preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center w-full">
              <img
                src={photoSrc}
                alt="Package Delivery Proof (Enlarged)"
                className="max-h-[80vh] w-auto max-w-full object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProofOfDeliveryCard;
