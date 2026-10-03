import React from 'react';

const STATUS_CONFIG = {
  Pending: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  Assigned: {
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-300',
    dot: 'bg-slate-500',
  },
  'Picked Up': {
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    dot: 'bg-blue-600',
  },
  'In Transit': {
    bg: 'bg-[#172033]/10',
    text: 'text-[#172033]',
    border: 'border-[#172033]/20',
    dot: 'bg-[#172033]',
  },
  'Out for Delivery': {
    bg: 'bg-amber-100',
    text: 'text-amber-900',
    border: 'border-amber-300',
    dot: 'bg-[#D97706]',
  },
  Delivered: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-[#15803D]',
  },
  Cancelled: {
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200',
    dot: 'bg-[#B91C1C]',
  },
};

const StatusBadge = ({ status = 'Pending', size = 'sm' }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;

  const sizeClasses =
    size === 'lg'
      ? 'px-3 py-1 text-xs font-semibold'
      : 'px-2.5 py-0.5 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{status}</span>
    </span>
  );
};

export default StatusBadge;
