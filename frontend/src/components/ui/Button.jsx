import React from "react";

const variants = {
  primary: "bg-indigo-500 hover:bg-indigo-600 text-white",
  secondary: "bg-[#1E2130] hover:bg-[#2A2D3E] text-gray-200 border border-gray-700",
  danger: "bg-red-500 hover:bg-red-600 text-white",
  ghost: "bg-transparent hover:bg-[#1E2130] text-gray-300",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({ children, variant = "primary", size = "md", className = "", disabled, onClick, type = "button", ...props }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
