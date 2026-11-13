import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, UserCheck, RefreshCw } from 'lucide-react';

const TRACKABLE_STATUSES = ['Assigned', 'Picked Up', 'In Transit', 'Out for Delivery'];

/**
 * Dedicated reusable action container for Admin shipment table rows — Modern Parcel Delivery edition.
 * Provides uniform button height (h-8), rounded-xl radius, strict no-wrapping,
 * and predictable right alignment across all shipment lifecycle states.
 */
const AdminShipmentActions = ({
  shipment,
  onAssign,
  onUpdateStatus,
  viewLinkPrefix = '/admin/shipments',
}) => {
  if (!shipment) return null;

  const isTrackable = TRACKABLE_STATUSES.includes(shipment.status);
  const canAssign = ['Pending', 'Assigned'].includes(shipment.status);
  const canUpdateStatus = !['Delivered', 'Cancelled'].includes(shipment.status);
  const isAssigned = Boolean(shipment.courierId || shipment.status === 'Assigned');
  const targetId = shipment._id || shipment.trackingId;

  return (
    <div className="inline-flex items-center justify-end gap-1.5 flex-nowrap whitespace-nowrap min-w-[210px]">
      {/* 1. Primary View / Track Action */}
      <Link
        to={`${viewLinkPrefix}/${targetId}`}
        className={`h-8 px-2.5 sm:px-3 text-xs font-bold rounded-xl transition duration-150 shadow-2xs inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
          isTrackable
            ? 'bg-[#FFF2ED] text-[#D95325] hover:bg-[#FFE6DC] border border-[#FFD6C9]'
            : 'bg-white text-[#202020] hover:text-[#FF7547] hover:bg-[#F2F0ED] border border-[#DEDCD8]'
        }`}
        title={isTrackable ? 'Track live route' : 'View shipment details'}
      >
        {isTrackable ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF7547] animate-pulse shrink-0" />
            <span>Track</span>
          </>
        ) : (
          <>
            <Eye className="w-3.5 h-3.5 shrink-0 opacity-70" />
            <span>View</span>
          </>
        )}
      </Link>

      {/* 2. Assign / Reassign Courier Action */}
      {canAssign && onAssign && (
        <button
          type="button"
          onClick={() => onAssign(shipment)}
          className={`h-8 px-2.5 sm:px-3 text-xs font-bold rounded-xl transition duration-150 shadow-2xs inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
            isAssigned
              ? 'bg-[#171717] hover:bg-[#242424] text-white border border-[#303030]'
              : 'text-white bg-[#FF7547] hover:bg-[#F06438] border border-[#FF7547]'
          }`}
          title={isAssigned ? 'Reassign courier' : 'Assign to courier'}
        >
          <UserCheck className="w-3.5 h-3.5 shrink-0" />
          <span>{isAssigned ? 'Reassign' : 'Assign'}</span>
        </button>
      )}

      {/* 3. Manual Status Update Action */}
      {canUpdateStatus && onUpdateStatus && (
        <button
          type="button"
          onClick={() => onUpdateStatus(shipment)}
          className="h-8 px-2.5 sm:px-3 text-xs font-bold text-[#C48429] hover:bg-[#FDE3C8] bg-[#FEF7ED] border border-[#FDE3C8] rounded-xl transition duration-150 shadow-2xs inline-flex items-center justify-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
          title="Override shipment status"
        >
          <RefreshCw className="w-3 h-3 shrink-0" />
          <span>Status</span>
        </button>
      )}
    </div>
  );
};

export default AdminShipmentActions;
