import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../common/BrandLogo';
import {
  LayoutDashboard,
  PackagePlus,
  Package,
  Truck,
  LogOut,
  Sparkles,
  User,
  Shield,
  ExternalLink,
  X,
} from 'lucide-react';

const Sidebar = ({ onClose, isDrawer = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const handleLogout = () => {
    logout();
    if (onClose) onClose();
    navigate('/login', { replace: true });
  };

  const getNavLinks = () => {
    switch (user?.role) {
      case 'customer':
        return [
          { to: '/customer', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/customer/shipments/create', label: 'Create Shipment', icon: PackagePlus },
          { to: '/customer/shipments', label: 'My Shipments', icon: Package },
          { to: '/customer/profile', label: 'Profile & Settings', icon: User },
        ];
      case 'admin':
        return [
          { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/admin/shipments', label: 'All Shipments', icon: Package },
          { to: '/admin/profile', label: 'Profile & Settings', icon: User },
        ];
      case 'courier':
        return [
          { to: '/courier', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/courier/shipments', label: 'Assigned Shipments', icon: Truck },
          { to: '/courier/simulator', label: 'GPS Simulator', icon: Sparkles },
          { to: '/courier/profile', label: 'Profile & Settings', icon: User },
        ];
      default:
        return [];
    }
  };

  /**
   * Deterministic active route matcher.
   * Strictly prevents overlapping route highlights (e.g. /customer/shipments/create vs /customer/shipments).
   * Maps detail views (e.g. /customer/shipments/:id) strictly to the parent list view.
   */
  const isRouteActive = (targetPath) => {
    // 1. Customer Portal
    if (targetPath === '/customer') {
      return currentPath === '/customer' || currentPath === '/customer/';
    }
    if (targetPath === '/customer/shipments/create') {
      return (
        currentPath === '/customer/shipments/create' ||
        currentPath.startsWith('/customer/shipments/create/')
      );
    }
    if (targetPath === '/customer/shipments') {
      if (
        currentPath === '/customer/shipments/create' ||
        currentPath.startsWith('/customer/shipments/create/')
      ) {
        return false;
      }
      return (
        currentPath === '/customer/shipments' ||
        currentPath.startsWith('/customer/shipments/')
      );
    }
    if (targetPath === '/customer/profile') {
      return currentPath === '/customer/profile' || currentPath === '/profile';
    }

    // 2. Admin Portal
    if (targetPath === '/admin') {
      return currentPath === '/admin' || currentPath === '/admin/';
    }
    if (targetPath === '/admin/shipments') {
      return (
        currentPath === '/admin/shipments' ||
        currentPath.startsWith('/admin/shipments/')
      );
    }
    if (targetPath === '/admin/profile') {
      return currentPath === '/admin/profile' || currentPath === '/profile';
    }

    // 3. Courier Portal
    if (targetPath === '/courier') {
      return currentPath === '/courier' || currentPath === '/courier/';
    }
    if (targetPath === '/courier/shipments') {
      return (
        currentPath === '/courier/shipments' ||
        currentPath.startsWith('/courier/shipments/')
      );
    }
    if (targetPath === '/courier/simulator') {
      return (
        currentPath === '/courier/simulator' ||
        currentPath.startsWith('/courier/simulator/')
      );
    }
    if (targetPath === '/courier/profile') {
      return currentPath === '/courier/profile' || currentPath === '/profile';
    }

    // Fallback exact match
    return currentPath === targetPath;
  };

  const navLinks = getNavLinks();

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  const getRoleBadgeStyle = () => {
    switch (user?.role) {
      case 'admin':
        return {
          label: 'Admin',
          icon: Shield,
          badgeClass: 'bg-[#303030] text-[#FFFFFF] border-[#414141]',
          iconColor: 'text-[#FF7547]',
        };
      case 'courier':
        return {
          label: 'Courier',
          icon: Truck,
          badgeClass: 'bg-[#303030] text-[#FFFFFF] border-[#414141]',
          iconColor: 'text-[#FF7547]',
        };
      default:
        return {
          label: 'Customer',
          icon: Package,
          badgeClass: 'bg-[#303030] text-[#FFFFFF] border-[#414141]',
          iconColor: 'text-[#FF7547]',
        };
    }
  };

  const roleMeta = getRoleBadgeStyle();
  const RoleIcon = roleMeta.icon;

  return (
    <aside
      className={`${
        isDrawer
          ? 'w-full h-full border-r-0'
          : 'w-64 h-full border-r border-[#303030]'
      } bg-[#171717] flex flex-col justify-between shrink-0 select-none text-[#FFFFFF]`}
    >
      <div className="flex flex-col min-h-0 flex-1">
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 sm:px-5 border-b border-[#303030] bg-[#171717] shrink-0">
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center gap-2 group cursor-pointer hover:opacity-95 transition min-w-0"
            title="SkyRoute Home"
          >
            <BrandLogo size="sm" showTagline={true} theme="light" taglineText="Every Delivery. In Sight." />
          </Link>
          {isDrawer && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#C5C5C5] hover:text-white hover:bg-[#303030] transition cursor-pointer shrink-0 -mr-1"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Group */}
        <div className="p-3.5 space-y-1 overflow-y-auto flex-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#929292] mb-2">
            Navigation
          </p>
          <nav className="space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = isRouteActive(item.to);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-[#242424] text-white shadow-xs border border-[#383838]'
                      : 'text-[#C5C5C5] hover:text-white hover:bg-[#242424]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-[#FF7547]' : 'text-[#929292] group-hover:text-white'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF7547] shrink-0 shadow-[0_0_8px_#FF7547]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Quick link to public landing site */}
          <div className="pt-4 mt-3 border-t border-[#303030]">
            <Link
              to="/"
              onClick={onClose}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#C5C5C5] hover:text-white hover:bg-[#242424] transition group"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5 text-[#FF7547]" />
                <span>SkyRoute Public Home</span>
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* User Profile Capsule in Footer */}
      <div className="p-3.5 border-t border-[#303030] bg-[#171717] shrink-0">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#242424] border border-[#383838] mb-2.5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-[#171717] text-[#FF7547] border border-[#303030] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">
              {user?.name || 'User'}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold border ${roleMeta.badgeClass}`}
              >
                <RoleIcon className={`w-2.5 h-2.5 ${roleMeta.iconColor}`} />
                <span className="capitalize">{roleMeta.label}</span>
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-[#C5C5C5] hover:text-[#E45B54] bg-[#242424] hover:bg-red-950/30 border border-[#383838] hover:border-red-900/40 rounded-xl transition duration-150 cursor-pointer shadow-2xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
