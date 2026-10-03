import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import api from '../../services/api';
import { AlertCircle } from 'lucide-react';

const COURIER_TRANSITIONS = {
  Assigned: ['Picked Up'],
  'Picked Up': ['In Transit'],
  'In Transit': ['Out for Delivery'],
  'Out for Delivery': ['Delivered'],
  Delivered: [],
  Cancelled: [],
};

const ADMIN_TRANSITIONS = {
  Pending: ['Assigned', 'Cancelled'],
  Assigned: ['Picked Up', 'Cancelled'],
  'Picked Up': ['In Transit', 'Cancelled'],
  'In Transit': ['Out for Delivery', 'Cancelled'],
  'Out for Delivery': ['Delivered', 'Cancelled'],
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
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-[#B91C1C] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-[#F4F6F8] p-3.5 rounded-lg text-xs space-y-1.5 border border-[#D9DEE5]">
          <div className="flex justify-between">
            <span className="text-[#667085]">Current Lifecycle Status:</span>
            <span className="font-semibold text-[#172033]">{currentStatus}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#172033] mb-1.5 uppercase tracking-wider">
            Next Delivery Status
          </label>
          {allowedTransitions.length === 0 ? (
            <div className="p-3 rounded-lg bg-[#F4F6F8] border border-[#D9DEE5] text-xs text-[#667085]">
              This shipment is in terminal state ({currentStatus}) and cannot be transitioned further.
            </div>
          ) : (
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[#D9DEE5] text-sm text-[#172033] bg-white focus:outline-none focus:border-[#172033] focus:ring-1 focus:ring-[#172033]"
            >
              {allowedTransitions.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#D9DEE5]">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold text-[#667085] hover:text-[#172033] hover:bg-[#F4F6F8] rounded-lg transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || allowedTransitions.length === 0}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#172033] hover:bg-[#0F172A] rounded-lg transition flex items-center gap-1.5 disabled:opacity-60 cursor-pointer shadow-xs"
          >
            {submitting ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UpdateStatusModal;
