import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import Container from '../components/common/Container.jsx';

/**
 * Route guard component for public-only auth routes (e.g. /login, /signup)
 * Automatically redirects authenticated customers to homepage (/)
 */
export default function PublicOnlyRoute({ children }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="py-24 min-h-[60vh] flex items-center justify-center">
        <Container>
          <LoadingSpinner
            fullPage={false}
            size="lg"
            message="Checking session..."
          />
        </Container>
      </div>
    );
  }

  if (user) {
    // If authenticated user is an administrator, redirect to /admin
    if (profile?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    // Authenticated customer: redirect to previous destination or homepage
    const fromPath = location.state?.from?.pathname || '/';
    return <Navigate to={fromPath} replace />;
  }

  return children;
}
