import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  FiShield,
  FiLock,
  FiMail,
  FiArrowRight,
  FiArrowLeft,
  FiAlertCircle,
  FiCheckCircle,
} from 'react-icons/fi';
import Button from '../components/common/Button.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { adminSignIn } from '../services/adminAuthService.js';

export default function AdminLogin() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // If already authenticated as admin, redirect to /admin immediately
  useEffect(() => {
    if (!authLoading && user && profile?.role === 'admin') {
      const searchParams = new URLSearchParams(location.search);
      const returnUrl = searchParams.get('redirect') || '/admin';
      navigate(returnUrl, { replace: true });
    }
  }, [user, profile, authLoading, navigate, location.search]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage(null);
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!formData.email.trim()) {
      setErrorMessage('Admin email is required.');
      return;
    }
    if (!formData.password) {
      setErrorMessage('Admin password is required.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await adminSignIn({
        email: formData.email,
        password: formData.password,
      });

      if (result.success && result.profile?.role === 'admin') {
        // Refresh AuthContext so application recognizes admin session
        await refreshProfile();

        const searchParams = new URLSearchParams(location.search);
        const returnUrl = searchParams.get('redirect') || '/admin';
        navigate(returnUrl, { replace: true });
      } else {
        setErrorMessage(
          result.error || 'You do not have permission to access the admin area.'
        );
      }
    } catch (err) {
      console.error('Admin login exception:', err);
      setErrorMessage('Unable to sign in right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 antialiased">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Portal Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center font-bold text-xl shadow-xl mx-auto mb-4">
            <FiShield className="w-8 h-8 text-[#FF5722]" />
          </div>
          <span className="px-3 py-1 bg-neutral-900 text-[#FF5722] text-[11px] font-bold rounded-full uppercase tracking-wider border border-neutral-800">
            Control Portal
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-2">
            Shopee Admin Portal
          </h1>
          <p className="text-xs text-neutral-400 mt-1.5">
            Store Management, Order Fulfillment & Inventory Control
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-neutral-900 rounded-3xl border border-neutral-800 p-8 shadow-2xl space-y-6">
          {/* Error Message Banner */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 flex items-start gap-3 text-xs"
              >
                <FiAlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <FiMail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="admin@shopee.example.com"
                  required
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-3 bg-neutral-950 border border-neutral-800 focus:border-[#FF5722] focus:ring-2 focus:ring-[#FF5722]/20 rounded-xl text-sm text-white placeholder:text-neutral-600 transition-all outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Admin Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <FiLock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-4 py-3 bg-neutral-950 border border-neutral-800 focus:border-[#FF5722] focus:ring-2 focus:ring-[#FF5722]/20 rounded-xl text-sm text-white placeholder:text-neutral-600 transition-all outline-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                className="w-full py-3.5 shadow-lg shadow-[#FF5722]/20 justify-center cursor-pointer text-sm font-bold"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" color="white" />
                    <span>Verifying Credentials...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Authenticate as Admin</span>
                    <FiArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </div>
          </form>

          {/* Security Notice Footer */}
          <div className="pt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 hover:text-neutral-300 transition-colors"
            >
              <FiArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Storefront</span>
            </Link>

            <span className="text-[11px] text-neutral-600">
              Role: <code className="font-mono text-neutral-400">admin</code> required
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
