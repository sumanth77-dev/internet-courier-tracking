import React from 'react';

const Select = ({
  label,
  error,
  options = [],
  className = '',
  id,
  required,
  children,
  ...props
}) => {
  const selectId = id || props.name || Math.random().toString(36).substring(2, 9);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-bold text-[#142B45] mb-1.5"
        >
          {label} {required && <span className="text-[#DC5353]">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full h-11 px-3.5 rounded-xl border text-sm text-[#182433] bg-white transition duration-150 focus:outline-none cursor-pointer ${
          error
            ? 'border-[#DC5353] focus:border-[#DC5353] focus:ring-2 focus:ring-[#DC5353]/15'
            : 'border-[#E2E8F0] focus:border-[#18A6A0] focus:ring-2 focus:ring-[#18A6A0]/15'
        } ${className}`}
        {...props}
      >
        {children ||
          options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
      </select>
      {error && <p className="mt-1.5 text-xs text-[#DC5353] font-medium">{error}</p>}
    </div>
  );
};

export default Select;
