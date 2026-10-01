import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import Container from '../components/common/Container.jsx';

/**
 * Route guard component for authenticated customer routes (e.g. /profile, /orders, /checkout)
 * Enforces strict role separation:
 * - Unauthenticated users are redirected to /login
 * - Authenticated administrators (role === 'admin') are redirected to /admin
 * - Authenticated customers (role === 'customer') are granted access
 */
export default function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="py-24 min-h-[60vh] flex items-center justify-center">
        <Container>
          <LoadingSpinner
            fullPage={false}
            size="lg"
            message="Verifying authenticated session..."
          />
        </Container>
      </div>
    );
  }

  // 1. Unauthenticated: Redirect to customer login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Administrator account: An admin must not be treated as a customer or access customer profile/orders
  if (profile?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  // 3. Authenticated customer
  return children;
}
