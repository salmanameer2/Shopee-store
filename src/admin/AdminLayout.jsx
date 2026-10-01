import React from 'react';
import { NavLink, Link, useNavigate, Outlet } from 'react-router-dom';
import {
  FiShield,
  FiBox,
  FiShoppingBag,
  FiLayers,
  FiGrid,
  FiLogOut,
  FiExternalLink,
  FiCheckCircle,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminLayout({ children }) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login', { replace: true });
  };

  const adminEmail = profile?.email || user?.email || 'admin@shopee.example.com';
  const adminName = profile?.fullName || 'Administrator';

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: FiGrid, end: true },
    { name: 'Products', path: '/admin/products', icon: FiBox },
    { name: 'Orders', path: '/admin/orders', icon: FiShoppingBag },
    { name: 'Inventory', path: '/admin/inventory', icon: FiLayers },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col antialiased">
      {/* Admin Top Header */}
      <header className="sticky top-0 z-40 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Left: Brand / Title */}
            <div className="flex items-center gap-3">
              <Link to="/admin" className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF5722] to-[#FF8A65] flex items-center justify-center text-white font-black text-lg shadow-md shadow-[#FF5722]/20">
                  <FiShield className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-base tracking-tight text-white leading-tight">
                    Shopee <span className="text-[#FF5722]">Admin</span>
                  </span>
                  <span className="text-[10px] text-neutral-400 font-medium">Control Portal</span>
                </div>
              </Link>
            </div>

            {/* Middle: Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-1.5 bg-neutral-800/80 p-1 rounded-2xl border border-neutral-700/60">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    className={({ isActive }) =>
                      `px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        isActive
                          ? 'bg-[#FF5722] text-white shadow-sm'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-700/50'
                      }`
                    }
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Right: Storefront Link & Admin Profile / Logout */}
            <div className="flex items-center gap-3">
              <Link
                to="/"
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors bg-neutral-800/60 hover:bg-neutral-800 px-3 py-1.5 rounded-xl border border-neutral-700/60"
              >
                <span>Storefront</span>
                <FiExternalLink className="w-3.5 h-3.5 text-neutral-500" />
              </Link>

              {/* Admin Badge */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-neutral-800/60 rounded-xl border border-neutral-700/60">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <div className="text-left">
                  <p className="text-[11px] font-bold text-neutral-200 truncate max-w-[140px]">{adminEmail}</p>
                  <p className="text-[9px] text-[#FF5722] font-semibold uppercase tracking-wider">Administrator</p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 sm:px-3 sm:py-1.5 bg-neutral-800 hover:bg-rose-500/20 hover:text-rose-400 text-neutral-300 rounded-xl transition-all text-xs font-bold flex items-center gap-1.5 border border-neutral-700/60 hover:border-rose-500/40 cursor-pointer"
                aria-label="Admin Logout"
              >
                <FiLogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden border-t border-neutral-800/80 px-4 py-2 flex items-center gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? 'bg-[#FF5722] text-white'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      </header>

      {/* Admin Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children || <Outlet />}
      </main>
    </div>
  );
}
