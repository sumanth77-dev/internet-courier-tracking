import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  User,
  KeyRound,
  LogOut,
  ChevronDown,
  Shield,
  Truck,
  Package,
  Home,
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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#171717] text-white border border-[#383838]">
            <Shield className="w-3 h-3 text-[#FF7547]" />
            <span>Admin</span>
          </span>
        );
      case 'courier':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#171717] text-white border border-[#383838]">
            <Truck className="w-3 h-3 text-[#FF7547]" />
            <span>Courier</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#171717] text-white border border-[#383838]">
            <Package className="w-3 h-3 text-[#FF7547]" />
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
    <header className="h-16 bg-white border-b border-[#DEDCD8] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none shadow-2xs">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile / Tablet menu trigger */}
        <button
          onClick={onOpenSidebar}
          className="p-2 -ml-2 rounded-xl text-[#777777] hover:text-[#202020] hover:bg-[#F2F0ED] lg:hidden cursor-pointer transition"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="truncate">
          <h2 className="text-sm sm:text-base font-bold text-[#202020] tracking-tight leading-tight truncate">
            {title}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
        {/* Role Portal Indicator (Hidden on extra small screens) */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F2F0ED] border border-[#DEDCD8]">
          <span className="w-2 h-2 rounded-full bg-[#FF7547] animate-pulse" />
          <span className="text-xs font-bold text-[#202020] capitalize">
            SkyRoute {user?.role} Portal
          </span>
        </div>

        {/* Public Site Link */}
        <Link
          to="/"
          className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-[#202020] hover:text-[#FF7547] px-3 py-1.5 rounded-xl border border-[#DEDCD8] bg-[#F2F0ED] hover:bg-[#E9E7E4] transition"
          title="Visit SkyRoute Public Landing Page"
        >
          <Home className="w-3.5 h-3.5 text-[#FF7547]" />
          <span>Home</span>
        </Link>

        {/* Profile Avatar & Dropdown Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl border border-[#DEDCD8] hover:border-[#A7A7A7] bg-white hover:bg-[#F2F0ED] transition cursor-pointer shadow-2xs"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            aria-label="User account menu"
          >
            <div className="w-8 h-8 rounded-lg bg-[#171717] text-[#FF7547] border border-[#303030] flex items-center justify-center text-xs font-bold shadow-2xs">
              {initials}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-[#202020] leading-tight truncate max-w-[120px]">
                {user?.name || 'User'}
              </span>
              <span className="text-[10px] text-[#777777] capitalize leading-none">
                {user?.role}
              </span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#777777] transition-transform duration-150 ${
                dropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Dropdown Popover */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-[20px] border border-[#DEDCD8] shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* User Identity Header */}
              <div className="px-4 py-3 border-b border-[#DEDCD8]">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-bold text-[#202020] truncate">
                    {user?.name || 'Authenticated User'}
                  </p>
                  {getRoleBadge()}
                </div>
                <p className="text-[11px] text-[#777777] truncate">{user?.email || '—'}</p>
              </div>

              {/* Navigation Actions */}
              <div className="py-1">
                <Link
                  to="/"
                  onClick={() => setDropdownOpen(false)}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#202020] hover:bg-[#F2F0ED] transition"
                >
                  <Home className="w-4 h-4 text-[#FF7547]" />
                  <span>SkyRoute Public Home</span>
                </Link>

                <Link
                  to={getProfilePath('profile')}
                  onClick={() => setDropdownOpen(false)}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#202020] hover:bg-[#F2F0ED] transition"
                >
                  <User className="w-4 h-4 text-[#777777]" />
                  <span>Profile & Account</span>
                </Link>

                <Link
                  to={getProfilePath('password')}
                  onClick={() => setDropdownOpen(false)}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#202020] hover:bg-[#F2F0ED] transition"
                >
                  <KeyRound className="w-4 h-4 text-[#777777]" />
                  <span>Change Password</span>
                </Link>
              </div>

              {/* Sign Out Button */}
              <div className="border-t border-[#DEDCD8] pt-1 mt-1">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#E45B54] hover:bg-red-50 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-[#E45B54]" />
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
