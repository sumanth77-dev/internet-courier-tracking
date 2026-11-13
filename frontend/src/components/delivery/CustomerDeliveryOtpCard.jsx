import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import {
  KeyRound,
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
      setError(err.response?.data?.message || 'Failed to generate delivery OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (otpData?.otp) {
      navigator.clipboard.writeText(otpData.otp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOwner || shipment?.status !== 'Out for Delivery') {
    return null;
  }

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-[#DEDCD8] overflow-hidden shadow-xs">
      {/* Header */}
      <div className="px-5 py-3.5 bg-[#FEF7ED] border-b border-[#FDE3C8] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#FF7547]/15 text-[#FF7547]">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#202020] uppercase tracking-wider flex items-center gap-1.5">
              <span>Proof of Delivery Verification OTP</span>
              <span className="px-2 py-0.5 rounded-full bg-[#FF7547] text-white text-[10px] font-bold">
                SECURE
              </span>
            </h3>
            <p className="text-[11px] text-[#777777]">
              Required for courier package handover verification
            </p>
          </div>
        </div>

        {secondsRemaining > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#202020] bg-[#FFF2ED] px-3 py-1 rounded-full border border-[#FFD6C9]">
            <Clock className="w-3.5 h-3.5 text-[#FF7547]" />
            <span>Valid: {formatTime(secondsRemaining)}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-[#FDF1F0] border border-[#F8D0CE] text-xs text-[#E45B54] font-semibold flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {otpData?.otp && secondsRemaining > 0 ? (
          <div className="space-y-3.5">
            <div className="text-center p-5 rounded-xl bg-[#F2F0ED] border border-[#DEDCD8]">
              <span className="text-xs text-[#777777] font-semibold block mb-1">
                Your Delivery Verification OTP
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-3xl sm:text-4xl font-black tracking-widest text-[#202020]">
                  {otpData.otp}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-2.5 rounded-xl border border-[#DEDCD8] bg-white hover:bg-[#E9E7E4] text-[#202020] transition cursor-pointer shadow-2xs"
                  title="Copy OTP to clipboard"
                  aria-label="Copy OTP"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-[#36A879]" />
                  ) : (
                    <Copy className="w-4 h-4 text-[#777777]" />
                  )}
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FEF7ED] border border-[#FDE3C8] text-xs text-[#202020] flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#C48429] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Important:</strong> Provide this 6-digit OTP to the SkyRoute courier when they arrive at your doorstep. The courier must verify this OTP on their terminal before completing the delivery.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleGenerateOtp}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl border border-[#DEDCD8] hover:bg-[#F2F0ED] text-[#777777] hover:text-[#202020] transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Regenerate OTP</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-3.5 py-3">
            <p className="text-xs text-[#777777] max-w-md mx-auto leading-relaxed">
              Your shipment is currently <strong>Out for Delivery</strong>. Generate your 6-digit delivery OTP below and share it with the courier to securely verify handover.
            </p>

            <button
              type="button"
              onClick={handleGenerateOtp}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF7547] hover:bg-[#F06438] text-white text-xs font-bold shadow-xs transition duration-150 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Generating Secure OTP...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5 text-white" />
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
