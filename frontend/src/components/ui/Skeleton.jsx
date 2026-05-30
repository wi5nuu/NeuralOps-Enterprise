import React from 'react';

function Skeleton({ width, height, className = '' }) {
  return (
    <div
      className={`animate-pulse rounded bg-[#13151C] ${className}`}
      style={{ width: width || '100%', height: height || '1rem' }}
    />
  );
}

export { Skeleton };
