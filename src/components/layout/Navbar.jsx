import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiShoppingBag,
  FiUser,
  FiMenu,
  FiX,
  FiTruck,
  FiShield,
  FiPercent,
  FiChevronDown,
  FiPackage,
  FiLogOut,
  FiCheckCircle,
} from 'react-icons/fi';
import Container from '../common/Container.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';

export default function Navbar() {
  const { user, profile, isAuthenticated, signOut } = useAuth();
  const { cartCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [navSearchQuery, setNavSearchQuery] = useState('');
  const [categoryDropdown, setCategoryDropdown] = useState(false);

  const navigate = useNavigate();
  const userMenuRef = useRef(null);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categories = [
    { name: 'Men', path: '/category/men' },
    { name: 'Women', path: '/category/women' },
    { name: 'Kids', path: '/category/kids' },
    { name: 'Electronic Gadgets', path: '/category/electronic-gadgets' },
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (navSearchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(navSearchQuery.trim())}`);
      setSearchOpen(false);
      setNavSearchQuery('');
    }
  };

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    await signOut();
    navigate('/', { replace: true });
  };

  const displayName = profile?.fullName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Customer';
  const displayInitial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-100 transition-all">
      {/* Top Promotional Bar */}
      <div className="bg-neutral-900 text-neutral-300 text-xs py-2 px-4">
        <Container fluid>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
            <div className="flex items-center gap-6 text-[11px] sm:text-xs">
              <span className="flex items-center gap-1.5 font-medium text-neutral-200">
                <FiTruck className="w-3.5 h-3.5 text-[#FF5722]" /> Free Delivery Over Rs. 2,000
              </span>
              <span className="hidden md:flex items-center gap-1.5 text-neutral-400">
                <FiPercent className="w-3.5 h-3.5 text-[#FF5722]" /> Flash Deals Up to 30% Off
              </span>
              <span className="hidden lg:flex items-center gap-1.5 text-neutral-400">
                <FiShield className="w-3.5 h-3.5 text-emerald-400" /> 100% Authentic Quality Guaranteed
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px] sm:text-xs text-neutral-400">
              <Link to="/about" className="hover:text-white transition-colors">
                Help & FAQs
              </Link>
              <span className="text-neutral-700">|</span>
              <Link to={isAuthenticated ? '/orders' : '/login'} className="hover:text-white transition-colors">
                Track Order
              </Link>
              <span className="text-neutral-700">|</span>
              <Link to="/contact" className="hover:text-white transition-colors">
                Customer Care
              </Link>
            </div>
          </div>
        </Container>
      </div>

      {/* Main Navbar */}
      <Container>
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Brand Wordmark */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5722] rounded-lg shrink-0"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF5722] to-[#FF8A65] flex items-center justify-center text-white font-black text-xl shadow-md shadow-[#FF5722]/30 transition-transform group-hover:scale-105">
              S
            </div>
            <span className="text-2xl font-black tracking-tight text-neutral-900">
              Shopee<span className="text-[#FF5722]">.</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `text-sm font-semibold transition-colors py-1 ${
                  isActive ? 'text-[#FF5722]' : 'text-neutral-700 hover:text-neutral-900'
                }`
              }
            >
              Home
            </NavLink>

            <NavLink
              to="/products"
              className={({ isActive }) =>
                `text-sm font-semibold transition-colors py-1 ${
                  isActive ? 'text-[#FF5722]' : 'text-neutral-700 hover:text-neutral-900'
                }`
              }
            >
              All Products
            </NavLink>

            {/* Categories Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setCategoryDropdown(true)}
              onMouseLeave={() => setCategoryDropdown(false)}
            >
              <button
                type="button"
                className="text-sm font-semibold text-neutral-700 hover:text-neutral-900 flex items-center gap-1 py-1 focus:outline-none cursor-pointer"
              >
                Categories <FiChevronDown className="w-3.5 h-3.5" />
              </button>

              {categoryDropdown && (
                <div className="absolute top-full left-0 w-52 bg-white rounded-2xl shadow-xl border border-neutral-100 p-2 z-50 animate-fadeIn space-y-1">
                  {categories.map((cat) => (
                    <Link
                      key={cat.name}
                      to={cat.path}
                      onClick={() => setCategoryDropdown(false)}
                      className="block px-3 py-2 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-[#FF5722] transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <NavLink
              to="/category/men"
              className={({ isActive }) =>
                `text-sm font-semibold transition-colors py-1 ${
                  isActive ? 'text-[#FF5722]' : 'text-neutral-700 hover:text-neutral-900'
                }`
              }
            >
              Men
            </NavLink>

            <NavLink
              to="/category/women"
              className={({ isActive }) =>
                `text-sm font-semibold transition-colors py-1 ${
                  isActive ? 'text-[#FF5722]' : 'text-neutral-700 hover:text-neutral-900'
                }`
              }
            >
              Women
            </NavLink>

            <NavLink
              to="/category/kids"
              className={({ isActive }) =>
                `text-sm font-semibold transition-colors py-1 ${
                  isActive ? 'text-[#FF5722]' : 'text-neutral-700 hover:text-neutral-900'
                }`
              }
            >
              Kids
            </NavLink>

            <NavLink
              to="/category/electronic-gadgets"
              className={({ isActive }) =>
                `text-sm font-semibold transition-colors py-1 whitespace-nowrap ${
                  isActive ? 'text-[#FF5722]' : 'text-neutral-700 hover:text-neutral-900'
                }`
              }
            >
              Gadgets
            </NavLink>

            <NavLink
              to="/about"
              className={({ isActive }) =>
                `text-sm font-semibold transition-colors py-1 ${
                  isActive ? 'text-[#FF5722]' : 'text-neutral-700 hover:text-neutral-900'
                }`
              }
            >
              About
            </NavLink>

            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `text-sm font-semibold transition-colors py-1 ${
                  isActive ? 'text-[#FF5722]' : 'text-neutral-700 hover:text-neutral-900'
                }`
              }
            >
              Contact
            </NavLink>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Toggle */}
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2.5 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
              aria-label="Toggle search bar"
            >
              <FiSearch className="w-5 h-5" />
            </button>

            {/* Auth State in Navbar */}
            {isAuthenticated ? (
              // Logged-in Customer Menu
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors cursor-pointer"
                  aria-label="User Account Menu"
                >
                  <div className="w-7 h-7 rounded-xl bg-[#FF5722] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    {displayInitial}
                  </div>
                  <span className="hidden sm:inline text-xs font-bold max-w-[100px] truncate">
                    {displayName}
                  </span>
                  <FiChevronDown
                    className={`hidden sm:inline w-3.5 h-3.5 text-neutral-500 transition-transform ${
                      userDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-neutral-100 p-2 z-50 animate-fadeIn space-y-1">
                    <div className="px-3 py-2 border-b border-neutral-100 mb-1">
                      <p className="text-xs font-bold text-neutral-900 truncate">
                        {displayName}
                      </p>
                      <p className="text-[11px] text-neutral-400 truncate">
                        {user.email}
                      </p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-[#FF5722] transition-colors"
                    >
                      <FiUser className="w-4 h-4" />
                      <span>My Profile</span>
                    </Link>

                    <Link
                      to="/orders"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-[#FF5722] transition-colors"
                    >
                      <FiPackage className="w-4 h-4" />
                      <span>My Orders</span>
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border-t border-neutral-50 mt-1 pt-2"
                    >
                      <FiLogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Logged-out Customer Navigation Links
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs font-bold text-neutral-700 hover:text-neutral-900 rounded-xl hover:bg-neutral-100 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-3.5 py-2 text-xs font-bold bg-neutral-900 hover:bg-[#FF5722] text-white rounded-xl shadow-sm transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Fallback Login Icon if logged out on small screens */}
            {!isAuthenticated && (
              <Link
                to="/login"
                className="sm:hidden p-2.5 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors"
                aria-label="Account Login"
              >
                <FiUser className="w-5 h-5" />
              </Link>
            )}

            {/* Cart Button */}
            <Link
              to="/cart"
              className="relative p-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 rounded-xl transition-colors flex items-center justify-center group"
              aria-label="View Shopping Cart"
            >
              <FiShoppingBag className="w-5 h-5 group-hover:text-[#FF5722] transition-colors" />
              <span className="absolute -top-1 -right-1 bg-[#FF5722] text-white text-[10px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-sm">
                {cartCount}
              </span>
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Expandable Search Bar */}
        {searchOpen && (
          <div className="py-3 border-t border-neutral-100">
            <form onSubmit={handleSearchSubmit} className="relative max-w-xl mx-auto flex items-center">
              <FiSearch className="absolute left-4 text-neutral-400 w-4 h-4" />
              <input
                type="text"
                value={navSearchQuery}
                onChange={(e) => setNavSearchQuery(e.target.value)}
                placeholder="Search Men, Women, Kids, Electronic Gadgets, brands..."
                className="w-full pl-11 pr-24 py-2.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722]/30 focus:border-[#FF5722]"
                autoFocus
              />
              <button
                type="submit"
                className="absolute right-2 px-4 py-1.5 bg-neutral-900 hover:bg-[#FF5722] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Search
              </button>
            </form>
          </div>
        )}
      </Container>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-neutral-200 bg-white px-4 pt-4 pb-6 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Authenticated User Banner or Login CTA */}
          {isAuthenticated ? (
            <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FF5722] text-white flex items-center justify-center font-bold text-sm">
                  {displayInitial}
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-900">{displayName}</p>
                  <p className="text-[10px] text-neutral-500">{user.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="px-2.5 py-1 text-xs font-bold text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 text-center text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 text-center text-xs font-bold bg-[#FF5722] text-white rounded-xl shadow-sm"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Quick Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
            <input
              type="text"
              value={navSearchQuery}
              onChange={(e) => setNavSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#FF5722]/30"
            />
          </form>

          {/* Nav items */}
          <nav className="flex flex-col space-y-1 text-sm font-semibold">
            <NavLink
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl ${
                  isActive ? 'bg-neutral-100 text-[#FF5722]' : 'text-neutral-800 hover:bg-neutral-50'
                }`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/products"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl ${
                  isActive ? 'bg-neutral-100 text-[#FF5722]' : 'text-neutral-800 hover:bg-neutral-50'
                }`
              }
            >
              All Products
            </NavLink>

            {isAuthenticated && (
              <>
                <NavLink
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-xl flex items-center gap-2 ${
                      isActive ? 'bg-neutral-100 text-[#FF5722]' : 'text-neutral-800 hover:bg-neutral-50'
                    }`
                  }
                >
                  <FiUser className="w-4 h-4 text-[#FF5722]" /> My Profile
                </NavLink>
                <NavLink
                  to="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-xl flex items-center gap-2 ${
                      isActive ? 'bg-neutral-100 text-[#FF5722]' : 'text-neutral-800 hover:bg-neutral-50'
                    }`
                  }
                >
                  <FiPackage className="w-4 h-4 text-[#FF5722]" /> My Orders
                </NavLink>
              </>
            )}

            <div className="pt-2 pb-1 px-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Departments
            </div>
            {categories.map((cat) => (
              <NavLink
                key={cat.name}
                to={cat.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-xl flex items-center justify-between ${
                    isActive ? 'bg-neutral-100 text-[#FF5722]' : 'text-neutral-700 hover:bg-neutral-50'
                  }`
                }
              >
                <span>{cat.name}</span>
                <span className="text-[10px] text-neutral-400">5 items</span>
              </NavLink>
            ))}

            <div className="pt-2 pb-1 px-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Company
            </div>
            <NavLink
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-neutral-700 hover:bg-neutral-50"
            >
              About Shopee
            </NavLink>
            <NavLink
              to="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-neutral-700 hover:bg-neutral-50"
            >
              Customer Care
            </NavLink>
          </nav>

          <div className="pt-4 border-t border-neutral-100 space-y-2">
            <Link
              to="/cart"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-neutral-900 text-white font-bold text-xs"
            >
              <span className="flex items-center gap-2">
                <FiShoppingBag className="w-4 h-4 text-[#FF5722]" /> Shopping Cart
              </span>
              <span>{cartCount} {cartCount === 1 ? 'Item' : 'Items'}</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
