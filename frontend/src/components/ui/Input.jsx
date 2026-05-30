import React from "react";

export function Input({ label, error, icon: Icon, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-gray-300">{label}</label>}
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />}
        <input
          className={`w-full bg-[#1A1D2E] border ${error ? "border-red-500" : "border-gray-700"} rounded-lg px-3 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors ${Icon ? "pl-10" : ""}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
