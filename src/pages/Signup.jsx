import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiMail,
  FiLock,
  FiUser,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiAlertCircle,
  FiCheckCircle,
  FiInbox,
} from 'react-icons/fi';
import Container from '../components/common/Container.jsx';
import Button from '../components/common/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmationPending, setConfirmationPending] = useState(false);

  const validateForm = () => {
    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return false;
    }

    if (!password) {
      setErrorMessage('Please enter a password.');
      return false;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return false;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please check and retype.');
      return false;
    }

    if (!agreeTerms) {
      setErrorMessage("Please accept Shopee's Terms of Service to continue.");
      return false;
    }

    return true;
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validateForm()) return;

    try {
      setLoading(true);
      const result = await signUp({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to create your account. Please try again.');
        return;
      }

      // If Supabase requires email verification
      if (result.isConfirmationRequired) {
        setConfirmationPending(true);
      } else {
        // Direct authenticated session -> redirect to homepage
        navigate('/', { replace: true });
      }
    } catch (err) {
      setErrorMessage('An unexpected network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If email verification is pending
  if (confirmationPending) {
    return (
      <div className="py-12 sm:py-16 min-h-[75vh] flex items-center">
        <Container>
          <div className="max-w-md mx-auto bg-white rounded-3xl border border-neutral-200 p-8 sm:p-10 shadow-sm text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#FF5722] flex items-center justify-center mx-auto border border-orange-100">
              <FiInbox className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
                Verify Your Email
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                We've dispatched a confirmation link to{' '}
                <strong className="text-neutral-900">{email}</strong>.
              </p>
              <p className="text-xs text-neutral-500 leading-relaxed pt-2">
                Please click the link in your email to verify your account and activate your Shopee customer profile.
              </p>
            </div>

            <div className="pt-4 border-t border-neutral-100 space-y-3">
              <Link to="/login">
                <Button variant="primary" size="md" className="w-full">
                  Go to Sign In
                </Button>
              </Link>
              <Link to="/">
                <Button variant="ghost" size="sm" className="w-full text-xs text-neutral-500">
                  Return to Storefront
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-12 sm:py-16 min-h-[75vh] flex items-center">
      <Container>
        <div className="max-w-md mx-auto bg-white rounded-3xl border border-neutral-200 p-8 sm:p-10 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#FF5722] to-[#FF8A65] flex items-center justify-center text-white font-black text-xl shadow-md mx-auto mb-2">
              S
            </div>
            <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
              Create Your Shopee Account
            </h1>
            <p className="text-xs text-neutral-500">
              Join thousands enjoying curated fashion & electronic gadgets
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700 animate-fadeIn">
              <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSignupSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <FiUser className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Sara Ahmed"
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722]/30 focus:border-[#FF5722] disabled:opacity-60 transition-all"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                Email Address *
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
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722]/30 focus:border-[#FF5722] disabled:opacity-60 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                Password (min. 6 characters) *
              </label>
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
                  placeholder="At least 6 characters"
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

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                Confirm Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <FiLock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full pl-10 pr-10 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722]/30 focus:border-[#FF5722] disabled:opacity-60 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-700 cursor-pointer"
                >
                  {showConfirmPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="pt-1">
              <label className="inline-flex items-center gap-2 text-xs text-neutral-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  disabled={loading}
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 rounded text-[#FF5722] accent-[#FF5722]"
                />
                <span>
                  I agree to Shopee's Terms of Service & Privacy Policy
                </span>
              </label>
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
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create My Account</span>
                  <FiArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <div className="pt-4 border-t border-neutral-100 text-center text-xs text-neutral-500">
            Already registered?{' '}
            <Link to="/login" className="text-[#FF5722] font-bold hover:underline">
              Sign In Instead
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
