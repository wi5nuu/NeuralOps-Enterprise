import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Database,
  Beaker,
  Activity,
  BookOpen,
  CheckSquare,
  FolderOpen,
  BrainCircuit,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/app/dashboard' },
  { icon: MessageSquare, label: 'Playground', path: '/app/playground' },
  { icon: Database, label: 'RAG', path: '/app/rag' },
  { icon: Beaker, label: 'Experiments', path: '/app/experiments' },
  { icon: Activity, label: 'Monitor', path: '/app/monitor' },
  { icon: BookOpen, label: 'Registry', path: '/app/registry' },
  { icon: CheckSquare, label: 'Tasks', path: '/app/tasks' },
  { icon: FolderOpen, label: 'Datasets', path: '/app/datasets' },
  { icon: BrainCircuit, label: 'Evaluations', path: '/app/evaluations' },
  { icon: BarChart3, label: 'Analytics', path: '/app/analytics' },
  { icon: Settings, label: 'Settings', path: '/app/settings' },
];

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-[#13151C] border-r border-gray-800 flex flex-col z-30 transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0 w-[240px]' : '-translate-x-full lg:translate-x-0 lg:w-[64px]'
      }`}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
        {sidebarOpen && (
          <span className="text-white font-bold text-lg tracking-wide">NeuralOps</span>
        )}
        <button
          onClick={toggleSidebar}
          className="text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-gray-800"
        >
          {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      <nav className="flex-1 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center h-11 mx-2 px-3 rounded-lg transition-colors group ${
                isActive
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              } ${!sidebarOpen && 'justify-center'}`
            }
          >
            <item.icon size={20} className="shrink-0" />
            {sidebarOpen && <span className="ml-3 text-sm font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-800 p-4">
        {sidebarOpen ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-white font-medium truncate max-w-[120px]">
                  {user?.name || 'User'}
                </span>
                <span className="text-xs text-gray-500 truncate max-w-[120px]">
                  {user?.email || ''}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              className="text-gray-400 hover:text-red-400 transition-colors p-1 rounded-md hover:bg-gray-800"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <button
              onClick={logout}
              className="text-gray-400 hover:text-red-400 transition-colors p-1 rounded-md hover:bg-gray-800"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
