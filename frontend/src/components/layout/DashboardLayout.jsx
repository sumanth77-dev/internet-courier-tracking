import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

const DashboardLayout = ({ children, title }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Prevent background page from scrolling while drawer is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mobileSidebarOpen]);

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileSidebarOpen) {
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileSidebarOpen]);

  // Auto-close drawer if viewport resized to desktop (>= 1024px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-[#F0F3F7] text-[#142B45] flex flex-col lg:flex-row antialiased">
      {/* Desktop Sticky Sidebar (Hidden on Mobile/Tablet < 1024px) */}
      <div className="hidden lg:block h-screen sticky top-0 shrink-0 z-40 w-64 bg-[#0B1F33]">
        <Sidebar isDrawer={false} />
      </div>

      {/* Mobile/Tablet Off-Canvas Navigation Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex" role="dialog" aria-modal="true">
          {/* Smooth Backdrop - Closes drawer on tap */}
          <div
            className="fixed inset-0 bg-[#0B1F33]/70 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close menu backdrop"
          />

          {/* Drawer Panel: Single crisp boundary, responsive width (80-85vw, max 360px), full viewport height */}
          <div className="relative z-10 w-[82vw] max-w-[360px] h-full h-dvh bg-[#0B1F33] flex flex-col shadow-2xl shadow-black/60 border-r border-[#176B87]/30 overflow-hidden animate-in slide-in-from-left duration-200">
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
