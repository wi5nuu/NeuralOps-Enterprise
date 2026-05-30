import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import { useUIStore } from '../../stores/uiStore';

export default function Layout() {
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen]);

  return (
    <div className="min-h-screen bg-[#0A0B0F]">
      <Sidebar />
      <TopBar />
      <BottomNav />
      {/* Mobile overlay */}
      {sidebarOpen && window.innerWidth < 1024 && (
        <div 
          className="fixed inset-0 bg-black/50 z-20" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <main
        className="pt-16 pb-16 lg:pb-0 transition-all duration-300 ease-in-out"
        style={{ marginLeft: window.innerWidth >= 1024 ? (sidebarOpen ? 240 : 64) : 0 }}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
