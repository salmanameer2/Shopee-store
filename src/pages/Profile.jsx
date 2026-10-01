import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  FiUser,
  FiPackage,
  FiShield,
  FiMail,
  FiPhone,
  FiCalendar,
  FiLogOut,
  FiCheckCircle,
  FiEdit2,
  FiSave,
  FiX,
  FiAlertCircle,
  FiInfo,
} from 'react-icons/fi';
import Container from '../components/common/Container.jsx';
import Button from '../components/common/Button.jsx';
import SectionHeading from '../components/common/SectionHeading.jsx';
import ScrollReveal from '../components/common/ScrollReveal.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { updateProfile } from '../services/profileService.js';

export default function Profile() {
  const { user, profile, refreshProfile, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
  });

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Sync state with current profile
  useEffect(() => {
    if (profile || user) {
      setFormData({
        fullName: profile?.fullName || user?.user_metadata?.full_name || '',
        phone: profile?.phone || '',
      });
    }
  }, [profile, user]);

  const handleLogout = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage(null);
    if (successMessage) setSuccessMessage(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      fullName: profile?.fullName || user?.user_metadata?.full_name || '',
      phone: profile?.phone || '',
    });
    setErrorMessage(null);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (!formData.fullName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await updateProfile(user?.id, {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
      });

      if (res.success) {
        await refreshProfile();
        setIsEditing(false);
        setSuccessMessage('Your profile information has been updated successfully.');
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setErrorMessage(res.error || 'Failed to update profile. Please try again.');
      }
    } catch (err) {
      console.error('Error in handleSaveProfile:', err);
      setErrorMessage('An unexpected error occurred while saving profile.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading && !user) {
    return (
      <div className="py-24 flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading customer profile..." />
      </div>
    );
  }

  const fullName = profile?.fullName || user?.user_metadata?.full_name || 'Shopee Customer';
  const email = profile?.email || user?.email || 'customer@example.com';
  const phone = profile?.phone || 'Not provided yet';
  const role = profile?.role || 'customer';
  const createdAt = profile?.createdAt || user?.created_at;

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recent Member';

  const userInitial = (fullName.charAt(0) || 'C').toUpperCase();

  return (
    <div className="py-8 sm:py-12 space-y-8 min-h-[80vh] bg-neutral-50/40">
      <Container>
        <ScrollReveal variant="fade-up">
          <SectionHeading
            title="My Account Profile"
            subtitle="Manage your personal details and view account security status"
            align="left"
          />
        </ScrollReveal>

        {/* Notifications */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 flex items-center gap-3 shadow-xs text-sm"
            >
              <FiCheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span className="font-semibold">{successMessage}</span>
            </motion.div>
          )}

          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 flex items-center gap-3 shadow-xs text-sm"
            >
              <FiAlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span className="font-semibold">{errorMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Customer Avatar Card & Quick Links */}
          <ScrollReveal variant="fade-right" delay={0.1} className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-neutral-200 shadow-xs space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#FF5722] text-white flex items-center justify-center font-black text-2xl shadow-sm flex-shrink-0">
                  {userInitial}
                </div>
                <div className="overflow-hidden min-w-0">
                  <h3 className="text-lg font-bold text-neutral-900 truncate">
                    {fullName}
                  </h3>
                  <p className="text-xs text-neutral-500 truncate mt-0.5">{email}</p>
                  {/* Read-Only Account Role Badge (No role editing) */}
                  <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
                    <FiCheckCircle className="w-3 h-3 text-emerald-600" /> {role} Account
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 space-y-3 text-xs text-neutral-600">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 flex items-center gap-1.5">
                    <FiMail className="w-3.5 h-3.5" /> Email:
                  </span>
                  <span className="font-semibold text-neutral-800 truncate max-w-[180px]">
                    {email}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 flex items-center gap-1.5">
                    <FiPhone className="w-3.5 h-3.5" /> Phone:
                  </span>
                  <span className="font-semibold text-neutral-800 truncate max-w-[180px]">
                    {phone}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 flex items-center gap-1.5">
                    <FiCalendar className="w-3.5 h-3.5" /> Member Since:
                  </span>
                  <span className="font-semibold text-neutral-800">
                    {formattedDate}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 space-y-2.5">
                <Link to="/orders" className="block">
                  <Button variant="primary" size="md" className="w-full justify-center shadow-md shadow-[#FF5722]/15">
                    <FiPackage className="w-4 h-4" /> View My Orders
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  size="md"
                  onClick={handleLogout}
                  className="w-full justify-center text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                >
                  <FiLogOut className="w-4 h-4" /> Log Out
                </Button>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-white rounded-3xl p-5 border border-neutral-200 shadow-2xs text-xs text-neutral-600 space-y-2">
              <div className="flex items-center gap-2 font-bold text-neutral-900">
                <FiShield className="text-[#FF5722] w-4 h-4" /> Row-Level Security Enforced
              </div>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Your profile is protected by PostgreSQL RLS. Only your authenticated user ID (<code className="font-mono text-neutral-700 bg-neutral-100 px-1 py-0.5 rounded">{user?.id?.slice(0, 8)}...</code>) can read or update this record.
              </p>
            </div>
          </ScrollReveal>

          {/* RIGHT: Personal Information & Edit Form */}
          <ScrollReveal variant="fade-left" delay={0.15} className="lg:col-span-8 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                <div>
                  <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                    <FiUser className="text-[#FF5722]" /> Personal Information
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Update your display name and courier contact details
                  </p>
                </div>

                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="gap-1.5 text-xs text-neutral-700 border-neutral-300 hover:border-[#FF5722] hover:text-[#FF5722]"
                  >
                    <FiEdit2 className="w-3.5 h-3.5" /> Edit Profile
                  </Button>
                )}
              </div>

              {isEditing ? (
                /* Editable Form */
                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                          <FiUser className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="Your full name"
                          required
                          className="w-full pl-10 pr-4 py-3 bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200 focus:border-[#FF5722] focus:ring-2 focus:ring-orange-100 rounded-xl text-sm font-medium text-neutral-900 transition-all outline-none"
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                        Contact Phone Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                          <FiPhone className="w-4 h-4" />
                        </div>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="e.g. 0300 1234567"
                          className="w-full pl-10 pr-4 py-3 bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200 focus:border-[#FF5722] focus:ring-2 focus:ring-orange-100 rounded-xl text-sm font-medium text-neutral-900 transition-all outline-none"
                        />
                      </div>
                      <p className="text-[11px] text-neutral-400">
                        Used for courier delivery notifications and Cash on Delivery order verification.
                      </p>
                    </div>

                    {/* Read-Only Email */}
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">
                        Registered Email (Read-Only)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                          <FiMail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          value={email}
                          disabled
                          className="w-full pl-10 pr-4 py-3 bg-neutral-100 border border-neutral-200 rounded-xl text-sm font-medium text-neutral-500 cursor-not-allowed outline-none"
                        />
                      </div>
                      <p className="text-[11px] text-neutral-400 flex items-center gap-1 mt-1">
                        <FiInfo className="w-3.5 h-3.5 text-neutral-400" />
                        Primary authentication email cannot be modified from customer profile.
                      </p>
                    </div>
                  </div>

                  {/* Form Action Buttons */}
                  <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="cursor-pointer"
                    >
                      <FiX className="w-4 h-4" /> Cancel
                    </Button>

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={saving}
                      className="shadow-md shadow-[#FF5722]/20 cursor-pointer"
                    >
                      {saving ? (
                        <div className="flex items-center gap-2">
                          <LoadingSpinner size="sm" color="white" />
                          <span>Saving Profile...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <FiSave className="w-4 h-4" />
                          <span>Save Changes</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                /* Read-Only Display Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-1">
                    <span className="text-neutral-400 text-[11px] block font-semibold uppercase tracking-wider">
                      Full Name
                    </span>
                    <span className="font-bold text-neutral-900 text-sm">{fullName}</span>
                  </div>

                  <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-1">
                    <span className="text-neutral-400 text-[11px] block font-semibold uppercase tracking-wider">
                      Registered Email
                    </span>
                    <span className="font-bold text-neutral-900 text-sm truncate block">{email}</span>
                  </div>

                  <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-1">
                    <span className="text-neutral-400 text-[11px] block font-semibold uppercase tracking-wider">
                      Contact Phone
                    </span>
                    <span className="font-bold text-neutral-900 text-sm">
                      {phone || 'None provided'}
                    </span>
                  </div>

                  <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-1">
                    <span className="text-neutral-400 text-[11px] block font-semibold uppercase tracking-wider">
                      Account Status
                    </span>
                    <span className="font-bold text-emerald-700 text-sm flex items-center gap-1.5">
                      <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Active Customer
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Shopping Activity Banner */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-neutral-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <FiPackage className="text-[#FF5722]" /> Track Your Purchases
                </h4>
                <p className="text-xs text-neutral-500">
                  Review ordered item snapshots, delivery addresses, and real-time courier statuses.
                </p>
              </div>

              <Link to="/orders" className="self-start sm:self-auto flex-shrink-0">
                <Button variant="primary" size="sm" className="shadow-sm shadow-[#FF5722]/20">
                  Open Order History
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </Container>
    </div>
  );
}
