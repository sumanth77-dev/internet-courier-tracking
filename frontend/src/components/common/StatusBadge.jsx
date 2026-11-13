import React from 'react';

/**
 * SkyRoute Modern Parcel Delivery Status Badge.
 * Follows the official semantic status color tokens:
 * - Success: #36A879
 * - Warning: #E9A23B
 * - Error: #E45B54
 * - Information / Route: #6B9FD6 / #FF7547
 */
const STATUS_CONFIG = {
  Pending: {
    bg: 'bg-[#FEF7ED]',
    text: 'text-[#C48429]',
    border: 'border-[#FDE3C8]',
    dot: 'bg-[#E9A23B]',
  },
  Assigned: {
    bg: 'bg-[#F2F0ED]',
    text: 'text-[#202020]',
    border: 'border-[#DEDCD8]',
    dot: 'bg-[#777777]',
  },
  'Picked Up': {
    bg: 'bg-[#EFF5FB]',
    text: 'text-[#4A81BC]',
    border: 'border-[#CCE0F3]',
    dot: 'bg-[#6B9FD6]',
  },
  'In Transit': {
    bg: 'bg-[#FFF2ED]',
    text: 'text-[#D95325]',
    border: 'border-[#FFD6C9]',
    dot: 'bg-[#FF7547]',
  },
  'Out for Delivery': {
    bg: 'bg-[#FFF2ED]',
    text: 'text-[#D95325]',
    border: 'border-[#FFD6C9]',
    dot: 'bg-[#FF7547]',
  },
  Delivered: {
    bg: 'bg-[#EAF7F1]',
    text: 'text-[#238259]',
    border: 'border-[#C4E8D8]',
    dot: 'bg-[#36A879]',
  },
  Cancelled: {
    bg: 'bg-[#FDF1F0]',
    text: 'text-[#C74740]',
    border: 'border-[#F8D0CE]',
    dot: 'bg-[#E45B54]',
  },
};

const StatusBadge = ({ status = 'Pending', size = 'sm', className = '' }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;

  const sizeClasses =
    size === 'lg'
      ? 'px-3 py-1 text-xs font-bold gap-1.5'
      : size === 'xs'
      ? 'px-2 py-0.5 text-[10px] font-semibold gap-1'
      : 'px-2.5 py-0.5 text-[11px] font-bold gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses} tracking-tight shrink-0 select-none shadow-2xs ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
      <span className="truncate">{status}</span>
    </span>
  );
};

export default StatusBadge;
