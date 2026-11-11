import React from 'react';

const Button = ({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition duration-150 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer';

  const variants = {
    primary: 'bg-[#142B45] hover:bg-[#245B78] text-white shadow-xs',
    accent: 'bg-[#18A6A0] hover:bg-[#18A6A0]/90 text-white shadow-xs',
    teal: 'bg-[#18A6A0] hover:bg-[#18A6A0]/90 text-white shadow-xs',
    secondary: 'bg-white hover:bg-[#F5F7FA] text-[#142B45] border border-[#E1E7EF] shadow-xs',
    danger: 'bg-[#C0392B] hover:bg-[#991B1B] text-white shadow-xs',
    ghost: 'text-[#65748B] hover:text-[#142B45] hover:bg-[#F5F7FA]',
  };

  const sizes = {
    sm: 'h-8 px-2.5 text-xs gap-1.5',
    md: 'h-10 px-4 text-xs sm:text-sm gap-2',
    lg: 'h-12 px-5 text-sm sm:text-base gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading && (
        <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      )}
      {children}
    </button>
  );
};

export default Button;
