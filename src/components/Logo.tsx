import React from 'react';

interface LogoProps {
  isDark?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ isDark = false, className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <svg
        width="30"
        height="30"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <rect
          width="32"
          height="32"
          rx="8"
          fill={isDark ? '#FFFFFF' : '#0A0A0A'}
        />
        <path
          d="M9.5 10.5H22.5L10.5 21.5H22.5"
          stroke={isDark ? '#0A0A0A' : '#FFFFFF'}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex flex-col leading-none">
        <span
          className={`font-display text-[16px] font-bold tracking-[0.06em] ${
            isDark ? 'text-white' : 'text-[#0A0A0A]'
          }`}
        >
          ZoneStore
        </span>
      </div>
    </div>
  );
};
