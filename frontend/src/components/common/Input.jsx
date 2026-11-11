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
          className="block text-xs font-bold text-[#142B45] mb-1.5"
        >
          {label} {required && <span className="text-[#DC5353]">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#718096]">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          className={`w-full h-11 px-3.5 ${
            Icon ? 'pl-10' : ''
          } rounded-xl border text-sm text-[#182433] bg-white placeholder-[#718096]/60 transition duration-150 focus:outline-none ${
            error
              ? 'border-[#DC5353] focus:border-[#DC5353] focus:ring-2 focus:ring-[#DC5353]/15'
              : 'border-[#E2E8F0] focus:border-[#18A6A0] focus:ring-2 focus:ring-[#18A6A0]/15'
          } ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-[#DC5353] font-medium">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-[11px] text-[#718096]">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
