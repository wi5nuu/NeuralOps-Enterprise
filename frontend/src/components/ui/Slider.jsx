import React from 'react';

function Slider({ label, min = 0, max = 100, step = 1, value, onChange }) {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-2 block text-sm text-gray-400">{label}</label>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange?.(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#13151C] outline-none"
        style={{
          accentColor: '#6366F1',
        }}
      />
      <style>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #6366F1;
          cursor: pointer;
          border: 2px solid #0A0B0F;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        input[type='range']::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #6366F1;
          cursor: pointer;
          border: 2px solid #0A0B0F;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
}

export { Slider };
