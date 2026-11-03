import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  PackagePlus,
  Package,
  Truck,
  LogOut,
  Sparkles,
  User,
} from 'lucide-react';

const Sidebar = ({ onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getNavLinks = () => {
    switch (user?.role) {
      case 'customer':
        return [
          { to: '/customer', label: 'Dashboard', icon: LayoutDashboard, end: true },
          { to: '/customer/shipments/create', label: 'Create Shipment', icon: PackagePlus },
          { to: '/customer/shipments', label: 'My Shipments', icon: Package },
          { to: '/customer/profile', label: 'Profile & Settings', icon: User },
        ];
      case 'admin':
        return [
          { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
          { to: '/admin/shipments', label: 'All Shipments', icon: Package },
          { to: '/admin/profile', label: 'Profile & Settings', icon: User },
        ];
      case 'courier':
        return [
          { to: '/courier', label: 'Dashboard', icon: LayoutDashboard, end: true },
          { to: '/courier/shipments', label: 'Assigned Shipments', icon: Truck },
          { to: '/courier/simulator', label: 'GPS Simulator', icon: Sparkles },
          { to: '/courier/profile', label: 'Profile & Settings', icon: User },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'US';

  return (
    <aside className="w-64 h-full bg-white border-r border-[#E1E7EF] flex flex-col justify-between shrink-0">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-[#E1E7EF]">
          <div className="w-8 h-8 rounded-lg bg-[#17243A] text-[#F59E0B] flex items-center justify-center shrink-0 shadow-xs">
            <Package className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <h1 className="text-xs font-bold text-[#17243A] tracking-tight leading-tight truncate">
              Courier Tracking
            </h1>
            <p className="text-[10px] text-[#65748B] font-medium">Logistics & Delivery</p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="p-3">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#65748B] mb-1.5">
            Navigation
          </p>
          <nav className="space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition duration-150 ${
                      isActive
                        ? 'bg-[#17243A] text-white shadow-xs'
                        : 'text-[#65748B] hover:text-[#17243A] hover:bg-[#F5F7FA]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Section & Logout */}
      <div className="p-3 border-t border-[#E1E7EF] bg-[#F5F7FA]/60">
        <Link
          to={`/${user?.role || 'customer'}/profile`}
          onClick={onClose}
          className="flex items-center gap-2.5 px-2 py-1.5 mb-2 rounded-lg hover:bg-white border border-transparent hover:border-[#E1E7EF] transition"
          title="View profile and account settings"
        >
          <div className="w-8 h-8 rounded-lg bg-[#17243A] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
            {initials}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-bold text-[#17243A] truncate">{user?.name || 'User'}</p>
            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-[#F59E0B]">
              {user?.role} portal
            </span>
          </div>
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-[#C0392B] hover:bg-red-50 rounded-lg transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
