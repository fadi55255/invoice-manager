import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex bg-[#F5F5F7]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-[#E5E7EB] px-6 flex items-center justify-between lg:justify-end">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 text-[#171717] hover:bg-[#F5F5F7] rounded-[8px]"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-3">
            <span className="text-[12px] font-medium px-2.5 py-1 rounded-[6px] bg-[#EDECFC] text-[#897DF9]">
              {user?.role || 'Admin'}
            </span>
            <span className="text-[14px] font-medium text-[#171717]">
              {user?.email}
            </span>
          </div>
        </header>

        {/* Main Content Area (24px–28px padding per design system) */}
        <main className="flex-1 p-6 lg:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}