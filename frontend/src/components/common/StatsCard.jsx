import React from 'react';

const StatsCard = ({ title, value, icon: Icon, color = 'navy', subtitle }) => {
  const colorStyles = {
    navy: {
      bg: 'bg-[#17243A]/10',
      text: 'text-[#17243A]',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-[#F59E0B]',
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
    },
    green: {
      bg: 'bg-emerald-50',
      text: 'text-[#16845B]',
    },
  };

  const style = colorStyles[color] || colorStyles.navy;

  return (
    <div className="bg-white rounded-xl border border-[#E1E7EF] p-4 sm:p-5 shadow-xs transition hover:border-[#17243A]/30">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[#65748B] uppercase tracking-wider truncate">
          {title}
        </span>
        {Icon && (
          <div
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg ${style.bg} ${style.text} flex items-center justify-center shrink-0`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#17243A] tracking-tight">
          {value}
        </span>
      </div>
      {subtitle && (
        <p className="mt-1 text-[11px] text-[#65748B] font-medium truncate">{subtitle}</p>
      )}
    </div>
  );
};

export default StatsCard;
