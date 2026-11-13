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
          className="block text-xs font-bold text-[#202020] mb-1.5"
        >
          {label} {required && <span className="text-[#E45B54]">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full h-11 px-3.5 rounded-xl border text-sm text-[#202020] bg-white transition duration-150 focus:outline-none cursor-pointer ${
          error
            ? 'border-[#E45B54] focus:border-[#E45B54] focus:ring-2 focus:ring-[#E45B54]/15'
            : 'border-[#DEDCD8] focus:border-[#FF7547] focus:ring-2 focus:ring-[#FF7547]/15'
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
      {error && <p className="mt-1.5 text-xs text-[#E45B54] font-medium">{error}</p>}
    </div>
  );
};

export default Select;
