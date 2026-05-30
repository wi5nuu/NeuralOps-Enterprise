import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Menu, Bell } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { getUnreadCount } from '../../api/notifications';
import BreadCrumb from './BreadCrumb';

export default function TopBar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);
  
  const { data } = useQuery({
    queryKey: ['unread-notifications'],
    queryFn: getUnreadCount,
    refetchInterval: 10000,
  });
  
  const unreadCount = data?.count ?? 0;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[#13151C] border-b border-gray-800 flex items-center justify-between px-4 lg:px-6 z-20 transition-all duration-300 ease-in-out"
      style={{ paddingLeft: window.innerWidth >= 1024 ? (sidebarOpen ? 240 : 64) : 16 }}
    >
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-md hover:bg-gray-800"
        >
          <Menu size={22} />
        </button>
        <BreadCrumb />
      </div>

      <div className="flex items-center space-x-4">
        <button className="relative text-gray-400 hover:text-white transition-colors p-1.5 rounded-md hover:bg-gray-800">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
              {unreadCount}
            </span>
          )}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-gray-800"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </button>

          {showDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
              <div className="absolute right-0 top-10 w-48 bg-[#13151C] border border-gray-800 rounded-lg shadow-xl z-20 py-2">
                <div className="px-4 py-2 border-b border-gray-800">
                  <p className="text-sm text-white font-medium">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500">{user?.email || ''}</p>
                </div>
                <button
                  onClick={() => { logout(); setShowDropdown(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 transition-colors"
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
