import React from 'react';

function CodeEditor({ value, onChange, language = 'plaintext', height = '300px', readOnly = false }) {
  return (
    <div className="relative w-full overflow-hidden rounded border border-gray-800" style={{ height }}>
      <div className="pointer-events-none absolute left-0 top-0 flex select-none flex-col px-3 py-4 text-right text-sm leading-6 text-gray-600 font-mono">
        {Array.from({ length: (value || '').split('\n').length }, (_, i) => (
          <span key={i}>{i + 1}</span>
        ))}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
        spellCheck={false}
        className="h-full w-full resize-none bg-[#0A0B0F] pl-12 pr-4 py-4 font-mono text-sm leading-6 text-gray-200 outline-none"
        style={{ caretColor: '#6366F1', tabSize: 2 }}
      />
    </div>
  );
}

export { CodeEditor };
