import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../common/BrandLogo';
import {
  Menu,
  X,
  ArrowRight,
  Shield,
  Truck,
  Package,
  User,
  LogOut,
} from 'lucide-react';

export const LandingNavbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  // Add subtle shadow when scrolling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#hero' },
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Live Preview', href: '#live-preview' },
    { name: 'Benefits', href: '#benefits' },
    { name: 'About', href: '#about' },
    { name: 'Contact', href: '#contact' },
  ];

  const handleScrollTo = (e, href) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const targetElement = document.querySelector(href);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getDashboardPath = () => {
    if (!user) return '/customer';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'courier') return '/courier';
    return '/customer';
  };

  const handleSignOut = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled
          ? 'bg-white border-b border-[#D5DEE7] shadow-xs'
          : 'bg-white border-b border-[#D5DEE7]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group cursor-pointer">
            <BrandLogo size="md" showTagline={true} taglineText="Every Delivery. Every Mile. In Sight." />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-6">
            {navLinks.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => handleScrollTo(e, item.href)}
                className="text-xs font-semibold uppercase tracking-wider text-[#142B45] hover:text-[#00A6A6] transition-colors"
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2.5">
                <Link
                  to={getDashboardPath()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-[11px] bg-[#0B1F33] text-white text-xs font-semibold hover:bg-[#123B5D] transition shadow-xs"
                >
                  {user.role === 'admin' ? (
                    <Shield className="w-3.5 h-3.5 text-[#00A6A6]" />
                  ) : user.role === 'courier' ? (
                    <Truck className="w-3.5 h-3.5 text-[#00A6A6]" />
                  ) : (
                    <Package className="w-3.5 h-3.5 text-[#00A6A6]" />
                  )}
                  <span>Open {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <button
                  onClick={handleSignOut}
                  title="Sign Out"
                  className="p-2 rounded-[11px] text-[#607487] hover:text-[#D64B4B] hover:bg-red-50 border border-[#D5DEE7] transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-bold text-[#142B45] hover:text-[#00A6A6] border border-transparent hover:border-[#D5DEE7] rounded-[11px] transition"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-4.5 py-2 text-xs font-bold text-white bg-[#00A6A6] hover:bg-[#008F95] rounded-[11px] shadow-xs transition"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#142B45] hover:bg-[#E8EEF4] focus:outline-none cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#D5DEE7] bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <div className="space-y-1">
            {navLinks.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => handleScrollTo(e, item.href)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-[#142B45] hover:bg-[#E8EEF4] hover:text-[#00A6A6] transition"
              >
                {item.name}
              </a>
            ))}
          </div>

          <div className="pt-3 border-t border-[#D5DEE7] space-y-2">
            {isAuthenticated && user ? (
              <>
                <div className="px-3 py-2 bg-[#E8EEF4] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#00A6A6]" />
                    <span className="text-xs font-bold text-[#142B45] truncate">{user.name}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white border border-[#D5DEE7] text-[#123B5D]">
                    {user.role}
                  </span>
                </div>

                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[11px] bg-[#0B1F33] text-white text-xs font-bold hover:bg-[#123B5D] transition"
                >
                  <span>Go to {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Portal</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#00A6A6]" />
                </Link>

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-[11px] text-[#D64B4B] bg-red-50 text-xs font-semibold transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center px-4 py-2.5 text-xs font-bold text-[#142B45] border border-[#D5DEE7] rounded-[11px] hover:bg-[#E8EEF4] transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-[#00A6A6] rounded-[11px] hover:bg-[#008F95] transition"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default LandingNavbar;
