import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import api from '../../services/api';
import { Truck, AlertCircle } from 'lucide-react';

const AssignCourierModal = ({ isOpen, onClose, shipment, onSuccess }) => {
  const [couriers, setCouriers] = useState([]);
  const [selectedCourierId, setSelectedCourierId] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSelectedCourierId(shipment?.courierId?._id || shipment?.courierId || '');
      fetchCouriers();
    }
  }, [isOpen, shipment]);

  const fetchCouriers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/shipments/admin/couriers');
      if (res.data?.success) {
        setCouriers(res.data.data.couriers || []);
      }
    } catch (err) {
      setError('Unable to load couriers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourierId) {
      setError('Please select a courier to assign');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const shipmentId = shipment._id || shipment.id || shipment.trackingId;
      const res = await api.put(`/shipments/admin/${shipmentId}/assign`, {
        courierId: selectedCourierId,
      });

      if (res.data?.success) {
        onSuccess(res.data.data.shipment);
        onClose();
      } else {
        setError(res.data?.message || 'Failed to assign courier');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error while assigning courier');
    } finally {
      setSubmitting(false);
    }
  };

  if (!shipment) return null;

  const isReassign = !!(shipment?.courierId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${isReassign ? 'Reassign' : 'Assign'} Courier — ${shipment?.trackingId || ''}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-[#B91C1C] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={fetchCouriers}
              className="text-[11px] underline font-semibold hover:text-red-900 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        <div className="bg-[#F4F6F8] p-3.5 rounded-lg text-xs space-y-1.5 border border-[#D9DEE5]">
          <div className="flex justify-between">
            <span className="text-[#667085]">Destination:</span>
            <span className="font-semibold text-[#172033]">
              {shipment?.deliveryAddress?.city || '—'}, {shipment?.deliveryAddress?.state || '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#667085]">Current Status:</span>
            <span className="font-semibold text-[#172033]">{shipment?.status || 'Pending'}</span>
          </div>
          {shipment?.courierId && (
            <div className="flex justify-between pt-1 border-t border-[#D9DEE5]/60">
              <span className="text-[#667085]">Currently Assigned:</span>
              <span className="font-semibold text-[#172033]">
                {shipment.courierId.name || 'Assigned Courier'}
              </span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#172033] mb-1.5 uppercase tracking-wider">
            {isReassign ? 'Select New Courier' : 'Select Active Courier'}
          </label>
          {loading ? (
            <div className="py-2 text-xs text-[#667085]">Loading couriers list...</div>
          ) : couriers.length === 0 ? (
            <div className="py-2 text-xs text-[#D97706]">
              No registered couriers found in system.
            </div>
          ) : (
            <select
              value={selectedCourierId}
              onChange={(e) => setSelectedCourierId(e.target.value)}
              disabled={submitting}
              className="w-full h-10 px-3 rounded-lg border border-[#D9DEE5] text-sm text-[#172033] bg-white focus:outline-none focus:border-[#172033] focus:ring-1 focus:ring-[#172033] disabled:bg-gray-100"
            >
              <option value="">-- Choose a courier --</option>
              {couriers.map((c) => (
                <option key={c.id || c._id} value={c.id || c._id}>
                  {c.name} ({c.phone || c.email})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#D9DEE5]">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-3.5 py-2 text-xs font-semibold text-[#667085] hover:text-[#172033] hover:bg-[#F4F6F8] rounded-lg transition cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || loading || couriers.length === 0 || !selectedCourierId}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#172033] hover:bg-[#0F172A] rounded-lg transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {submitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>{isReassign ? 'Reassigning...' : 'Assigning...'}</span>
              </>
            ) : (
              <span>{isReassign ? 'Confirm Reassignment' : 'Confirm Assignment'}</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AssignCourierModal;
