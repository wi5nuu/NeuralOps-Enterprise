import React from "react";

export function Tabs({ tabs, activeTab, onChange, className = "" }) {
  return (
    <div className={`flex gap-1 border-b border-gray-800 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
            activeTab === tab.key
              ? "text-indigo-400 border-indigo-500"
              : "text-gray-500 border-transparent hover:text-gray-300"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
