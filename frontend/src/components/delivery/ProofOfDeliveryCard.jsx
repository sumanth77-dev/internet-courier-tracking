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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const ProofOfDeliveryCard = ({ shipment, initialProof = null }) => {
  const [proof, setProof] = useState(initialProof);
  const [loading, setLoading] = useState(!initialProof);
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

  // Resolve absolute photo URL if relative
  const photoSrc = proof?.photoUrl
    ? proof.photoUrl.startsWith('http')
      ? proof.photoUrl
      : `${API_BASE_URL}${proof.photoUrl}`
    : null;

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
                <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                  VERIFIED
                </span>
              </h3>
              <p className="text-[11px] text-[#667085]">
                Verified with customer OTP & package delivery photo
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5">
          {loading ? (
            <div className="py-4 text-center text-xs text-[#667085]">
              Loading delivery proof details...
            </div>
          ) : proof ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Photo Column */}
              <div className="md:col-span-1 space-y-1.5">
                <span className="text-xs font-bold text-[#172033] block">
                  Package Handover Photo
                </span>
                {photoSrc ? (
                  <div
                    onClick={() => setModalOpen(true)}
                    className="relative rounded-xl border border-[#D9DEE5] overflow-hidden group cursor-pointer aspect-4/3 bg-gray-100 flex items-center justify-center shadow-xs"
                  >
                    <img
                      src={photoSrc}
                      alt="Delivery proof package"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white gap-1.5 text-xs font-semibold">
                      <ExternalLink className="w-4 h-4" />
                      <span>Enlarge Photo</span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-[#D9DEE5] p-6 text-center text-xs text-[#667085]">
                    No photo uploaded
                  </div>
                )}
              </div>

              {/* Details Column */}
              <div className="md:col-span-2 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-[#F4F6F8] border border-[#D9DEE5]">
                    <span className="text-[#667085] text-[11px] block mb-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#D97706]" />
                      <span>Delivered Timestamp</span>
                    </span>
                    <span className="font-semibold text-[#172033]">
                      {formatDeliveredDate(proof.deliveredAt || shipment.deliveredAt)}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#F4F6F8] border border-[#D9DEE5]">
                    <span className="text-[#667085] text-[11px] block mb-0.5 flex items-center gap-1">
                      <FileCheck className="w-3 h-3 text-emerald-600" />
                      <span>Verification Method</span>
                    </span>
                    <span className="font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Customer OTP Confirmed</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-[#F4F6F8] border border-[#D9DEE5]">
                    <span className="text-[#667085] text-[11px] block mb-0.5 flex items-center gap-1">
                      <User className="w-3 h-3 text-[#667085]" />
                      <span>Recipient Name</span>
                    </span>
                    <span className="font-semibold text-[#172033]">
                      {proof.recipientName || shipment?.customerId?.name || 'Customer'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#F4F6F8] border border-[#D9DEE5]">
                    <span className="text-[#667085] text-[11px] block mb-0.5 flex items-center gap-1">
                      <Users className="w-3 h-3 text-[#667085]" />
                      <span>Recipient Relationship</span>
                    </span>
                    <span className="font-semibold text-[#172033]">
                      {proof.recipientType || 'Customer'}
                    </span>
                  </div>
                </div>

                {proof.confirmation && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Courier confirmed: Handed over package directly to the recipient.
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-gray-50 border border-[#D9DEE5] text-xs text-[#667085] text-center">
              Delivery has been completed for this shipment.
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {modalOpen && photoSrc && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative max-w-3xl w-full max-h-[90vh] bg-black rounded-2xl overflow-hidden flex flex-col items-center">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute top-3 right-3 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={photoSrc}
              alt="Package Delivery Proof"
              className="max-h-[85vh] w-auto object-contain rounded-xl p-2"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ProofOfDeliveryCard;
