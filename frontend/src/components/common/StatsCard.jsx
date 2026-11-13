import React from 'react';

/**
 * Modern Parcel Delivery KPI Metric Card for SkyRoute.
 * Designed with premium Charcoal background (#242424), elevated dark borders (#383838),
 * Coral Orange accents (#FF7547), and high-contrast typography.
 */
const COLOR_CONFIG = {
  // Total Shipments / Primary Accent
  total: {
    bg: 'bg-[#242424]',
    border: 'border-[#383838]',
    borderHover: 'hover:border-[#FF7547]',
    iconBg: 'bg-[#FF7547]',
    iconColor: 'text-white',
    valueColor: 'text-white',
    titleColor: 'text-[#C5C5C5]',
    subtitleColor: 'text-[#929292]',
  },
  navy: {
    bg: 'bg-[#242424]',
    border: 'border-[#383838]',
    borderHover: 'hover:border-[#FF7547]',
    iconBg: 'bg-[#FF7547]',
    iconColor: 'text-white',
    valueColor: 'text-white',
    titleColor: 'text-[#C5C5C5]',
    subtitleColor: 'text-[#929292]',
  },
  blue: {
    bg: 'bg-[#242424]',
    border: 'border-[#383838]',
    borderHover: 'hover:border-[#FF7547]',
    iconBg: 'bg-[#FF7547]',
    iconColor: 'text-white',
    valueColor: 'text-white',
    titleColor: 'text-[#C5C5C5]',
    subtitleColor: 'text-[#929292]',
  },
  softBlue: {
    bg: 'bg-[#242424]',
    border: 'border-[#383838]',
    borderHover: 'hover:border-[#FF7547]',
    iconBg: 'bg-[#FF7547]',
    iconColor: 'text-white',
    valueColor: 'text-white',
    titleColor: 'text-[#C5C5C5]',
    subtitleColor: 'text-[#929292]',
  },

  // Pending / Amber Warning
  pending: {
    bg: 'bg-[#242424]',
    border: 'border-[#383838]',
    borderHover: 'hover:border-[#E9A23B]',
    iconBg: 'bg-[#E9A23B]/15 border border-[#E9A23B]/30',
    iconColor: 'text-[#E9A23B]',
    valueColor: 'text-white',
    titleColor: 'text-[#C5C5C5]',
    subtitleColor: 'text-[#929292]',
  },
  amber: {
    bg: 'bg-[#242424]',
    border: 'border-[#383838]',
    borderHover: 'hover:border-[#E9A23B]',
    iconBg: 'bg-[#E9A23B]/15 border border-[#E9A23B]/30',
    iconColor: 'text-[#E9A23B]',
    valueColor: 'text-white',
    titleColor: 'text-[#C5C5C5]',
    subtitleColor: 'text-[#929292]',
  },
  warmCream: {
    bg: 'bg-[#242424]',
    border: 'border-[#383838]',
    borderHover: 'hover:border-[#E9A23B]',
    iconBg: 'bg-[#E9A23B]/15 border border-[#E9A23B]/30',
    iconColor: 'text-[#E9A23B]',
    valueColor: 'text-white',
    titleColor: 'text-[#C5C5C5]',
    subtitleColor: 'text-[#929292]',
  },

  // In Transit / Active / Coral Orange
  inTransit: {
    bg: 'bg-[#242424]',
    border: 'border-[#383838]',
    borderHover: 'hover:border-[#FF7547]',
    iconBg: 'bg-[#FF7547]/15 border border-[#FF7547]/30',
    iconColor: 'text-[#FF7547]',
    valueColor: 'text-white',
    titleColor: 'text-[#C5C5C5]',
    subtitleColor: 'text-[#929292]',
  },
  teal: {
    bg: 'bg-[#242424]',
    border: 'border-[#383838]',
    borderHover: 'hover:border-[#FF7547]',
    iconBg: 'bg-[#FF7547]/15 border border-[#FF7547]/30',
    iconColor: 'text-[#FF7547]',
    valueColor: 'text-white',
    titleColor: 'text-[#C5C5C5]',
    subtitleColor: 'text-[#929292]',
  },
  cyan: {
    bg: 'bg-[#242424]',
    border: 'border-[#383838]',
    borderHover: 'hover:border-[#FF7547]',
    iconBg: 'bg-[#FF7547]/15 border border-[#FF7547]/30',
    iconColor: 'text-[#FF7547]',
    valueColor: 'text-white',
    titleColor: 'text-[#C5C5C5]',
    subtitleColor: 'text-[#929292]',
  },
  paleCyan: {
    bg: 'bg-[#242424]',
    border: 'border-[#383838]',
    borderHover: 'hover:border-[#FF7547]',
    iconBg: 'bg-[#FF7547]/15 border border-[#FF7547]/30',
    iconColor: 'text-[#FF7547]',
    valueColor: 'text-white',
    titleColor: 'text-[#C5C5C5]',
    subtitleColor: 'text-[#929292]',
  },

  // Delivered / Completed / Emerald Success
  delivered: {
    bg: 'bg-[#242424]',
    border: 'border-[#383838]',
    borderHover: 'hover:border-[#36A879]',
    iconBg: 'bg-[#36A879]/15 border border-[#36A879]/30',
    iconColor: 'text-[#36A879]',
    valueColor: 'text-white',
    titleColor: 'text-[#C5C5C5]',
    subtitleColor: 'text-[#929292]',
  },
  green: {
    bg: 'bg-[#242424]',
    border: 'border-[#383838]',
    borderHover: 'hover:border-[#36A879]',
    iconBg: 'bg-[#36A879]/15 border border-[#36A879]/30',
    iconColor: 'text-[#36A879]',
    valueColor: 'text-white',
    titleColor: 'text-[#C5C5C5]',
    subtitleColor: 'text-[#929292]',
  },
  softMint: {
    bg: 'bg-[#242424]',
    border: 'border-[#383838]',
    borderHover: 'hover:border-[#36A879]',
    iconBg: 'bg-[#36A879]/15 border border-[#36A879]/30',
    iconColor: 'text-[#36A879]',
    valueColor: 'text-white',
    titleColor: 'text-[#C5C5C5]',
    subtitleColor: 'text-[#929292]',
  },

  // Assigned / Elevated Dark
  assigned: {
    bg: 'bg-[#242424]',
    border: 'border-[#383838]',
    borderHover: 'hover:border-[#C5C5C5]',
    iconBg: 'bg-[#303030] border border-[#414141]',
    iconColor: 'text-[#FFFFFF]',
    valueColor: 'text-white',
    titleColor: 'text-[#C5C5C5]',
    subtitleColor: 'text-[#929292]',
  },
  lavender: {
    bg: 'bg-[#242424]',
    border: 'border-[#383838]',
    borderHover: 'hover:border-[#C5C5C5]',
    iconBg: 'bg-[#303030] border border-[#414141]',
    iconColor: 'text-[#FFFFFF]',
    valueColor: 'text-white',
    titleColor: 'text-[#C5C5C5]',
    subtitleColor: 'text-[#929292]',
  },
  softLavender: {
    bg: 'bg-[#242424]',
    border: 'border-[#383838]',
    borderHover: 'hover:border-[#C5C5C5]',
    iconBg: 'bg-[#303030] border border-[#414141]',
    iconColor: 'text-[#FFFFFF]',
    valueColor: 'text-white',
    titleColor: 'text-[#C5C5C5]',
    subtitleColor: 'text-[#929292]',
  },

  // Cancelled / Issue / Crimson Error
  rose: {
    bg: 'bg-[#242424]',
    border: 'border-[#383838]',
    borderHover: 'hover:border-[#E45B54]',
    iconBg: 'bg-[#E45B54]/15 border border-[#E45B54]/30',
    iconColor: 'text-[#E45B54]',
    valueColor: 'text-white',
    titleColor: 'text-[#C5C5C5]',
    subtitleColor: 'text-[#929292]',
  },
};

const StatsCard = ({
  title,
  value,
  icon: Icon,
  color = 'total',
  subtitle,
  onClick,
  className = '',
}) => {
  const style = COLOR_CONFIG[color] || COLOR_CONFIG.total;

  return (
    <div
      onClick={onClick}
      className={`rounded-[18px] border ${style.bg} ${style.border} p-4 sm:p-5 shadow-sm transition-all duration-150 ${
        style.borderHover
      } ${onClick ? 'cursor-pointer hover:shadow-md' : ''} ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider truncate ${style.titleColor}`}>
          {title}
        </span>
        {Icon && (
          <div
            className={`w-9 h-9 rounded-xl ${style.iconBg} ${style.iconColor} flex items-center justify-center shrink-0 shadow-xs`}
          >
            <Icon className="w-4.5 h-4.5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className={`text-2xl sm:text-3xl font-black ${style.valueColor} tracking-tight`}>
          {value}
        </span>
      </div>

      {subtitle && (
        <p className={`mt-1.5 text-[11px] font-medium truncate ${style.subtitleColor}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default StatsCard;
