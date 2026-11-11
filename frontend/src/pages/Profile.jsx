import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  User,
  Mail,
  Phone,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  EyeOff,
  Save,
  X,
  Package,
  Truck,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

const Profile = () => {
  const { user: authUser, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  // Profile data states
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    createdAt: null,
    id: '',
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password change states
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Fetch authoritative user profile from backend on mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setLoadingProfile(true);
    setProfileError('');
    try {
      const res = await api.get('/auth/me');
      if (res.data?.success && res.data.data?.user) {
        const u = res.data.data.user;
        setProfileData({
          name: u.name || '',
          email: u.email || '',
          phone: u.phone || '',
          role: u.role || '',
          createdAt: u.createdAt || null,
          id: u.id || u._id || '',
        });
        updateUser(u);
      }
    } catch (err) {
      setProfileError(
        err.response?.data?.message || 'Unable to load profile from server'
      );
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    // Validations
    if (!profileData.name.trim() || profileData.name.trim().length < 2) {
      setProfileError('Full name must be at least 2 characters long');
      return;
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(profileData.email.trim())) {
      setProfileError('Please provide a valid email address');
      return;
    }

    const phoneRegex = /^[\d\s+\-()]{7,20}$/;
    if (!phoneRegex.test(profileData.phone.trim())) {
      setProfileError('Please enter a valid phone number (at least 7 digits)');
      return;
    }

    setSavingProfile(true);
    try {
      const res = await api.patch('/auth/profile', {
        name: profileData.name.trim(),
        email: profileData.email.trim().toLowerCase(),
        phone: profileData.phone.trim(),
      });

      if (res.data?.success && res.data.data?.user) {
        const updated = res.data.data.user;
        setProfileData((prev) => ({
          ...prev,
          name: updated.name,
          email: updated.email,
          phone: updated.phone,
        }));
        updateUser(updated);
        setIsEditing(false);
        setProfileSuccess('Profile updated successfully!');
        setTimeout(() => setProfileSuccess(''), 4000);
      } else {
        setProfileError(res.data?.message || 'Failed to update profile');
      }
    } catch (err) {
      setProfileError(
        err.response?.data?.message || 'Server error while saving profile'
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (!passwordForm.currentPassword) {
      setPasswordError('Current password is required');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await api.patch('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (res.data?.success) {
        setPasswordSuccess('Password changed successfully!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setTimeout(() => setPasswordSuccess(''), 5000);
      } else {
        setPasswordError(res.data?.message || 'Failed to change password');
      }
    } catch (err) {
      setPasswordError(
        err.response?.data?.message || 'Server error while changing password'
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const initials = profileData.name
    ? profileData.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <DashboardLayout title="Account & Profile Settings">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Hero Header Card */}
        <div className="bg-[#0B1F33] text-white rounded-[22px] border border-[#176B87]/40 p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#123B5D] text-[#00A6A6] flex items-center justify-center text-xl sm:text-2xl font-bold shadow-2xs shrink-0 border-2 border-[#176B87]/60">
              {initials}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {profileData.name || 'User Profile'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold capitalize bg-[#123B5D] text-white border border-[#176B87]">
                  {profileData.role || authUser?.role}
                </span>
              </div>
              <p className="text-xs text-[#DCE5EC] flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#8A9BAA]" />
                  <span className="break-all">{profileData.email}</span>
                </span>
                {profileData.phone && (
                  <>
                    <span className="text-[#176B87]">•</span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-[#8A9BAA]" />
                      <span>{profileData.phone}</span>
                    </span>
                  </>
                )}
              </p>
              {profileData.createdAt && (
                <p className="text-[11px] text-[#8A9BAA] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#8A9BAA]" />
                  <span>Member since {formatDate(profileData.createdAt)}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#176B87]/40">
            {!isEditing && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(true);
                  setSearchParams({ tab: 'profile' });
                }}
                className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-[#00A6A6] hover:bg-[#008F95] rounded-[11px] transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#D5DEE7] pb-2">
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'profile' })}
            className={`px-4 py-2 text-xs font-semibold rounded-[11px] transition cursor-pointer flex items-center gap-2 border ${
              activeTab === 'profile' || activeTab === 'settings'
                ? 'bg-[#0B1F33] text-white border-[#0B1F33] shadow-xs'
                : 'bg-[#E8EEF4] text-[#123B5D] hover:text-[#0B1F33] hover:bg-white border-[#D5DEE7]'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile Details</span>
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'password' })}
            className={`px-4 py-2 text-xs font-semibold rounded-[11px] transition cursor-pointer flex items-center gap-2 border ${
              activeTab === 'password'
                ? 'bg-[#0B1F33] text-white border-[#0B1F33] shadow-xs'
                : 'bg-[#E8EEF4] text-[#123B5D] hover:text-[#0B1F33] hover:bg-white border-[#D5DEE7]'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Change Password</span>
          </button>
        </div>

        {/* TAB 1: Profile & Account Settings */}
        {(activeTab === 'profile' || activeTab === 'settings') && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="md:col-span-2 bg-white rounded-2xl border border-[#DCE5EF] p-5 sm:p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#DCE5EF]">
                <div>
                  <h2 className="text-sm font-bold text-[#142B45]">Personal Information</h2>
                  <p className="text-xs text-[#64748B]">Update your primary contact and profile information</p>
                </div>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setProfileError('');
                      fetchUserProfile();
                    }}
                    className="p-1 rounded-lg text-[#64748B] hover:text-[#142B45] hover:bg-[#F0F4F8] transition cursor-pointer"
                    title="Cancel editing"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {profileSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-[#16A36A] font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{profileSuccess}</span>
                </div>
              )}

              {profileError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-[#DC5353] font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              {loadingProfile ? (
                <div className="py-12 text-center text-xs text-[#718096] flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-[#18A6A0] border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading user profile...</span>
                </div>
              ) : (
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#182433] mb-1.5 uppercase tracking-wider">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) =>
                        setProfileData({ ...profileData, name: e.target.value })
                      }
                      disabled={!isEditing || savingProfile}
                      placeholder="e.g. Jane Doe"
                      className="w-full h-10 px-3.5 rounded-xl border border-[#E2E8F0] text-xs sm:text-sm text-[#182433] bg-white focus:outline-none focus:border-[#18A6A0] focus:ring-1 focus:ring-[#18A6A0] disabled:bg-[#F4F6F8] disabled:text-[#718096] transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#182433] mb-1.5 uppercase tracking-wider">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) =>
                        setProfileData({ ...profileData, email: e.target.value })
                      }
                      disabled={!isEditing || savingProfile}
                      placeholder="name@example.com"
                      className="w-full h-10 px-3.5 rounded-xl border border-[#E2E8F0] text-xs sm:text-sm text-[#182433] bg-white focus:outline-none focus:border-[#18A6A0] focus:ring-1 focus:ring-[#18A6A0] disabled:bg-[#F4F6F8] disabled:text-[#718096] transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#182433] mb-1.5 uppercase tracking-wider">
                      Contact Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData({ ...profileData, phone: e.target.value })
                      }
                      disabled={!isEditing || savingProfile}
                      placeholder="e.g. +1 555-0199 or 9876543210"
                      className="w-full h-10 px-3.5 rounded-xl border border-[#E2E8F0] text-xs sm:text-sm text-[#182433] bg-white focus:outline-none focus:border-[#18A6A0] focus:ring-1 focus:ring-[#18A6A0] disabled:bg-[#F4F6F8] disabled:text-[#718096] transition"
                      required
                    />
                  </div>

                  {isEditing && (
                    <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#E2E8F0]">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setProfileError('');
                          fetchUserProfile();
                        }}
                        disabled={savingProfile}
                        className="px-4 py-2 text-xs font-semibold text-[#718096] hover:text-[#182433] hover:bg-[#F4F6F8] rounded-xl transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="px-4 py-2 text-xs font-semibold text-white bg-[#18A6A0] hover:bg-[#138580] rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-60"
                      >
                        {savingProfile ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            <span>Saving Changes...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </form>
              )}
            </div>

            {/* Account Details & Role Information Card */}
            <div className="space-y-4">
              <div className="bg-[#F1EFFA]/60 rounded-2xl border border-[#DFDAF4] p-5 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-[#DFDAF4]">
                  <div className="w-7 h-7 rounded-lg bg-[#52438F] text-white flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-[#52438F] uppercase tracking-wider">
                    Account Security & Role
                  </h3>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#DFDAF4]/60">
                    <span className="text-[#64748B]">Assigned Role:</span>
                    <span className="font-semibold text-[#142B45] capitalize">
                      {profileData.role || authUser?.role}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#DFDAF4]/60">
                    <span className="text-[#64748B]">Account Status:</span>
                    <span className="font-semibold text-[#16875D] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Active</span>
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#DFDAF4]/60">
                    <span className="text-[#64748B]">Account ID:</span>
                    <span className="font-mono text-[11px] text-[#64748B] truncate max-w-[130px]">
                      {profileData.id || authUser?.id || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#64748B]">Password:</span>
                    <button
                      type="button"
                      onClick={() => setSearchParams({ tab: 'password' })}
                      className="font-semibold text-[#18A6A0] hover:underline cursor-pointer"
                    >
                      Change Password
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#DFDAF4] text-[11px] text-[#5C567A] leading-relaxed">
                  Roles and permissions are governed by role-based access control. Profile updates do not alter account permissions.
                </div>
              </div>

              {/* Role specific quick action shortcuts */}
              <div className="bg-white rounded-2xl border border-[#DCE5EF] p-5 shadow-2xs space-y-2">
                <h4 className="text-xs font-bold text-[#142B45] uppercase tracking-wider mb-2">
                  Portal Shortcuts
                </h4>
                {authUser?.role === 'customer' && (
                  <div className="space-y-1 text-xs">
                    <Link
                      to="/customer/shipments"
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F4F6F8] text-[#182433] font-semibold transition"
                    >
                      <span className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-[#18A6A0]" />
                        <span>My Shipments History</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#718096]" />
                    </Link>
                    <Link
                      to="/customer/shipments/create"
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F4F6F8] text-[#182433] font-semibold transition"
                    >
                      <span className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-[#16A36A]" />
                        <span>Book New Delivery</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#718096]" />
                    </Link>
                  </div>
                )}
                {authUser?.role === 'courier' && (
                  <div className="space-y-1 text-xs">
                    <Link
                      to="/courier/shipments"
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F4F6F8] text-[#182433] font-semibold transition"
                    >
                      <span className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-[#142B45]" />
                        <span>Assigned Shipments</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#718096]" />
                    </Link>
                    <Link
                      to="/courier/simulator"
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F4F6F8] text-[#182433] font-semibold transition"
                    >
                      <span className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-[#18A6A0]" />
                        <span>GPS Road Simulator</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#718096]" />
                    </Link>
                  </div>
                )}
                {authUser?.role === 'admin' && (
                  <div className="space-y-1 text-xs">
                    <Link
                      to="/admin/shipments"
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F4F6F8] text-[#182433] font-semibold transition"
                    >
                      <span className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-[#142B45]" />
                        <span>All Platform Shipments</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#718096]" />
                    </Link>
                    <Link
                      to="/admin"
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F4F6F8] text-[#182433] font-semibold transition"
                    >
                      <span className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[#18A6A0]" />
                        <span>Dispatch Dashboard</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#718096]" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Change Password */}
        {activeTab === 'password' && (
          <div className="max-w-xl mx-auto bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs space-y-5">
            <div className="pb-3 border-b border-[#E2E8F0]">
              <h2 className="text-sm font-bold text-[#182433]">Security & Password</h2>
              <p className="text-xs text-[#718096]">
                Ensure your account stays secure by using a strong password of at least 6 characters.
              </p>
            </div>

            {passwordSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-[#16A36A] font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-[#DC5353] font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-semibold text-[#182433] mb-1.5 uppercase tracking-wider">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value,
                      })
                    }
                    placeholder="Enter current password"
                    className="w-full h-10 pl-3.5 pr-10 rounded-xl border border-[#E2E8F0] text-xs sm:text-sm text-[#182433] bg-white focus:outline-none focus:border-[#18A6A0] focus:ring-1 focus:ring-[#18A6A0] transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#718096] hover:text-[#182433] cursor-pointer"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-[#182433] mb-1.5 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                    placeholder="At least 6 characters"
                    className="w-full h-10 pl-3.5 pr-10 rounded-xl border border-[#E2E8F0] text-xs sm:text-sm text-[#182433] bg-white focus:outline-none focus:border-[#18A6A0] focus:ring-1 focus:ring-[#18A6A0] transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#718096] hover:text-[#182433] cursor-pointer"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-semibold text-[#182433] mb-1.5 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Repeat new password"
                    className="w-full h-10 pl-3.5 pr-10 rounded-xl border border-[#E2E8F0] text-xs sm:text-sm text-[#182433] bg-white focus:outline-none focus:border-[#18A6A0] focus:ring-1 focus:ring-[#18A6A0] transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#718096] hover:text-[#182433] cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordForm({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    });
                    setPasswordError('');
                    setSearchParams({ tab: 'profile' });
                  }}
                  disabled={savingPassword}
                  className="px-4 py-2 text-xs font-semibold text-[#718096] hover:text-[#182433] hover:bg-[#F4F6F8] rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#18A6A0] hover:bg-[#138580] rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {savingPassword ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Profile;
