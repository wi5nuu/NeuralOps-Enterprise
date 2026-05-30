import React from 'react';
import { useLocation } from 'react-router-dom';

export default function BreadCrumb() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);

  return (
    <nav className="flex items-center space-x-2 text-sm">
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        const label = segment.charAt(0).toUpperCase() + segment.slice(1);
        return (
          <React.Fragment key={segment}>
            {index > 0 && <span className="text-gray-600">/</span>}
            <span className={isLast ? 'text-white font-medium' : 'text-gray-400'}>
              {label}
            </span>
          </React.Fragment>
        );
      })}
    </nav>
  );
}
