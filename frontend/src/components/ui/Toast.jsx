import React from 'react';

function Toast({ message, type = 'info', onClose }) {
  const bgMap = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-[#13151C]',
    warning: 'bg-yellow-600',
  };

  const iconMap = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };

  return (
    <div className={`flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg ${bgMap[type] || bgMap.info} border border-gray-700`}>
      <span className="text-sm text-white">{iconMap[type] || iconMap.info}</span>
      <span className="text-sm text-gray-200">{message}</span>
      {onClose && (
        <button onClick={onClose} className="ml-auto text-sm text-gray-400 hover:text-white">
          ✕
        </button>
      )}
    </div>
  );
}

export { Toast };
