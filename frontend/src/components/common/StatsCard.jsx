import React from 'react';

/**
 * Deep Ocean Official KPI Metric Card for SkyRoute.
 * Uses solid dark rich colors as strictly specified:
 * - Total Shipments: Background #123B5D, Icon bg #176B87, Text #FFFFFF
 * - Pending: Background #754817, Icon bg #A76A20, Text #FFFFFF
 * - In Transit: Background #006B70, Icon bg #008F95, Text #FFFFFF
 * - Delivered: Background #145C47, Icon bg #167A56, Text #FFFFFF
 * - Assigned (Admin/Courier): Background #3B2C66, Icon bg #543F8C, Text #FFFFFF
 * - Border radius: 18px (rounded-[18px])
 */
const COLOR_CONFIG = {
  // Total Shipments / Deep Ocean
  navy: {
    bg: 'bg-[#123B5D]',
    border: 'border-[#176B87]',
    borderHover: 'hover:border-[#00A6A6]',
    iconBg: 'bg-[#176B87]',
    iconColor: 'text-white',
    valueColor: 'text-white',
    titleColor: 'text-[#DCE5EC]',
    subtitleColor: 'text-[#B6C7D6]',
  },
  total: {
    bg: 'bg-[#123B5D]',
    border: 'border-[#176B87]',
    borderHover: 'hover:border-[#00A6A6]',
    iconBg: 'bg-[#176B87]',
    iconColor: 'text-white',
    valueColor: 'text-white',
    titleColor: 'text-[#DCE5EC]',
    subtitleColor: 'text-[#B6C7D6]',
  },
  softBlue: {
    bg: 'bg-[#123B5D]',
    border: 'border-[#176B87]',
    borderHover: 'hover:border-[#00A6A6]',
    iconBg: 'bg-[#176B87]',
    iconColor: 'text-white',
    valueColor: 'text-white',
    titleColor: 'text-[#DCE5EC]',
    subtitleColor: 'text-[#B6C7D6]',
  },
  blue: {
    bg: 'bg-[#123B5D]',
    border: 'border-[#176B87]',
    borderHover: 'hover:border-[#00A6A6]',
    iconBg: 'bg-[#176B87]',
    iconColor: 'text-white',
    valueColor: 'text-white',
    titleColor: 'text-[#DCE5EC]',
    subtitleColor: 'text-[#B6C7D6]',
  },

  // Pending / Rich Amber
  amber: {
    bg: 'bg-[#754817]',
    border: 'border-[#8F591E]',
    borderHover: 'hover:border-[#D99024]',
    iconBg: 'bg-[#A76A20]',
    iconColor: 'text-white',
    valueColor: 'text-white',
    titleColor: 'text-[#FDE68A]',
    subtitleColor: 'text-[#FEF3C7]',
  },
  pending: {
    bg: 'bg-[#754817]',
    border: 'border-[#8F591E]',
    borderHover: 'hover:border-[#D99024]',
    iconBg: 'bg-[#A76A20]',
    iconColor: 'text-white',
    valueColor: 'text-white',
    titleColor: 'text-[#FDE68A]',
    subtitleColor: 'text-[#FEF3C7]',
  },
  warmCream: {
    bg: 'bg-[#754817]',
    border: 'border-[#8F591E]',
    borderHover: 'hover:border-[#D99024]',
    iconBg: 'bg-[#A76A20]',
    iconColor: 'text-white',
    valueColor: 'text-white',
    titleColor: 'text-[#FDE68A]',
    subtitleColor: 'text-[#FEF3C7]',
  },

  // In Transit / Active / Deep Teal
  teal: {
    bg: 'bg-[#006B70]',
    border: 'border-[#008F95]',
    borderHover: 'hover:border-[#00A6A6]',
    iconBg: 'bg-[#008F95]',
    iconColor: 'text-white',
    valueColor: 'text-white',
    titleColor: 'text-[#A7F3D0]',
    subtitleColor: 'text-[#CCFBF1]',
  },
  inTransit: {
    bg: 'bg-[#006B70]',
    border: 'border-[#008F95]',
    borderHover: 'hover:border-[#00A6A6]',
    iconBg: 'bg-[#008F95]',
    iconColor: 'text-white',
    valueColor: 'text-white',
    titleColor: 'text-[#A7F3D0]',
    subtitleColor: 'text-[#CCFBF1]',
  },
  paleCyan: {
    bg: 'bg-[#006B70]',
    border: 'border-[#008F95]',
    borderHover: 'hover:border-[#00A6A6]',
    iconBg: 'bg-[#008F95]',
    iconColor: 'text-white',
    valueColor: 'text-white',
    titleColor: 'text-[#A7F3D0]',
    subtitleColor: 'text-[#CCFBF1]',
  },
  cyan: {
    bg: 'bg-[#006B70]',
    border: 'border-[#008F95]',
    borderHover: 'hover:border-[#00A6A6]',
    iconBg: 'bg-[#008F95]',
    iconColor: 'text-white',
    valueColor: 'text-white',
    titleColor: 'text-[#A7F3D0]',
    subtitleColor: 'text-[#CCFBF1]',
  },

  // Delivered / Completed / Rich Emerald Green
  green: {
    bg: 'bg-[#145C47]',
    border: 'border-[#167A56]',
    borderHover: 'hover:border-[#34D399]',
    iconBg: 'bg-[#167A56]',
    iconColor: 'text-white',
    valueColor: 'text-white',
    titleColor: 'text-[#A7F3D0]',
    subtitleColor: 'text-[#D1FAE5]',
  },
  delivered: {
    bg: 'bg-[#145C47]',
    border: 'border-[#167A56]',
    borderHover: 'hover:border-[#34D399]',
    iconBg: 'bg-[#167A56]',
    iconColor: 'text-white',
    valueColor: 'text-white',
    titleColor: 'text-[#A7F3D0]',
    subtitleColor: 'text-[#D1FAE5]',
  },
  softMint: {
    bg: 'bg-[#145C47]',
    border: 'border-[#167A56]',
    borderHover: 'hover:border-[#34D399]',
    iconBg: 'bg-[#167A56]',
    iconColor: 'text-white',
    valueColor: 'text-white',
    titleColor: 'text-[#A7F3D0]',
    subtitleColor: 'text-[#D1FAE5]',
  },

  // Assigned / Rich Purple-Lavender
  lavender: {
    bg: 'bg-[#3B2C66]',
    border: 'border-[#543F8C]',
    borderHover: 'hover:border-[#A78BFA]',
    iconBg: 'bg-[#543F8C]',
    iconColor: 'text-white',
    valueColor: 'text-white',
    titleColor: 'text-[#DDD6FE]',
    subtitleColor: 'text-[#EDE9FE]',
  },
  assigned: {
    bg: 'bg-[#3B2C66]',
    border: 'border-[#543F8C]',
    borderHover: 'hover:border-[#A78BFA]',
    iconBg: 'bg-[#543F8C]',
    iconColor: 'text-white',
    valueColor: 'text-white',
    titleColor: 'text-[#DDD6FE]',
    subtitleColor: 'text-[#EDE9FE]',
  },
  softLavender: {
    bg: 'bg-[#3B2C66]',
    border: 'border-[#543F8C]',
    borderHover: 'hover:border-[#A78BFA]',
    iconBg: 'bg-[#543F8C]',
    iconColor: 'text-white',
    valueColor: 'text-white',
    titleColor: 'text-[#DDD6FE]',
    subtitleColor: 'text-[#EDE9FE]',
  },

  // Cancelled / Issue / Crimson Red
  rose: {
    bg: 'bg-[#7A2222]',
    border: 'border-[#992E2E]',
    borderHover: 'hover:border-[#F87171]',
    iconBg: 'bg-[#992E2E]',
    iconColor: 'text-white',
    valueColor: 'text-white',
    titleColor: 'text-[#FECACA]',
    subtitleColor: 'text-[#FEE2E2]',
  },
};

const StatsCard = ({
  title,
  value,
  icon: Icon,
  color = 'navy',
  subtitle,
  onClick,
  className = '',
}) => {
  const style = COLOR_CONFIG[color] || COLOR_CONFIG.navy;

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
