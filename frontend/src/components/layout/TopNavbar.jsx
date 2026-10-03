import React from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TopNavbar = ({ onOpenSidebar, title = 'Dashboard' }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-[#D9DEE5] px-5 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onOpenSidebar}
          className="p-1.5 -ml-1.5 rounded-lg text-[#667085] hover:text-[#172033] hover:bg-[#F4F6F8] lg:hidden cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-sm sm:text-base font-bold text-[#172033] leading-tight">
            {title}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#F4F6F8] border border-[#D9DEE5]">
          <span className="w-2 h-2 rounded-full bg-[#15803D]" />
          <span className="text-xs font-semibold text-[#172033] capitalize">
            {user?.role} Portal
          </span>
        </div>

        <div className="w-8 h-8 rounded-lg bg-[#172033] text-white flex items-center justify-center text-xs font-bold shadow-xs">
          {user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
