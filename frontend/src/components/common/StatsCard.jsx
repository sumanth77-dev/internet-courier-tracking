import React from 'react';

const StatsCard = ({ title, value, icon: Icon, color = 'navy', subtitle }) => {
  const colorStyles = {
    navy: {
      bg: 'bg-[#172033]/5',
      text: 'text-[#172033]',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-[#D97706]',
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
    },
    green: {
      bg: 'bg-emerald-50',
      text: 'text-[#15803D]',
    },
  };

  const style = colorStyles[color] || colorStyles.navy;

  return (
    <div className="bg-white rounded-xl border border-[#D9DEE5] p-5 shadow-xs transition hover:border-[#172033]/30">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div
            className={`w-9 h-9 rounded-lg ${style.bg} ${style.text} flex items-center justify-center`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold text-[#172033] tracking-tight">
          {value}
        </span>
      </div>
      {subtitle && (
        <p className="mt-1 text-[11px] text-[#667085] font-medium">{subtitle}</p>
      )}
    </div>
  );
};

export default StatsCard;
