import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import api from '../../services/api';
import { AlertCircle } from 'lucide-react';

const COURIER_TRANSITIONS = {
  Assigned: ['Picked Up'],
  'Picked Up': ['In Transit'],
  'In Transit': ['Out for Delivery'],
  'Out for Delivery': [], // Requires Proof of Delivery with OTP & Photo
  Delivered: [],
  Cancelled: [],
};

const ADMIN_TRANSITIONS = {
  Pending: ['Assigned', 'Cancelled'],
  Assigned: ['Picked Up', 'Cancelled'],
  'Picked Up': ['In Transit', 'Cancelled'],
  'In Transit': ['Out for Delivery', 'Cancelled'],
  'Out for Delivery': ['Cancelled'], // Delivered requires verified Proof of Delivery
  Delivered: [],
  Cancelled: [],
};

const UpdateStatusModal = ({
  isOpen,
  onClose,
  shipment,
  onSuccess,
  role = 'admin',
}) => {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const currentStatus = shipment?.status || 'Pending';
  const allowedTransitions =
    role === 'courier'
      ? COURIER_TRANSITIONS[currentStatus] || []
      : ADMIN_TRANSITIONS[currentStatus] || [];

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSelectedStatus(allowedTransitions[0] || '');
    }
  }, [isOpen, shipment, currentStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStatus) {
      setError('Please select a valid new status');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const shipmentId = shipment._id || shipment.id || shipment.trackingId;
      const endpoint =
        role === 'courier'
          ? `/shipments/courier/${shipmentId}/status`
          : `/shipments/admin/${shipmentId}/status`;

      const res = await api.patch(endpoint, {
        status: selectedStatus,
      });

      if (res.data?.success) {
        onSuccess(res.data.data.shipment);
        onClose();
      } else {
        setError(res.data?.message || 'Failed to update status');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error while updating status');
    } finally {
      setSubmitting(false);
    }
  };

  if (!shipment) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Update Status — ${shipment.trackingId}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-[#FDF1F0] border border-[#F8D0CE] text-xs font-semibold text-[#E45B54] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-[#F2F0ED] p-4 rounded-xl text-xs space-y-1.5 border border-[#DEDCD8]">
          <div className="flex justify-between items-center">
            <span className="text-[#777777]">Current Lifecycle Status:</span>
            <span className="font-bold text-[#202020]">{currentStatus}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#202020] mb-1.5 uppercase tracking-wider">
            Next Delivery Status
          </label>
          {allowedTransitions.length === 0 ? (
            <div className="p-3.5 rounded-xl bg-[#F2F0ED] border border-[#DEDCD8] text-xs text-[#777777] leading-relaxed">
              {currentStatus === 'Out for Delivery'
                ? 'Shipment is Out for Delivery. Transitioning to Delivered requires Proof of Delivery (Package Photo + Customer OTP verification).'
                : `This shipment is in terminal state (${currentStatus}) and cannot be transitioned further.`}
            </div>
          ) : (
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-[#DEDCD8] text-sm text-[#202020] bg-white focus:outline-none focus:border-[#FF7547] focus:ring-2 focus:ring-[#FF7547]/20 cursor-pointer"
            >
              {allowedTransitions.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#DEDCD8]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#777777] hover:text-[#202020] hover:bg-[#E9E7E4] rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || allowedTransitions.length === 0}
            className="px-5 py-2 text-xs font-bold text-white bg-[#FF7547] hover:bg-[#F06438] rounded-xl transition flex items-center gap-1.5 disabled:opacity-60 cursor-pointer shadow-xs"
          >
            {submitting ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UpdateStatusModal;
