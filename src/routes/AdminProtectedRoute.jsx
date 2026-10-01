import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { FiShield, FiAlertTriangle, FiArrowLeft, FiLogOut } from 'react-icons/fi';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import Button from '../components/common/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminProtectedRoute({ children }) {
  const { user, profile, loading, signOut } = useAuth();
  const location = useLocation();

  // 1. Loading state while session & profile are being resolved
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-6 text-white">
        <div className="w-16 h-16 rounded-3xl bg-neutral-800 border border-neutral-700 flex items-center justify-center mb-4 shadow-xl">
          <FiShield className="w-8 h-8 text-[#FF5722] animate-pulse" />
        </div>
        <LoadingSpinner size="lg" color="white" text="Verifying administrator authorization..." />
      </div>
    );
  }

  // 2. Unauthenticated: Redirect to /admin/login with return path
  if (!user) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/admin/login?redirect=${returnUrl}`} replace />;
  }

  // 3. Authenticated customer without 'admin' role: Explicit Access Denied
  const isAdmin = profile?.role === 'admin';
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6 text-neutral-100">
        <div className="max-w-md w-full bg-neutral-900 rounded-3xl border border-neutral-800 p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto">
            <FiAlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 bg-rose-500/10 text-rose-400 text-xs font-bold rounded-full uppercase tracking-wider border border-rose-500/20">
              Access Restricted
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Administrator Privileges Required
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Your account (<strong className="text-neutral-200">{user.email}</strong>) has customer role permissions (<code className="font-mono text-neutral-300">role: customer</code>) and is not authorized to access the Shopee Admin Portal.
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <Link to="/" className="block">
              <Button variant="primary" size="md" className="w-full justify-center shadow-lg shadow-[#FF5722]/20">
                <FiArrowLeft className="w-4 h-4" /> Return to Customer Storefront
              </Button>
            </Link>

            <button
              type="button"
              onClick={async () => {
                await signOut();
                window.location.href = '/admin/login';
              }}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 transition-colors flex items-center justify-center gap-2 cursor-pointer border border-neutral-700"
            >
              <FiLogOut className="w-4 h-4" /> Sign In with Different Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized administrator: Render protected admin content
  return children;
}
