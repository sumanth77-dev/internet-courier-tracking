import React from 'react';

/**
 * Official SkyRoute Brand Logo Component — Deep Ocean Edition
 * Incorporates brand colors:
 * - Midnight Navy: #0B1F33
 * - Deep Ocean: #123B5D
 * - Bright Teal: #00A6A6
 * - Ocean Blue: #176B87
 * - Cool Silver: #DCE5EC
 */
export const BrandLogo = ({
  size = 'md',
  showTagline = false,
  theme = 'dark', // 'dark' = dark text for light surface, 'light' = white text on dark surface
  taglineText = 'Every Delivery. Every Mile. In Sight.',
  className = '',
}) => {
  const isLight = theme === 'light';

  // Dimension mapping
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Brand Icon Badge */}
      <div
        className={`${iconSizes[size] || iconSizes.md} rounded-xl bg-[#0B1F33] border border-[#176B87]/50 flex items-center justify-center shrink-0 shadow-xs relative overflow-hidden`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-5/6 h-5/6"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background Route Trajectory */}
          <path
            d="M3 18 C7 18 10 13 14 13 C18 13 19 7 21 6"
            stroke="#176B87"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeDasharray="2 2"
          />
          {/* Dynamic SkyRoute Arrow Shape */}
          <path
            d="M5 16 L20 6 L15 20 L12 14 L5 16 Z"
            fill="#00A6A6"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {/* Live Delivery Node Marker */}
          <circle cx="20" cy="6" r="2" fill="#FFFFFF" />
          <circle cx="20" cy="6" r="1" fill="#00A6A6" />
        </svg>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={`font-black tracking-tight ${textSizes[size] || textSizes.md} ${
              isLight ? 'text-white' : 'text-[#142B45]'
            }`}
          >
            Sky<span className="text-[#00A6A6]">Route</span>
          </span>
        </div>

        {showTagline && (
          <span
            className={`text-[10px] font-medium tracking-tight mt-0.5 ${
              isLight ? 'text-[#DCE5EC]' : 'text-[#607487]'
            }`}
          >
            {taglineText}
          </span>
        )}
      </div>
    </div>
  );
};

export default BrandLogo;
