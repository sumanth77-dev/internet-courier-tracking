import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  User,
  Settings,
  KeyRound,
  LogOut,
  ChevronDown,
  Shield,
  Truck,
  Package,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TopNavbar = ({ onOpenSidebar, title = 'Dashboard' }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSignOut = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  const getProfilePath = (tab = 'profile') => {
    const role = user?.role || 'customer';
    return `/${role}/profile?tab=${tab}`;
  };

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#17243A] text-white">
            <Shield className="w-3 h-3 text-[#F59E0B]" />
            <span>Admin</span>
          </span>
        );
      case 'courier':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
            <Truck className="w-3 h-3 text-blue-700" />
            <span>Courier</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
            <Package className="w-3 h-3 text-emerald-700" />
            <span>Customer</span>
          </span>
        );
    }
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <header className="h-16 bg-white border-b border-[#E1E7EF] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onOpenSidebar}
          className="p-2 -ml-2 rounded-lg text-[#65748B] hover:text-[#17243A] hover:bg-[#F5F7FA] lg:hidden cursor-pointer transition"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-sm sm:text-base font-bold text-[#17243A] leading-tight">
            {title}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Role Portal Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-[#F5F7FA] border border-[#E1E7EF]">
          <span className="w-2 h-2 rounded-full bg-[#16845B]" />
          <span className="text-xs font-semibold text-[#17243A] capitalize">
            {user?.role} Portal
          </span>
        </div>

        {/* Profile Avatar & Dropdown Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl border border-[#E1E7EF] hover:border-[#17243A]/30 bg-white hover:bg-[#F5F7FA] transition cursor-pointer shadow-xs"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            aria-label="User account menu"
          >
            <div className="w-8 h-8 rounded-lg bg-[#17243A] text-white flex items-center justify-center text-xs font-bold shadow-xs">
              {initials}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-[#17243A] leading-tight truncate max-w-[120px]">
                {user?.name || 'User'}
              </span>
              <span className="text-[10px] text-[#65748B] capitalize leading-none">
                {user?.role}
              </span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#65748B] transition-transform duration-150 ${
                dropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Dropdown Popover */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-[#E1E7EF] shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* User Identity Header */}
              <div className="px-4 py-2.5 border-b border-[#E1E7EF]/80">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-[#17243A] truncate">
                    {user?.name || 'Authenticated User'}
                  </p>
                  {getRoleBadge()}
                </div>
                <p className="text-[11px] text-[#65748B] truncate">{user?.email || '—'}</p>
              </div>

              {/* Navigation Actions */}
              <div className="py-1">
                <Link
                  to={getProfilePath('profile')}
                  onClick={() => setDropdownOpen(false)}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#17243A] hover:bg-[#F5F7FA] hover:text-[#17243A] transition"
                >
                  <User className="w-4 h-4 text-[#65748B]" />
                  <span>Profile</span>
                </Link>

                <Link
                  to={getProfilePath('settings')}
                  onClick={() => setDropdownOpen(false)}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#17243A] hover:bg-[#F5F7FA] hover:text-[#17243A] transition"
                >
                  <Settings className="w-4 h-4 text-[#65748B]" />
                  <span>Account Settings</span>
                </Link>

                <Link
                  to={getProfilePath('password')}
                  onClick={() => setDropdownOpen(false)}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#17243A] hover:bg-[#F5F7FA] hover:text-[#17243A] transition"
                >
                  <KeyRound className="w-4 h-4 text-[#65748B]" />
                  <span>Change Password</span>
                </Link>
              </div>

              {/* Sign Out Button */}
              <div className="border-t border-[#E1E7EF]/80 pt-1 mt-1">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#C0392B] hover:bg-red-50 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-[#C0392B]" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
