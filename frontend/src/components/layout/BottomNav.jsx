import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Beaker, Database, BarChart3, Settings } from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dash', path: '/app/dashboard' },
  { icon: Beaker, label: 'Exp', path: '/app/experiments' },
  { icon: Database, label: 'RAG', path: '/app/rag' },
  { icon: BarChart3, label: 'Analytics', path: '/app/analytics' },
  { icon: Settings, label: 'Set', path: '/app/settings' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#13151C] border-t border-gray-800 flex items-center justify-around z-50 lg:hidden">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full h-full transition-colors ${
              isActive ? 'text-indigo-400' : 'text-gray-500'
            }`
          }
        >
          <item.icon size={22} />
          <span className="text-[10px] mt-1 font-medium">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
