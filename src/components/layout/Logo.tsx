import React from "react";

export function Logo({ className = "h-10", showText = true, darkText = false }: { className?: string, showText?: boolean, darkText?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img src="/sportwell-logo.svg" alt="SportWell Logo" className="h-full w-auto drop-shadow-md rounded-xl" />
      {showText && (
        <span className={`text-2xl md:text-3xl font-black tracking-tight ${darkText ? "text-brand-navy" : "text-white"}`}>
          Sport<span className="text-brand-cyan">Well</span>
        </span>
      )}
    </div>
  );
}
