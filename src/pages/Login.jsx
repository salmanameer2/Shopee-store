import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiAlertCircle,
} from 'react-icons/fi';
import Container from '../components/common/Container.jsx';
import Button from '../components/common/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAdminAttempt, setIsAdminAttempt] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsAdminAttempt(false);

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      const result = await signIn({
        email: email.trim(),
        password,
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Invalid email or password.');
        if (result.isAdminAccount || (result.error && result.error.includes('Admin Login'))) {
          setIsAdminAttempt(true);
        }
        return;
      }

      // Customer must always be redirected to the homepage after login
      navigate('/', { replace: true });
    } catch (err) {
      setErrorMessage('An unexpected network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 sm:py-16 min-h-[75vh] flex items-center">
      <Container>
        <div className="max-w-md mx-auto bg-white rounded-3xl border border-neutral-200 p-8 sm:p-10 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#FF5722] to-[#FF8A65] flex items-center justify-center text-white font-black text-xl shadow-md mx-auto mb-2">
              S
            </div>
            <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
              Welcome Back to Shopee
            </h1>
            <p className="text-xs text-neutral-500">
              Sign in to manage your customer profile, orders, and wishlist
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col gap-2.5 text-xs text-rose-800 animate-fadeIn">
              <div className="flex items-start gap-2.5">
                <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span className="font-semibold">{errorMessage}</span>
              </div>
              {isAdminAttempt && (
                <div className="pl-6 pt-1 border-t border-rose-200/60">
                  <Link
                    to="/admin/login"
                    className="inline-flex items-center gap-1.5 font-bold text-[#FF5722] hover:text-[#E64A19] hover:underline transition-colors"
                  >
                    <span>Go to Admin Login</span>
                    <FiArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <FiMail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="shopper@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722]/30 focus:border-[#FF5722] disabled:opacity-60 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-neutral-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <FiLock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722]/30 focus:border-[#FF5722] disabled:opacity-60 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-700 cursor-pointer"
                >
                  {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="w-full py-3.5 shadow-lg shadow-[#FF5722]/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Store</span>
                  <FiArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <div className="pt-4 border-t border-neutral-100 text-center text-xs text-neutral-500">
            Don't have a Shopee account?{' '}
            <Link to="/signup" className="text-[#FF5722] font-bold hover:underline">
              Create New Account
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
