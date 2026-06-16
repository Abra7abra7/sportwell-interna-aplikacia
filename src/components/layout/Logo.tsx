import React from "react";

export function Logo({ className = "h-10", showText = true, darkText = false }: { className?: string, showText?: boolean, darkText?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg viewBox="0 0 48 48" className="h-full w-auto drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" rx="14" fill="#00F0FF" fillOpacity="0.15"/>
        <rect x="6" y="6" width="36" height="36" rx="10" fill="url(#paint0_linear)"/>
        <path d="M12 24 L18 24 L22 14 L28 34 L32 24 L36 24" stroke="#020C1B" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
        <defs>
          <linearGradient id="paint0_linear" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00F0FF" />
            <stop offset="1" stopColor="#00A2D3" />
          </linearGradient>
        </defs>
      </svg>
      {showText && (
        <span className={`text-2xl md:text-3xl font-black tracking-tight ${darkText ? "text-brand-navy" : "text-white"}`}>
          Sport<span className="text-brand-cyan">Well</span>
        </span>
      )}
    </div>
  );
}
