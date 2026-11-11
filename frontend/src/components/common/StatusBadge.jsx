import React from 'react';

/**
 * SkyRoute Deep Ocean Status Badge.
 * High-legibility status badge with dedicated border, matching text, and glowing status dot.
 */
const STATUS_CONFIG = {
  Pending: {
    bg: 'bg-[#FFF4E8]',
    text: 'text-[#D99024]',
    border: 'border-[#FCE3C8]',
    dot: 'bg-[#D99024]',
  },
  Assigned: {
    bg: 'bg-[#F1EFFA]',
    text: 'text-[#543F8C]',
    border: 'border-[#DFDAF4]',
    dot: 'bg-[#543F8C]',
  },
  'Picked Up': {
    bg: 'bg-[#E8EEF4]',
    text: 'text-[#176B87]',
    border: 'border-[#D5DEE7]',
    dot: 'bg-[#176B87]',
  },
  'In Transit': {
    bg: 'bg-[#E0F7FA]',
    text: 'text-[#008F95]',
    border: 'border-[#B2EBF2]',
    dot: 'bg-[#00A6A6]',
  },
  'Out for Delivery': {
    bg: 'bg-[#FFF0DC]',
    text: 'text-[#D99024]',
    border: 'border-[#F9D6B3]',
    dot: 'bg-[#D99024]',
  },
  Delivered: {
    bg: 'bg-[#E7F5F2]',
    text: 'text-[#167A56]',
    border: 'border-[#CCEAE3]',
    dot: 'bg-[#167A56]',
  },
  Cancelled: {
    bg: 'bg-[#FDF2F2]',
    text: 'text-[#D64B4B]',
    border: 'border-[#F8D2D2]',
    dot: 'bg-[#D64B4B]',
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
