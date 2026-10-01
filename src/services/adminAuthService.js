import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { getUserProfile, formatAuthError } from './profileService.js';

/**
 * Verifies whether an authenticated user has the 'admin' role in public.profiles.
 * The database remains the ultimate source of truth.
 *
 * @param {string} userId - Supabase Auth User ID (UUID)
 * @returns {Promise<{ isAdmin: boolean, profile: Object|null, error?: string }>}
 */
export const verifyAdminRole = async (userId) => {
  if (!userId) {
    return { isAdmin: false, profile: null, error: 'User ID is required.' };
  }

  if (!isSupabaseConfigured() || !supabase) {
    return { isAdmin: false, profile: null, error: 'Database connection is not configured.' };
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Error verifying admin profile in Supabase:', error.message);
      return { isAdmin: false, profile: null, error: error.message };
    }

    if (!data) {
      return { isAdmin: false, profile: null, error: 'Profile not found.' };
    }

    const isAdmin = data.role === 'admin';
    return {
      isAdmin,
      profile: data,
    };
  } catch (err) {
    console.error('Exception during admin verification:', err);
    return { isAdmin: false, profile: null, error: 'Verification failed.' };
  }
};

/**
 * Authenticates an administrator via Supabase Auth email/password.
 * Validates that the authenticated profile has role === 'admin'.
 * If a customer attempts to sign in through the admin portal, the session is
 * immediately invalidated (signOut) and access is strictly denied.
 *
 * @param {Object} credentials - { email, password }
 * @returns {Promise<{ success: boolean, user?: Object, profile?: Object, error?: string }>}
 */
export const adminSignIn = async ({ email, password }) => {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      error: 'Database connection is not configured.',
    };
  }

  if (!email || !email.trim()) {
    return { success: false, error: 'Admin email is required.' };
  }
  if (!password) {
    return { success: false, error: 'Admin password is required.' };
  }

  try {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (authError) {
      return {
        success: false,
        error: formatAuthError(authError),
      };
    }

    if (!authData?.user) {
      return {
        success: false,
        error: 'Authentication failed. Please check your credentials.',
      };
    }

    // 2. Fetch profile and verify 'admin' role directly from public.profiles
    const verification = await verifyAdminRole(authData.user.id);

    if (!verification.isAdmin) {
      // Immediately invalidate customer session in admin context
      await supabase.auth.signOut();
      return {
        success: false,
        error: 'You do not have administrator access.',
      };
    }

    return {
      success: true,
      user: authData.user,
      profile: verification.profile,
    };
  } catch (err) {
    console.error('Admin login exception:', err);
    return {
      success: false,
      error: 'Unable to sign in right now. Please try again.',
    };
  }
};

/**
 * Signs out the administrator and invalidates the Supabase session
 */
export const adminSignOut = async () => {
  try {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
    }
  } catch (err) {
    console.warn('Admin logout exception:', err);
  }
};

export default {
  verifyAdminRole,
  adminSignIn,
  adminSignOut,
};
