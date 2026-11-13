import React from 'react';

const Button = ({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'dark' | 'accent' | 'danger' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-bold rounded-xl transition duration-150 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer select-none';

  const variants = {
    primary: 'bg-[#FF7547] hover:bg-[#F06438] text-white shadow-xs',
    accent: 'bg-[#FF7547] hover:bg-[#F06438] text-white shadow-xs',
    teal: 'bg-[#FF7547] hover:bg-[#F06438] text-white shadow-xs',
    dark: 'bg-[#171717] hover:bg-[#242424] text-white border border-[#303030] shadow-xs',
    charcoal: 'bg-[#242424] hover:bg-[#303030] text-white border border-[#383838] shadow-xs',
    secondary: 'bg-white hover:bg-[#E9E7E4] text-[#202020] border border-[#DEDCD8] shadow-xs',
    danger: 'bg-[#E45B54] hover:bg-[#C74740] text-white shadow-xs',
    ghost: 'text-[#777777] hover:text-[#202020] hover:bg-[#E9E7E4]',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs gap-1.5',
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
