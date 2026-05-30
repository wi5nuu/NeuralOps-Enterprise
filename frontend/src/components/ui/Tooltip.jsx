import React from 'react';

function Tooltip({ text, children }) {
  return (
    <div className="group relative inline-flex">
      {children}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-[#13151C] px-2 py-1 text-xs text-gray-300 opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100" style={{ transitionDelay: '500ms' }}>
        {text}
        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[#13151C]" />
      </div>
    </div>
  );
}

export { Tooltip };
