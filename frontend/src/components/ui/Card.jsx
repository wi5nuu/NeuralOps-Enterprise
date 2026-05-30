import React from "react";

export function Card({ children, className = "", hover = false, ...props }) {
  return (
    <div
      className={`bg-[#13151C] border border-gray-800 rounded-xl p-6 ${hover ? "hover:border-gray-700 transition-colors" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
