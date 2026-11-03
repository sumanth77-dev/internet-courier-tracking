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
          className="block text-xs font-semibold text-[#17243A] mb-1"
        >
          {label} {required && <span className="text-[#C0392B]">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full h-10 px-3 rounded-lg border text-sm text-[#17243A] bg-white transition focus:outline-none ${
          error
            ? 'border-[#C0392B] focus:border-[#C0392B] focus:ring-1 focus:ring-[#C0392B]'
            : 'border-[#E1E7EF] focus:border-[#17243A] focus:ring-1 focus:ring-[#17243A]'
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
      {error && <p className="mt-1 text-xs text-[#C0392B] font-medium">{error}</p>}
    </div>
  );
};

export default Select;
