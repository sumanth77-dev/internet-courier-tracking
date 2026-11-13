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
          className="block text-xs font-bold text-[#202020] mb-1.5"
        >
          {label} {required && <span className="text-[#E45B54]">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#777777]">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          className={`w-full h-11 px-3.5 ${
            Icon ? 'pl-10' : ''
          } rounded-xl border text-sm text-[#202020] bg-white placeholder-[#A7A7A7] transition duration-150 focus:outline-none ${
            error
              ? 'border-[#E45B54] focus:border-[#E45B54] focus:ring-2 focus:ring-[#E45B54]/15'
              : 'border-[#DEDCD8] focus:border-[#FF7547] focus:ring-2 focus:ring-[#FF7547]/15'
          } ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-[#E45B54] font-medium">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-[11px] text-[#777777]">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
