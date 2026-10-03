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
          className="block text-xs font-semibold text-[#172033] mb-1"
        >
          {label} {required && <span className="text-[#B91C1C]">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full h-10 px-3 rounded-lg border text-sm text-[#172033] bg-white transition focus:outline-none ${
          error
            ? 'border-[#B91C1C] focus:border-[#B91C1C] focus:ring-1 focus:ring-[#B91C1C]'
            : 'border-[#D9DEE5] focus:border-[#172033] focus:ring-1 focus:ring-[#172033]'
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
      {error && <p className="mt-1 text-xs text-[#B91C1C] font-medium">{error}</p>}
    </div>
  );
};

export default Select;
