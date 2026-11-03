import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'No records found',
  description = 'There are no items to display at this moment.',
  actionText,
  actionLink,
  onAction,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-[#E1E7EF] p-10 text-center flex flex-col items-center justify-center shadow-xs">
      <div className="w-12 h-12 rounded-xl bg-[#17243A]/10 text-[#17243A] flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-[#F59E0B]" />
      </div>
      <h3 className="text-base font-bold text-[#17243A] mb-1">{title}</h3>
      <p className="text-xs text-[#65748B] max-w-sm mb-5 leading-relaxed">
        {description}
      </p>

      {actionText && actionLink && (
        <Link
          to={actionLink}
          className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-[#17243A] hover:bg-[#24364B] rounded-lg shadow-xs transition cursor-pointer"
        >
          {actionText}
        </Link>
      )}

      {actionText && onAction && !actionLink && (
        <button
          onClick={onAction}
          className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-[#17243A] hover:bg-[#24364B] rounded-lg shadow-xs transition cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
