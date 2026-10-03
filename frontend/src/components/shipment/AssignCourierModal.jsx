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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Courier — ${shipment.trackingId}`}
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
            <span className="text-[#667085]">Destination:</span>
            <span className="font-semibold text-[#172033]">
              {shipment.deliveryAddress?.city}, {shipment.deliveryAddress?.state}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#667085]">Current Status:</span>
            <span className="font-semibold text-[#172033]">{shipment.status}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#172033] mb-1.5 uppercase tracking-wider">
            Select Active Courier
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
              className="w-full h-10 px-3 rounded-lg border border-[#D9DEE5] text-sm text-[#172033] bg-white focus:outline-none focus:border-[#172033] focus:ring-1 focus:ring-[#172033]"
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
            className="px-3.5 py-2 text-xs font-semibold text-[#667085] hover:text-[#172033] hover:bg-[#F4F6F8] rounded-lg transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || loading || couriers.length === 0}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#172033] hover:bg-[#0F172A] rounded-lg transition flex items-center gap-1.5 disabled:opacity-60 cursor-pointer shadow-xs"
          >
            {submitting ? 'Assigning...' : 'Confirm Assignment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AssignCourierModal;
