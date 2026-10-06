import React from 'react';

export interface FixifyLogoProps {
  className?: string;
  size?: number;
  collapsed?: boolean;
}

export const FixifyLogo: React.FC<FixifyLogoProps> = ({
  className = '',
  size = 32,
  collapsed = false,
}) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* SVG Monogram Mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200"
        aria-hidden="true"
      >
        <rect
          width="32"
          height="32"
          rx="8"
          className="fill-primary transition-colors"
        />
        {/* Stylized interconnected IT node / F letterform */}
        <path
          d="M9 8.5H23M9 15H19.5M9 8.5V23.5M9 15V23.5"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="23" cy="8.5" r="2" fill="#FFFFFF" />
        <circle cx="19.5" cy="15" r="2" fill="#FFFFFF" />
        <circle cx="9" cy="23.5" r="2" fill="#FFFFFF" />
      </svg>

      {/* Wordmark */}
      {!collapsed && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base tracking-tight text-foreground font-sans">
              Fixify
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
              LABS
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground tracking-tight mt-0.5">
            IT Asset & Maintenance
          </span>
        </div>
      )}
    </div>
  );
};

export default FixifyLogo;
