import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import {
  ChevronRight,
  Calendar,
  User as UserIcon,
  Truck,
  ArrowRight,
  Eye,
} from 'lucide-react';

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
    <div className="bg-white rounded-2xl border border-[#DEDCD8] overflow-hidden shadow-2xs">
      {/* Desktop / Laptop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full min-w-[1050px] text-left text-xs sm:text-sm text-[#202020] border-collapse">
          <thead className="bg-[#E9E7E4] border-b border-[#DEDCD8] text-[11px] font-bold text-[#202020] uppercase tracking-wider select-none">
            <tr>
              <th className="px-5 py-3.5 min-w-[160px]">Tracking ID</th>
              <th className="px-5 py-3.5 min-w-[190px]">Route</th>
              {showCustomer && <th className="px-5 py-3.5 min-w-[140px]">Customer</th>}
              {showCourier && <th className="px-5 py-3.5 min-w-[150px]">Courier</th>}
              <th className="px-5 py-3.5 min-w-[130px]">Status</th>
              <th className="px-5 py-3.5 min-w-[100px] whitespace-nowrap">Date</th>
              <th className="px-5 py-3.5 min-w-[220px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DEDCD8] font-normal">
            {shipments.map((s) => {
              const trackingId = s.trackingId || s.id;
              const origin = s.pickupAddress?.city || 'Origin';
              const destination = s.deliveryAddress?.city || 'Destination';
              const customerName = s.customerId?.name || s.customer?.name || 'Customer';
              const courierName = s.courierId?.name || s.courier?.name || (s.courierId ? 'Assigned' : 'Unassigned');

              return (
                <tr key={s._id || s.id} className="hover:bg-[#F2F0ED] transition-colors duration-100 group">
                  {/* Tracking ID */}
                  <td className="px-5 py-3.5 min-w-[160px] whitespace-nowrap align-middle">
                    <Link
                      to={`${viewLinkPrefix}/${trackingId}`}
                      className="font-mono font-bold text-[#202020] hover:text-[#FF7547] transition-colors inline-block"
                      title={trackingId}
                    >
                      {trackingId}
                    </Link>
                  </td>

                  {/* Route */}
                  <td className="px-5 py-3.5 min-w-[190px] whitespace-nowrap align-middle">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-[#202020]">
                      <span className="text-[#777777] max-w-[95px] truncate" title={origin}>{origin}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#FF7547] shrink-0" />
                      <span className="font-semibold text-[#202020] max-w-[115px] truncate" title={destination}>{destination}</span>
                    </div>
                  </td>

                  {/* Customer (Optional) */}
                  {showCustomer && (
                    <td className="px-5 py-3.5 min-w-[140px] whitespace-nowrap align-middle text-[#202020] font-medium">
                      <div className="flex items-center gap-1.5 max-w-[130px] truncate" title={customerName}>
                        <UserIcon className="w-3.5 h-3.5 text-[#777777] shrink-0" />
                        <span className="truncate">{customerName}</span>
                      </div>
                    </td>
                  )}

                  {/* Courier (Optional) */}
                  {showCourier && (
                    <td className="px-5 py-3.5 min-w-[150px] whitespace-nowrap align-middle text-[#202020]">
                      {s.courierId || s.courier ? (
                        <div className="flex items-center gap-1.5 max-w-[140px] truncate" title={courierName}>
                          <Truck className="w-3.5 h-3.5 text-[#FF7547] shrink-0" />
                          <span className="font-semibold text-[#202020] truncate">{courierName}</span>
                        </div>
                      ) : (
                        <span className="text-[#A7A7A7] text-xs italic">Unassigned</span>
                      )}
                    </td>
                  )}

                  {/* Status Badge */}
                  <td className="px-5 py-3.5 min-w-[130px] whitespace-nowrap align-middle">
                    <StatusBadge status={s.status} />
                  </td>

                  {/* Date */}
                  <td className="px-5 py-3.5 min-w-[100px] text-[#777777] text-xs whitespace-nowrap align-middle">
                    {formatDate(s.createdAt)}
                  </td>

                  {/* Action Column */}
                  <td className="px-5 py-3.5 min-w-[220px] text-right whitespace-nowrap align-middle">
                    {renderActions ? (
                      renderActions(s)
                    ) : (
                      <Link
                        to={`${viewLinkPrefix}/${trackingId}`}
                        className="h-8 px-3 text-xs font-semibold text-[#202020] hover:text-[#FF7547] bg-white border border-[#DEDCD8] hover:bg-[#F2F0ED] rounded-xl transition duration-150 shadow-2xs inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                      >
                        <Eye className="w-3.5 h-3.5 opacity-70" />
                        <span>View</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile & Tablet Card Layout (Optimized for <1024px) */}
      <div className="lg:hidden divide-y divide-[#DEDCD8]">
        {shipments.map((s) => {
          const trackingId = s.trackingId || s.id;
          const origin = s.pickupAddress ? `${s.pickupAddress.city || ''}, ${s.pickupAddress.state || ''}` : 'Origin';
          const destination = s.deliveryAddress ? `${s.deliveryAddress.city || ''}, ${s.deliveryAddress.state || ''}` : 'Destination';
          const customerName = s.customerId?.name || s.customer?.name || 'Customer';
          const courierName = s.courierId?.name || s.courier?.name || (s.courierId ? 'Assigned' : 'Unassigned');

          return (
            <div key={s._id || s.id} className="p-4 sm:p-5 space-y-3.5 hover:bg-[#F2F0ED]/50 transition">
              {/* Card Header: Tracking ID + Status */}
              <div className="flex items-center justify-between gap-2">
                <Link
                  to={`${viewLinkPrefix}/${trackingId}`}
                  className="font-mono font-bold text-sm text-[#202020] hover:text-[#FF7547] transition break-all"
                >
                  {trackingId}
                </Link>
                <StatusBadge status={s.status} size="sm" />
              </div>

              {/* Route Summary */}
              <div className="p-3 rounded-xl bg-[#F2F0ED] border border-[#DEDCD8] text-xs space-y-1.5">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#777777] shrink-0 mt-1" />
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase text-[#777777] block leading-none mb-0.5">Pickup</span>
                    <span className="font-medium text-[#202020] break-words">{origin}</span>
                  </div>
                </div>

                <div className="ml-1 w-0.5 h-3 bg-[#DEDCD8]" />

                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#FF7547] shrink-0 mt-1" />
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase text-[#FF7547] block leading-none mb-0.5">Drop-off</span>
                    <span className="font-semibold text-[#202020] break-words">{destination}</span>
                  </div>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs text-[#777777]">
                <div className="flex items-center gap-1.5 truncate">
                  <Calendar className="w-3.5 h-3.5 text-[#777777] shrink-0" />
                  <span className="truncate">{formatDate(s.createdAt)}</span>
                </div>

                {showCourier && (
                  <div className="flex items-center gap-1.5 truncate justify-end">
                    <Truck className="w-3.5 h-3.5 text-[#FF7547] shrink-0" />
                    <span className="font-semibold text-[#202020] truncate">{courierName}</span>
                  </div>
                )}

                {showCustomer && (
                  <div className="flex items-center gap-1.5 truncate justify-end">
                    <UserIcon className="w-3.5 h-3.5 text-[#777777] shrink-0" />
                    <span className="truncate">{customerName}</span>
                  </div>
                )}
              </div>

              {/* Actions Container */}
              <div className="pt-3 border-t border-[#DEDCD8] flex items-center justify-end gap-2 flex-wrap">
                {renderActions ? (
                  renderActions(s)
                ) : (
                  <Link
                    to={`${viewLinkPrefix}/${trackingId}`}
                    className="h-8 px-4 text-xs font-bold text-white bg-[#171717] hover:bg-[#242424] rounded-xl transition duration-150 shadow-xs inline-flex items-center justify-center gap-1.5 w-full sm:w-auto"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Shipment Details</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-70" />
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
