import React from 'react';

const STATUS_CONFIG = {
  Pending: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    dot: 'bg-slate-500',
  },
  Assigned: {
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
  },
  'Picked Up': {
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    dot: 'bg-indigo-600',
  },
  'In Transit': {
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    dot: 'bg-blue-600',
  },
  'Out for Delivery': {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-300',
    dot: 'bg-[#F59E0B]',
  },
  Delivered: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
    dot: 'bg-[#16845B]',
  },
  Cancelled: {
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
    dot: 'bg-[#C0392B]',
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
