import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import {
  KeyRound,
  ShieldCheck,
  Clock,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  Info,
} from 'lucide-react';

export const CustomerDeliveryOtpCard = ({ shipment, isOwner = true }) => {
  const [otpData, setOtpData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  const shipmentId = shipment?._id || shipment?.id || shipment?.trackingId;

  // Check if active OTP exists on mount
  const checkOtpStatus = useCallback(async () => {
    if (!shipmentId || !isOwner || shipment?.status !== 'Out for Delivery') return;
    try {
      const res = await api.get(`/shipments/${shipmentId}/delivery-otp-status`);
      if (res.data?.success && res.data.data?.hasOtp) {
        setSecondsRemaining(res.data.data.remainingSeconds || 0);
      }
    } catch {
      // Non-blocking
    }
  }, [shipmentId, isOwner, shipment?.status]);

  useEffect(() => {
    checkOtpStatus();
  }, [checkOtpStatus]);

  // Expiry countdown timer
  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsRemaining]);

  const handleGenerateOtp = async () => {
    if (!shipmentId) return;
    setLoading(true);
    setError('');

    try {
      const res = await api.post(`/shipments/${shipmentId}/delivery-otp`);
      if (res.data?.success && res.data.data) {
        setOtpData(res.data.data);
        setSecondsRemaining(res.data.data.expiresInSeconds || 600);
      } else {
        setError(res.data?.message || 'Failed to generate OTP');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Unable to generate delivery OTP.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!otpData?.otp) return;
    navigator.clipboard.writeText(otpData.otp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!isOwner || shipment?.status !== 'Out for Delivery') {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-amber-300 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 bg-amber-500/10 border-b border-amber-300/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-[#D97706]">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center gap-1.5">
              <span>Proof of Delivery Verification OTP</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[9px] font-bold">
                DEMO
              </span>
            </h3>
            <p className="text-[11px] text-[#667085]">
              Required for courier package handover
            </p>
          </div>
        </div>

        {secondsRemaining > 0 && (
          <div className="flex items-center gap-1 text-[11px] font-semibold text-[#D97706] bg-amber-100/70 px-2.5 py-1 rounded-full border border-amber-200">
            <Clock className="w-3 h-3" />
            <span>Valid: {formatTime(secondsRemaining)}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {error && (
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {otpData?.otp && secondsRemaining > 0 ? (
          <div className="space-y-3">
            <div className="text-center p-4 rounded-xl bg-[#F4F6F8] border border-[#D9DEE5]">
              <span className="text-xs text-[#667085] font-medium block mb-1">
                Your Delivery Verification OTP
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-3xl sm:text-4xl font-extrabold tracking-widest text-[#172033]">
                  {otpData.otp}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-2 rounded-lg border border-[#D9DEE5] bg-white hover:bg-gray-50 text-[#172033] transition"
                  title="Copy OTP"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-[#667085]" />
                  )}
                </button>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-[#263449] flex items-start gap-2">
              <Info className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Important:</strong> Provide this 6-digit OTP to the courier when they hand over your package. The courier cannot complete delivery without this OTP.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleGenerateOtp}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#D9DEE5] hover:bg-gray-50 text-[#667085] hover:text-[#172033] transition"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Regenerate OTP</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-3 py-2">
            <p className="text-xs text-[#263449] max-w-md mx-auto leading-relaxed">
              Your shipment is <strong>Out for Delivery</strong>. Generate your 6-digit delivery OTP below and share it with the courier to securely verify handover.
            </p>

            <button
              type="button"
              onClick={handleGenerateOtp}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#172033] hover:bg-[#0F172A] text-white text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#D97706]" />
                  <span>Generating Secure OTP...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>Generate Delivery OTP</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDeliveryOtpCard;
