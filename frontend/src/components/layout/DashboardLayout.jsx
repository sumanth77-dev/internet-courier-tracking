import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import { X } from 'lucide-react';

const DashboardLayout = ({ children, title }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F0F3F7] text-[#142B45] flex flex-col lg:flex-row antialiased">
      {/* Desktop Sticky Sidebar (Hidden on Mobile/Tablet < 1024px) */}
      <div className="hidden lg:block h-screen sticky top-0 shrink-0 z-40 w-64 bg-[#0B1F33] border-r border-[#176B87]/30">
        <Sidebar />
      </div>

      {/* Mobile/Tablet Off-Canvas Drawer Backdrop and Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex" role="dialog" aria-modal="true">
          {/* Smooth Backdrop */}
          <div
            className="fixed inset-0 bg-[#0B1F33]/70 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close menu backdrop"
          />

          {/* Drawer Panel */}
          <div className="relative z-10 w-72 max-w-[85vw] h-full bg-[#0B1F33] flex flex-col shadow-2xl border-r border-[#176B87]/40 animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-4 right-3.5 p-1.5 rounded-lg text-[#A8BACB] hover:text-white hover:bg-[#123B5D] transition cursor-pointer"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
            <Sidebar onClose={() => setMobileSidebarOpen(false)} isDrawer={true} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <TopNavbar
          title={title}
          onOpenSidebar={() => setMobileSidebarOpen(true)}
        />
        <main className="flex-1 p-3.5 sm:p-5 lg:p-7 max-w-7xl w-full mx-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
