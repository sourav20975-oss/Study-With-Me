import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api/client.js';
import {
  BookOpen,
  Bell,
  ArrowRightLeft,
  LogOut,
  Newspaper,
  Menu,
  Sparkles,
  GraduationCap,
  Camera,
  Upload,
  User,
  Check,
  X,
  Edit2,
  Trash2,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export function TopHeader({ onToggleMenu }) {
  const { user, isAdmin, isStudent, updateProfile, switchDemoRole, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSwitching, setIsSwitching] = useState(false);

  // Profile Edit Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [bioInput, setBioInput] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  useEffect(() => {
    async function fetchNotifs() {
      try {
        const res = await api.get('/notifications');
        const unread = (res.notifications || []).filter((n) => !n.isRead).length;
        setUnreadCount(unread);
      } catch (e) {
        // ignore
      }
    }
    fetchNotifs();
  }, [user]);

  // Open Profile Edit Modal
  const handleOpenProfileModal = () => {
    setNameInput(user?.name || '');
    setAvatarUrlInput(user?.avatarUrl || '');
    setPhoneInput(user?.phone || '');
    setBioInput(user?.bio || '');
    setSaveSuccessMsg('');
    setShowProfileModal(true);
  };

  // Upload Profile Picture File
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const res = await api.upload(file);
      setAvatarUrlInput(res.url);
    } catch (err) {
      alert(err.message || 'Image upload failed. Please try a valid image file.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Remove Profile Picture
  const handleRemovePhoto = () => {
    setAvatarUrlInput('');
  };

  // Save Profile Changes (CRUD: Update)
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      alert('Please enter a valid name.');
      return;
    }

    setIsSavingProfile(true);
    try {
      await updateProfile({
        name: nameInput.trim(),
        avatarUrl: avatarUrlInput || null,
        phone: phoneInput.trim(),
        bio: bioInput.trim()
      });

      setSaveSuccessMsg('Profile updated successfully!');
      setTimeout(() => {
        setSaveSuccessMsg('');
        setShowProfileModal(false);
      }, 1200);
    } catch (err) {
      alert(err.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Seamless, bulletproof role switcher between Tutor and Student
  const handleRoleSwitch = async () => {
    if (isSwitching) return;
    setIsSwitching(true);
    try {
      const targetRole = isAdmin ? 'student' : 'admin';
      await switchDemoRole(targetRole);
      // Hard navigation ensures clean token & role reload, bypassing any ProtectedRoute race conditions
      window.location.href = targetRole === 'admin' ? '/admin' : '/app';
    } catch (err) {
      console.error('Role switch failed:', err);
      setIsSwitching(false);
      alert('Failed to switch profile. Please try again.');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/90 px-4 sm:px-8 py-2.5 shadow-xs w-full">
      <div className="w-full flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          {onToggleMenu && (
            <button
              onClick={onToggleMenu}
              className="lg:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100 transition-colors"
              aria-label="Toggle Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link to={isAdmin ? '/admin' : '/app'} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-display font-extrabold text-base shadow-sm group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-orange-600 transition-colors">
                StudySathi
              </span>
              <span className={`text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-0.5 rounded-full border ${
                isAdmin
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : 'bg-orange-100 text-orange-700 border-orange-200'
              }`}>
                {isAdmin ? 'Tutor Desk' : 'Class 8 Hub'}
              </span>
            </div>
          </Link>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Science News Link */}
          <Link
            to={isAdmin ? '/admin/news' : '/app/news'}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl border border-teal-200 transition-colors shadow-2xs"
          >
            <Newspaper className="w-3.5 h-3.5 text-teal-600" />
            <span>Science Watch 🔬</span>
          </Link>

          {/* Notifications */}
          <Link
            to={isAdmin ? '/admin/doubts' : '/app/notifications'}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors relative"
            title="Notifications & Doubts"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            )}
          </Link>

          {/* Role Switcher Button - ONLY for Admin to preview student view */}
          {isAdmin && (
            <button
              type="button"
              onClick={handleRoleSwitch}
              disabled={isSwitching}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl border transition-all shadow-xs active:scale-95 disabled:opacity-60 cursor-pointer bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 hover:border-orange-300"
              title="Switch to Student Hub view"
            >
              <ArrowRightLeft className={`w-3.5 h-3.5 ${isSwitching ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSwitching ? 'Switching...' : 'Switch to'}</span>
              <span className="font-extrabold underline decoration-2 underline-offset-2">
                Student Hub
              </span>
            </button>
          )}

          {/* Interactive Profile Pill (Click to Edit Profile & Photo) */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <button
              type="button"
              onClick={handleOpenProfileModal}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl hover:bg-slate-100 transition-colors group cursor-pointer border border-transparent hover:border-slate-200"
              title="Click to Edit Profile & Change Photo"
            >
              {/* Profile Avatar Image or Initial */}
              <div className="relative">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user?.name || 'Profile'}
                    className="w-8 h-8 rounded-full object-cover border border-slate-300 shadow-2xs group-hover:ring-2 group-hover:ring-orange-400 transition-all"
                  />
                ) : (
                  <div
                    className={`w-8 h-8 rounded-full font-extrabold text-xs flex items-center justify-center border shadow-2xs group-hover:ring-2 group-hover:ring-orange-400 transition-all ${
                      isAdmin
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-orange-100 text-orange-700 border-orange-200'
                    }`}
                  >
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shadow-xs border border-slate-200 text-slate-500 group-hover:text-orange-600">
                  <Edit2 className="w-2 h-2" />
                </div>
              </div>

              {/* User Name on desktop */}
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors leading-tight truncate max-w-[110px]">
                  {user?.name || 'My Profile'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  Edit Profile
                </span>
              </div>
            </button>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* PROFILE & AVATAR EDIT MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveProfile}
            className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full space-y-5 shadow-2xl my-6"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900">
                  Edit Profile & Photo
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your display name and upload a custom avatar.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success notification */}
            {saveSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {/* Avatar Upload / Preview Section */}
            <div className="flex flex-col items-center justify-center space-y-3 pt-1">
              <div className="relative group">
                {avatarUrlInput ? (
                  <img
                    src={avatarUrlInput}
                    alt="Preview"
                    className="w-24 h-24 rounded-full object-cover border-3 border-orange-400 shadow-md"
                  />
                ) : (
                  <div
                    className={`w-24 h-24 rounded-full font-extrabold text-3xl flex items-center justify-center border-3 border-slate-300 shadow-md ${
                      isAdmin
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {nameInput.charAt(0) || user?.name?.charAt(0) || 'U'}
                  </div>
                )}

                {/* Upload Button Overlay */}
                <label
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white shadow-md cursor-pointer transition-all border-2 border-white"
                  title="Upload image from computer"
                >
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={isUploadingPhoto}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Upload Actions */}
              <div className="flex items-center gap-2 text-xs">
                <label className="text-orange-600 hover:underline font-bold cursor-pointer">
                  <span>{isUploadingPhoto ? 'Uploading photo...' : '+ Upload New Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={isUploadingPhoto}
                    className="hidden"
                  />
                </label>

                {avatarUrlInput && (
                  <>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="text-rose-600 hover:underline font-semibold"
                    >
                      Remove Photo
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Display Name *
              </label>
              <input
                type="text"
                required
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Sourav Kumar / Aarav Sharma"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50 text-slate-900 font-semibold focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>

            {/* Image URL (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Avatar Image URL (Optional)
              </label>
              <input
                type="text"
                value={avatarUrlInput}
                onChange={(e) => setAvatarUrlInput(e.target.value)}
                placeholder="https://images.unsplash.com/... or paste image link"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-800 font-medium focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>

            {/* Account Info (Read-only Role & Email) */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Account Email:</span>
                <span className="font-bold text-slate-800">{user?.email || 'user@studysathi.com'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Assigned Role:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  isAdmin ? 'bg-amber-100 text-amber-800' : 'bg-orange-100 text-orange-700'
                }`}>
                  {isAdmin ? 'Tutor Admin' : 'Class 8 Student'}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingProfile || isUploadingPhoto}
                className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              >
                {isSavingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      )}
    </header>
  );
}

export default TopHeader;
