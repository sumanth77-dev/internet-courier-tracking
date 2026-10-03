import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  PackagePlus,
  Package,
  Truck,
  LogOut,
  Shield,
  User as UserIcon,
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
        ];
      case 'admin':
        return [
          { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
          { to: '/admin/shipments', label: 'All Shipments', icon: Package },
        ];
      case 'courier':
        return [
          { to: '/courier', label: 'Dashboard', icon: LayoutDashboard, end: true },
          { to: '/courier/shipments', label: 'Assigned Shipments', icon: Truck },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <aside className="w-64 h-full bg-white border-r border-[#D9DEE5] flex flex-col justify-between shrink-0">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-[#D9DEE5]">
          <div className="w-8 h-8 rounded-lg bg-[#172033] text-[#D97706] flex items-center justify-center shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <h1 className="text-xs font-bold text-[#172033] tracking-tight leading-tight truncate">
              Courier Tracking
            </h1>
            <p className="text-[10px] text-[#667085] font-medium">Logistics & Delivery</p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="p-3">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#667085] mb-1.5">
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
                        ? 'bg-[#172033] text-white shadow-xs'
                        : 'text-[#667085] hover:text-[#172033] hover:bg-[#F4F6F8]'
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
      <div className="p-3 border-t border-[#D9DEE5] bg-[#F4F6F8]/50">
        <div className="flex items-center gap-2.5 px-2 py-1.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#172033] text-white font-bold text-xs flex items-center justify-center shrink-0">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-bold text-[#172033] truncate">{user?.name}</p>
            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-[#D97706]">
              {user?.role} portal
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-[#B91C1C] hover:bg-red-50 rounded-lg transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
