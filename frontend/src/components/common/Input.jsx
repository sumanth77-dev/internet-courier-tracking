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
          className="block text-xs font-semibold text-[#17243A] mb-1"
        >
          {label} {required && <span className="text-[#C0392B]">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#65748B]">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          className={`w-full h-10 px-3.5 ${
            Icon ? 'pl-9' : ''
          } rounded-lg border text-sm text-[#17243A] bg-white placeholder-[#65748B]/60 transition focus:outline-none ${
            error
              ? 'border-[#C0392B] focus:border-[#C0392B] focus:ring-1 focus:ring-[#C0392B]'
              : 'border-[#E1E7EF] focus:border-[#17243A] focus:ring-1 focus:ring-[#17243A]'
          } ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-[#C0392B] font-medium">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-[11px] text-[#65748B]">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
