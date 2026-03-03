"use client";

import { Leaf } from "lucide-react";

type LoadingVariant = "fullscreen" | "section" | "inline";
type LoadingTheme = "dark" | "light";

interface LoadingScreenProps {
  /** "fullscreen" fills the viewport, "section" fits within a panel, "inline" is compact */
  variant?: LoadingVariant;
  /** Color theme */
  theme?: LoadingTheme;
  /** Optional title shown below the animation */
  title?: string;
  /** Optional subtitle / hint text */
  subtitle?: string;
}

export default function LoadingScreen({
  variant = "fullscreen",
  theme = "dark",
  title,
  subtitle,
}: LoadingScreenProps) {
  const isDark = theme === "dark";

  const wrapperClass = {
    fullscreen: "fixed inset-0 z-50 flex flex-col items-center justify-center",
    section: "flex flex-col items-center justify-center py-16 px-4",
    inline: "flex flex-col items-center justify-center py-8 px-4",
  }[variant];

  const bg = isDark ? "bg-gray-950" : "bg-white";

  return (
    <div className={`${wrapperClass} ${variant === "fullscreen" ? bg : ""}`}>
      {/* Subtle radial glow behind the logo */}
      {variant === "fullscreen" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-72 h-72 rounded-full bg-violet-500/10 blur-3xl animate-pulse-slow" />
        </div>
      )}

      <div className="relative flex flex-col items-center gap-6 z-10">
        {/* Animated logo ring */}
        <div className="relative">
          {/* Outer rotating ring */}
          <div className="w-20 h-20 rounded-full border-[3px] border-transparent border-t-violet-400 border-r-violet-400/40 animate-spin-slow" />

          {/* Inner pulsing ring */}
          <div className="absolute inset-1 rounded-full border-[2px] border-transparent border-b-emerald-400 border-l-emerald-400/40 animate-spin-reverse" />

          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center animate-pulse-slow">
              <Leaf size={20} className="text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Dot loader */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${isDark ? "bg-violet-400" : "bg-violet-500"} animate-dot-bounce`}
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>

        {/* Text */}
        {(title || subtitle) && (
          <div className="text-center space-y-1.5 mt-1">
            {title && (
              <p className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-700"}`}>
                {title}
              </p>
            )}
            {subtitle && (
              <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Compact spinner for inline use inside buttons or small areas */
export function LoadingSpinner({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
