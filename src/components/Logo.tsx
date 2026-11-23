import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', showText = true }) => {
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
        <rect width="32" height="32" rx="8" fill="#14141B" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" />
        <path
          d="M10 9V23M10 16L17.5 9M13.5 12.8L22 23"
          stroke="#FFFFFF"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="22" cy="10.5" r="2" fill="#A855F7" />
      </svg>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className="font-display text-[15px] font-bold tracking-[0.14em] text-white">
            KORE
          </span>
          <span className="text-[9px] font-medium tracking-[0.26em] text-zinc-400 uppercase mt-0.5">
            STUDIO
          </span>
        </div>
      )}
    </div>
  );
};
