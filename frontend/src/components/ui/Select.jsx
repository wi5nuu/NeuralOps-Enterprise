import React from "react";

export function Select({ label, options, error, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-gray-300">{label}</label>}
      <select
        className={`w-full bg-[#1A1D2E] border ${error ? "border-red-500" : "border-gray-700"} rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-indigo-500 transition-colors`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
