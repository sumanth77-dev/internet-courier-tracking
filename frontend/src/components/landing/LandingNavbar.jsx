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
  LogOut,
  User,
} from 'lucide-react';

export const LandingNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll handler
  const handleScrollTo = (e, href) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Live Map', href: '#live-preview' },
    { name: 'Platform Benefits', href: '#benefits' },
    { name: 'About', href: '#about' },
    { name: 'Contact', href: '#contact' },
  ];

  const getDashboardPath = () => {
    if (!user) return '/login';
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
    <header className="fixed top-0 left-0 right-0 z-50 pt-2.5 sm:pt-3.5 px-3 sm:px-6 lg:px-8 pointer-events-none transition-all duration-300">
      <div className="max-w-7xl mx-auto pointer-events-auto">
        {/* Floating Glass Pill Container */}
        <div
          className={`rounded-2xl transition-all duration-300 border ${
            scrolled
              ? 'bg-[#171717]/90 backdrop-blur-md border-[#383838] shadow-[0_8px_32px_rgba(0,0,0,0.4)] py-2.5 px-4 sm:px-6'
              : 'bg-[#171717]/75 backdrop-blur-md border-[#303030] shadow-[0_6px_24px_rgba(0,0,0,0.3)] py-3 px-4 sm:px-6'
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            {/* Left: Brand Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 group cursor-pointer shrink-0"
              title="SkyRoute — Home"
            >
              <BrandLogo
                size="md"
                showTagline={true}
                theme="light"
                taglineText="Every Delivery. Every Mile. In Sight."
              />
            </Link>

            {/* Center: Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
              {navLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleScrollTo(e, item.href)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#C5C5C5] hover:text-white hover:bg-[#303030]/60 transition-colors"
                >
                  {item.name}
                </a>
              ))}
            </nav>

            {/* Right: Action Buttons */}
            <div className="hidden sm:flex items-center gap-2.5 shrink-0">
              {isAuthenticated && user ? (
                <div className="flex items-center gap-2">
                  <Link
                    to={getDashboardPath()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#242424] hover:bg-[#303030] text-white text-xs font-bold border border-[#383838] transition shadow-2xs"
                  >
                    {user.role === 'admin' ? (
                      <Shield className="w-3.5 h-3.5 text-[#FF7547]" />
                    ) : user.role === 'courier' ? (
                      <Truck className="w-3.5 h-3.5 text-[#FF7547]" />
                    ) : (
                      <Package className="w-3.5 h-3.5 text-[#FF7547]" />
                    )}
                    <span>Open {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Portal</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#FF7547]" />
                  </Link>

                  <button
                    onClick={handleSignOut}
                    title="Sign Out"
                    className="p-2 rounded-xl text-[#C5C5C5] hover:text-[#E45B54] hover:bg-red-950/30 border border-[#383838] transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-3.5 py-1.5 text-xs font-bold text-white hover:text-[#FF7547] hover:bg-[#303030]/60 rounded-xl transition"
                  >
                    Login
                  </Link>

                  <Link
                    to="/register"
                    className="inline-flex items-center gap-1.5 px-4.5 py-2 text-xs font-bold text-white bg-[#FF7547] hover:bg-[#F06438] rounded-xl shadow-xs transition"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Toggle Button */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 rounded-xl text-white hover:bg-[#303030] transition cursor-pointer"
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Drawer / Dropdown */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-3 pt-3 border-t border-[#383838] space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="space-y-0.5 max-h-[55vh] overflow-y-auto">
                {navLinks.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    onClick={(e) => handleScrollTo(e, item.href)}
                    className="block px-3 py-2 rounded-xl text-xs font-semibold text-[#C5C5C5] hover:bg-[#303030] hover:text-white transition"
                  >
                    {item.name}
                  </a>
                ))}
              </div>

              <div className="pt-2.5 border-t border-[#383838] space-y-2">
                {isAuthenticated && user ? (
                  <>
                    <div className="px-3 py-1.5 bg-[#242424] border border-[#383838] rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <User className="w-3.5 h-3.5 text-[#FF7547] shrink-0" />
                        <span className="text-xs font-bold text-white truncate">{user.name}</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#303030] border border-[#414141] text-[#C5C5C5] shrink-0">
                        {user.role}
                      </span>
                    </div>

                    <Link
                      to={getDashboardPath()}
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#242424] hover:bg-[#303030] text-white text-xs font-bold border border-[#383838] transition"
                    >
                      <span>Open {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Portal</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#FF7547]" />
                    </Link>

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[#E45B54] bg-red-950/20 text-xs font-semibold transition cursor-pointer"
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
                      className="flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white border border-[#383838] bg-[#242424] hover:bg-[#303030] rounded-xl transition"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-[#FF7547] rounded-xl hover:bg-[#F06438] transition"
                    >
                      <span>Get Started</span>
                      <ArrowRight className="w-3.5 h-3.5 text-white" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default LandingNavbar;
