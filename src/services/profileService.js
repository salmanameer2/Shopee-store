import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

/**
 * Normalizes raw database profile row into camelCase object
 */
export const normalizeProfile = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name || '',
    email: row.email || '',
    phone: row.phone || '',
    avatarUrl: row.avatar_url || '',
    role: row.role || 'customer',
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
};

/**
 * Fetch profile data for an authenticated user from public.profiles
 * @param {string} userId - User UUID
 * @returns {Promise<Object|null>}
 */
export const getUserProfile = async (userId) => {
  if (!userId) return null;

  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, avatar_url, role, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Error loading user profile from Supabase:', error.message);
      return null;
    }

    return normalizeProfile(data);
  } catch (err) {
    console.warn('Profile fetch exception:', err);
    return null;
  }
};

/**
 * Alias for getUserProfile matching Phase 7 naming
 */
export const getProfile = getUserProfile;

/**
 * Retrieves the application role ('customer' | 'admin') directly from public.profiles
 *
 * @param {string} userId - Supabase Auth User ID (UUID)
 * @returns {Promise<'customer'|'admin'|null>}
 */
export const getUserRole = async (userId) => {
  if (!userId || !isSupabaseConfigured() || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return null;
    return data.role || 'customer';
  } catch (err) {
    console.warn('Error retrieving user role from database:', err);
    return null;
  }
};

/**
 * Updates allowed customer profile fields in public.profiles
 * Strictly whitelists only: full_name, phone, avatar_url.
 * Never allows role, id, email, created_at, or updated_at to be overridden.
 *
 * @param {string} userId - Authenticated user UUID
 * @param {Object} profileData - { fullName, phone, avatarUrl }
 * @returns {Promise<{ success: boolean, profile?: Object, error?: string }>}
 */
export const updateProfile = async (userId, profileData) => {
  if (!userId) {
    return { success: false, error: 'User ID is required.' };
  }

  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Database connection is not configured.' };
  }

  // Strict whitelist of customer-editable fields
  const cleanFullName = profileData?.fullName !== undefined
    ? String(profileData.fullName).trim()
    : undefined;

  const cleanPhone = profileData?.phone !== undefined
    ? String(profileData.phone).trim()
    : undefined;

  const cleanAvatarUrl = profileData?.avatarUrl !== undefined
    ? String(profileData.avatarUrl).trim()
    : undefined;

  const updatePayload = {};
  if (cleanFullName !== undefined) updatePayload.full_name = cleanFullName;
  if (cleanPhone !== undefined) updatePayload.phone = cleanPhone;
  if (cleanAvatarUrl !== undefined) updatePayload.avatar_url = cleanAvatarUrl;

  if (Object.keys(updatePayload).length === 0) {
    return { success: false, error: 'No valid profile fields provided for update.' };
  }

  try {
    // 1. Update public.profiles table (guarded by RLS)
    const { data, error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId)
      .select('id, full_name, email, phone, avatar_url, role, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error updating profile in Supabase:', error);
      return {
        success: false,
        error: formatProfileError(error),
      };
    }

    // 2. Synchronize full_name with Supabase Auth metadata for seamless session persistence
    if (cleanFullName !== undefined) {
      try {
        await supabase.auth.updateUser({
          data: { full_name: cleanFullName },
        });
      } catch (authMetaErr) {
        console.warn('Non-fatal: Auth metadata sync skipped:', authMetaErr);
      }
    }

    return {
      success: true,
      profile: normalizeProfile(data),
      message: 'Profile updated successfully.',
    };
  } catch (err) {
    console.error('Profile update exception:', err);
    return {
      success: false,
      error: formatProfileError(err),
    };
  }
};

/**
 * Friendly error message translator for profile errors
 */
export const formatProfileError = (error) => {
  if (!error) return 'An unexpected profile error occurred. Please try again.';

  const msg = typeof error === 'string' ? error : error.message || error.details || '';
  const lower = msg.toLowerCase();

  if (lower.includes('violates row-level security') || lower.includes('policy')) {
    return 'Permission denied. You can only view and update your own profile.';
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Network connection error. Please check your connection and retry.';
  }

  return msg || 'Unable to update profile. Please try again.';
};

/**
 * Friendly error message translator for Supabase authentication errors
 */
export const formatAuthError = (error) => {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const msg = typeof error === 'string' ? error : error.message || '';
  const lower = msg.toLowerCase();

  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }

  if (lower.includes('user already registered') || lower.includes('email already exists') || lower.includes('already registered')) {
    return 'An account with this email address already exists. Please sign in.';
  }

  if (lower.includes('password should be at least 6 characters') || lower.includes('weak password')) {
    return 'Password must be at least 6 characters long.';
  }

  if (lower.includes('email not confirmed')) {
    return 'Please confirm your email address via the verification link sent to your inbox before signing in.';
  }

  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many login attempts. Please wait a few moments and try again.';
  }

  if (lower.includes('network') || lower.includes('fetch') || lower.includes('failed to fetch')) {
    return 'Unable to reach the server. Please check your internet connection.';
  }

  return msg || 'Something went wrong. Please try again.';
};

export default {
  normalizeProfile,
  getUserProfile,
  getProfile,
  getUserRole,
  updateProfile,
  formatProfileError,
  formatAuthError,
};
