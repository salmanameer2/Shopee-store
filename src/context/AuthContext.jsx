import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { getUserProfile, formatAuthError } from '../services/profileService.js';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ref to prevent onAuthStateChange race conditions during customer login verification
  const isCustomerSigningInRef = useRef(false);

  // Fetch or refresh profile data for a given user ID
  const fetchAndSetProfile = useCallback(async (userId, fallbackUser = null) => {
    if (!userId) {
      setProfile(null);
      return null;
    }

    try {
      const userProfile = await getUserProfile(userId);
      if (userProfile) {
        setProfile(userProfile);
        return userProfile;
      }

      // If profile row hasn't been created yet by trigger, create a fallback object from auth metadata
      if (fallbackUser) {
        const tempProfile = {
          id: fallbackUser.id,
          fullName: fallbackUser.user_metadata?.full_name || '',
          email: fallbackUser.email || '',
          phone: fallbackUser.phone || '',
          avatarUrl: '',
          role: 'customer',
          createdAt: fallbackUser.created_at || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setProfile(tempProfile);
        return tempProfile;
      }

      setProfile(null);
      return null;
    } catch (err) {
      console.warn('Could not fetch user profile:', err);
      setProfile(null);
      return null;
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    let isMounted = true;

    if (!isSupabaseConfigured() || !supabase) {
      setLoading(false);
      return;
    }

    // 1. Check existing session
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();

        if (error) {
          console.warn('Error fetching initial session:', error.message);
        }

        if (isMounted) {
          if (initialSession?.user) {
            setSession(initialSession);
            setUser(initialSession.user);
            await fetchAndSetProfile(initialSession.user.id, initialSession.user);
          } else {
            setSession(null);
            setUser(null);
            setProfile(null);
          }
        }
      } catch (err) {
        console.warn('Auth initialization error:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // 2. Subscribe to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;

        // If a customer login is actively undergoing role verification, defer setting user state
        // until signIn() verifies the role to prevent premature redirects of admin accounts
        if (isCustomerSigningInRef.current && currentSession?.user) {
          return;
        }

        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          await fetchAndSetProfile(currentSession.user.id, currentSession.user);
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [fetchAndSetProfile]);

  /**
   * Customer Registration
   * @param {Object} credentials - { fullName, email, password }
   */
  const signUp = async ({ fullName, email, password }) => {
    if (!isSupabaseConfigured() || !supabase) {
      return {
        success: false,
        error: 'Database connection is not configured.',
      };
    }

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = fullName.trim();

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
          },
        },
      });

      if (error) {
        return {
          success: false,
          error: formatAuthError(error),
        };
      }

      // Check if email confirmation is required (user exists but session is null)
      const isConfirmationRequired = Boolean(data?.user && !data?.session);

      if (data?.session && data?.user) {
        setSession(data.session);
        setUser(data.user);
        await fetchAndSetProfile(data.user.id, data.user);
      }

      return {
        success: true,
        data,
        isConfirmationRequired,
      };
    } catch (err) {
      return {
        success: false,
        error: formatAuthError(err),
      };
    }
  };

  /**
   * Customer Login
   * @param {Object} credentials - { email, password }
   */
  const signIn = async ({ email, password }) => {
    if (!isSupabaseConfigured() || !supabase) {
      return {
        success: false,
        error: 'Database connection is not configured.',
      };
    }

    isCustomerSigningInRef.current = true;

    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        isCustomerSigningInRef.current = false;
        return {
          success: false,
          error: formatAuthError(error),
        };
      }

      if (data?.session && data?.user) {
        // Enforce customer role separation: verify public.profiles.role directly
        const userProfile = await getUserProfile(data.user.id);
        const role = userProfile?.role || 'customer';

        if (role === 'admin') {
          // Immediately invalidate admin session in customer context
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setProfile(null);
          isCustomerSigningInRef.current = false;
          return {
            success: false,
            isAdminAccount: true,
            error: 'Admin accounts must use the Admin Login.',
          };
        }

        if (role !== 'customer') {
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setProfile(null);
          isCustomerSigningInRef.current = false;
          return {
            success: false,
            error: 'This account cannot access customer login.',
          };
        }

        // Valid customer account: persist session and user state
        isCustomerSigningInRef.current = false;
        setSession(data.session);
        setUser(data.user);
        setProfile(
          userProfile || {
            id: data.user.id,
            fullName: data.user.user_metadata?.full_name || '',
            email: data.user.email || '',
            phone: '',
            avatarUrl: '',
            role: 'customer',
          }
        );
      } else {
        isCustomerSigningInRef.current = false;
      }

      return {
        success: true,
        data,
      };
    } catch (err) {
      isCustomerSigningInRef.current = false;
      return {
        success: false,
        error: formatAuthError(err),
      };
    }
  };

  /**
   * Customer Logout
   */
  const signOut = async () => {
    try {
      if (isSupabaseConfigured() && supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Sign out error:', err);
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
    }
  };

  /**
   * Manually refresh profile from Supabase
   */
  const refreshProfile = async () => {
    if (user?.id) {
      return fetchAndSetProfile(user.id, user);
    }
    return null;
  };

  const value = {
    user,
    session,
    profile,
    loading,
    isAuthenticated: Boolean(user),
    signUp,
    signIn,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
