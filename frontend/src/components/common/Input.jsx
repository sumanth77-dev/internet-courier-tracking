import React from 'react';

const Input = ({
  label,
  error,
  helperText,
  icon: Icon,
  className = '',
  id,
  required,
  ...props
}) => {
  const inputId = id || props.name || Math.random().toString(36).substring(2, 9);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-[#172033] mb-1"
        >
          {label} {required && <span className="text-[#B91C1C]">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#667085]">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          className={`w-full h-10 px-3.5 ${
            Icon ? 'pl-9' : ''
          } rounded-lg border text-sm text-[#172033] bg-white placeholder-[#667085]/60 transition focus:outline-none ${
            error
              ? 'border-[#B91C1C] focus:border-[#B91C1C] focus:ring-1 focus:ring-[#B91C1C]'
              : 'border-[#D9DEE5] focus:border-[#172033] focus:ring-1 focus:ring-[#172033]'
          } ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-[#B91C1C] font-medium">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-[11px] text-[#667085]">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
