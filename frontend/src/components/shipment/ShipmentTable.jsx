import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import { ChevronRight, MapPin, Calendar, User as UserIcon } from 'lucide-react';

const ShipmentTable = ({
  shipments = [],
  showCustomer = false,
  showCourier = false,
  renderActions,
  viewLinkPrefix = '/customer/shipments',
}) => {
  if (!shipments || shipments.length === 0) {
    return null;
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#D9DEE5] overflow-hidden shadow-xs">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm text-[#172033]">
          <thead className="bg-[#F4F6F8] border-b border-[#D9DEE5] text-[11px] font-bold text-[#667085] uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3.5">Tracking ID</th>
              <th className="px-5 py-3.5">Destination</th>
              {showCustomer && <th className="px-5 py-3.5">Customer</th>}
              {showCourier && <th className="px-5 py-3.5">Courier</th>}
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Created</th>
              <th className="px-5 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D9DEE5]/60 font-normal">
            {shipments.map((s) => {
              const trackingId = s.trackingId || s.id;
              const destination = s.deliveryAddress
                ? `${s.deliveryAddress.city}, ${s.deliveryAddress.state}`
                : '—';
              const customerName = s.customerId?.name || s.customer?.name || 'Customer';
              const courierName = s.courierId?.name || s.courier?.name || 'Unassigned';

              return (
                <tr key={s._id || s.id} className="hover:bg-[#F4F6F8]/60 transition">
                  <td className="px-5 py-3.5 font-mono font-bold text-[#172033]">
                    <Link
                      to={`${viewLinkPrefix}/${trackingId}`}
                      className="hover:text-[#D97706] transition"
                    >
                      {trackingId}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-[#263449]">
                      <MapPin className="w-3.5 h-3.5 text-[#667085] shrink-0" />
                      <span>{destination}</span>
                    </div>
                  </td>
                  {showCustomer && (
                    <td className="px-5 py-3.5 text-[#263449] font-medium">
                      {customerName}
                    </td>
                  )}
                  {showCourier && (
                    <td className="px-5 py-3.5 text-[#263449]">
                      {s.courierId || s.courier ? (
                        <span className="font-semibold text-[#172033]">{courierName}</span>
                      ) : (
                        <span className="text-[#667085] italic">Unassigned</span>
                      )}
                    </td>
                  )}
                  <td className="px-5 py-3.5">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-5 py-3.5 text-[#667085] text-xs">
                    {formatDate(s.createdAt)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {renderActions ? (
                      renderActions(s)
                    ) : (
                      <Link
                        to={`${viewLinkPrefix}/${trackingId}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#172033] hover:text-[#D97706] bg-white border border-[#D9DEE5] hover:bg-[#F4F6F8] rounded-md transition shadow-xs"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-[#D9DEE5]/60">
        {shipments.map((s) => {
          const trackingId = s.trackingId || s.id;
          const destination = s.deliveryAddress
            ? `${s.deliveryAddress.city}, ${s.deliveryAddress.state}`
            : '—';
          const customerName = s.customerId?.name || s.customer?.name || 'Customer';
          const courierName = s.courierId?.name || s.courier?.name || 'Unassigned';

          return (
            <div key={s._id || s.id} className="p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sm text-[#172033]">
                  {trackingId}
                </span>
                <StatusBadge status={s.status} />
              </div>

              <div className="text-xs text-[#667085] space-y-1">
                <div className="flex items-center gap-1.5 text-[#263449]">
                  <MapPin className="w-3.5 h-3.5 text-[#667085] shrink-0" />
                  <span>{destination}</span>
                </div>
                {showCustomer && (
                  <div className="flex items-center gap-1.5 text-[#263449]">
                    <UserIcon className="w-3.5 h-3.5 text-[#667085] shrink-0" />
                    <span>Customer: {customerName}</span>
                  </div>
                )}
                {showCourier && (
                  <div className="flex items-center gap-1.5 text-[#263449]">
                    <UserIcon className="w-3.5 h-3.5 text-[#667085] shrink-0" />
                    <span>Courier: {courierName}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[#667085]">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span>{formatDate(s.createdAt)}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end">
                {renderActions ? (
                  renderActions(s)
                ) : (
                  <Link
                    to={`${viewLinkPrefix}/${trackingId}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#172033] bg-white border border-[#D9DEE5] rounded-md shadow-xs"
                  >
                    <span>View Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShipmentTable;
