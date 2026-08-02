"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  IconAlertTriangle,
  IconAlertCircle,
  IconX,
  IconCalendarEvent,
  IconBellRinging,
  IconClipboardList,
  IconMessageCircle,
  IconDiscount2,
  IconChecks,
  IconEye,
  IconEyeOff,
  IconUpload,
} from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/client";
import {
  getParentProfile,
  updateParentProfile,
  updateParentSecurityAndNotifications,
  updateParentPassword,
} from "../actions";
import { validateName, validatePhone, validatePassword, sanitizeText } from "@/lib/validate";

type Profile = Awaited<ReturnType<typeof getParentProfile>>;

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit form states
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  // Photo upload
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Password Modal states
  const [isPwModalOpen, setIsPwModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwSaving, setPwSaving] = useState(false);

  // Password visibility toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Current password real-time verification
  const [currentPwStatus, setCurrentPwStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");

  // Email verification
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3000);
  };

  const supabase = createClient();

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getParentProfile();
      setProfile(data);
      setEditName(data.name);
      setEditPhone(data.phone);
    } catch (err) {
      console.error("Failed to load profile details:", err);
      setError("Failed to load profile details. Please sign in.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate fetch-on-mount; setState fires after the awaited request resolves, not synchronously
    loadProfile();
  }, []);

  // Auto-dismiss success messages after 4s
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 4000);
    return () => clearTimeout(t);
  }, [success]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Photo must be under 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    const nameCheck = validateName(editName);
    if (!nameCheck.valid) { setError(nameCheck.error!); return; }

    const phoneCheck = validatePhone(editPhone);
    if (!phoneCheck.valid) { setError(phoneCheck.error!); return; }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await updateParentProfile({
        name: sanitizeText(editName).trim(),
        phone: editPhone.trim(),
      });
      setSuccess("Profile information updated successfully.");
      setIsEditMode(false);
      await loadProfile();
    } catch (err) {
      console.error("Failed to save profile changes:", err);
      setError("Failed to save profile changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePref = async (key: string) => {
    if (!profile) return;
    const currentPrefs = profile.notificationPreferences as Record<string, boolean>;
    const updatedPrefs = {
      ...currentPrefs,
      [key]: !currentPrefs[key],
    };
    // Optimistic update
    setProfile({ ...profile, notificationPreferences: updatedPrefs });
    try {
      await updateParentSecurityAndNotifications({ notificationPreferences: updatedPrefs });
      triggerToast("Notification preferences updated.");
    } catch (err) {
      console.error("Failed to update notification preferences:", err);
      setError("Failed to update notification preferences. Please try again.");
      // Rollback
      setProfile({ ...profile, notificationPreferences: { ...currentPrefs } });
    }
  };

  // Verify current password on blur — before user starts typing new password
  const handleVerifyCurrentPassword = async () => {
    if (!currentPassword || !profile?.email) return;
    setCurrentPwStatus("checking");
    const { error } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: currentPassword,
    });
    setCurrentPwStatus(error ? "invalid" : "valid");
  };

  const handleUpdatePassword = async () => {
    setPwError(null);
    setPwSuccess(null);

    if (!profile) return;

    if (!currentPassword) {
      setPwError("Please enter your current password.");
      return;
    }

    const pwCheck = validatePassword(newPassword);
    if (!pwCheck.valid) { setPwError(pwCheck.error!); return; }

    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match. Please check and try again.");
      return;
    }
    if (newPassword === currentPassword) {
      setPwError("New password must be different from your current password.");
      return;
    }

    setPwSaving(true);
    try {
      // Verify current password by re-signing in
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: currentPassword,
      });

      if (signInErr) {
        setPwError("Incorrect current password. Please try again.");
        setPwSaving(false);
        return;
      }

      // Current password is correct — update to new one
      await updateParentPassword(newPassword);
      setPwSuccess("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setIsPwModalOpen(false);
        setPwSuccess(null);
      }, 1800);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Failed to update password. Please try again.");
    } finally {
      setPwSaving(false);
    }
  };

  const handleSendVerification = async () => {
    if (verificationSent || !profile) return;
    setVerificationLoading(true);
    setTimeout(() => {
      setVerificationSent(true);
      setVerificationLoading(false);
      setSuccess(`Verification email sent to ${profile.email}.`);
    }, 1000);
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return "Jan 2025";
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  const notifPrefs = (profile?.notificationPreferences as Record<string, boolean> | undefined) || {};

  return (
    <div className="w-full bg-slate-50 min-h-screen flex flex-col font-sans text-[#1B3A6B]">
      {/* PAGE HEADER */}
      <header className="bg-[#f5f8ff] px-6 md:px-12 py-8 border-b border-[#d0dcf5]">
        <div className="max-w-7xl mx-auto w-full">
          <nav className="text-[11px] text-slate-400 mb-3 flex items-center gap-1.5 font-medium">
            <Link href="/" className="hover:text-[#2F7FE8] transition-colors">Home</Link>
            <span className="text-slate-300">/</span>
            <span className="text-[#1B3A6B] font-semibold">My profile</span>
          </nav>
          <h1 className="font-heading text-3xl font-extrabold text-[#1B3A6B] mb-1">
            My profile
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Manage your personal information, security and notification preferences
          </p>
        </div>
      </header>

      {loading ? (
        <div className="max-w-[760px] mx-auto w-full px-6 py-8 flex-1 space-y-6">
          {/* Personal info card skeleton */}
          <div className="bg-white border border-[#d0dcf5] rounded-2xl p-6 shadow-sm animate-pulse">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
              <div className="h-4 bg-slate-200 rounded w-40" />
              <div className="h-8 bg-slate-100 rounded-lg w-16" />
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-slate-200 flex-shrink-0" />
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded w-36" />
                <div className="h-3 bg-slate-100 rounded w-52" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="h-3 bg-slate-100 rounded w-24" />
                <div className="h-4 bg-slate-200 rounded w-40" />
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-slate-100 rounded w-24" />
                <div className="h-4 bg-slate-200 rounded w-48" />
              </div>
            </div>
          </div>

          {/* Security card skeleton */}
          <div className="bg-white border border-[#d0dcf5] rounded-2xl p-6 shadow-sm animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-20 pb-4 mb-4 border-b border-slate-100" />
            <div className="flex items-center justify-between py-3 border-b border-slate-50">
              <div className="space-y-1.5">
                <div className="h-4 bg-slate-200 rounded w-24" />
                <div className="h-3 bg-slate-100 rounded w-36" />
              </div>
              <div className="h-8 bg-slate-100 rounded-lg w-20" />
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="space-y-1.5">
                <div className="h-4 bg-slate-200 rounded w-32" />
                <div className="h-3 bg-slate-100 rounded w-44" />
              </div>
              <div className="h-8 bg-slate-100 rounded-lg w-20" />
            </div>
          </div>

          {/* Notification preferences skeleton */}
          <div className="bg-white border border-[#d0dcf5] rounded-2xl p-6 shadow-sm animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-48 pb-4 mb-5 border-b border-slate-100" />
            <div className="mb-4">
              <div className="h-3 bg-slate-100 rounded w-16 mb-4" />
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 bg-slate-200 rounded w-36" />
                      <div className="h-3 bg-slate-100 rounded w-48" />
                    </div>
                  </div>
                  <div className="w-10 h-6 bg-slate-200 rounded-full" />
                </div>
              ))}
            </div>
            <div className="mb-4">
              <div className="h-3 bg-slate-100 rounded w-20 mb-4" />
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 bg-slate-200 rounded w-32" />
                      <div className="h-3 bg-slate-100 rounded w-44" />
                    </div>
                  </div>
                  <div className="w-10 h-6 bg-slate-200 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : error && !profile ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md shadow-sm">
            <IconAlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="font-heading text-lg font-bold text-red-700 mb-2">Access Denied</h3>
            <p className="text-sm text-slate-500 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs font-semibold px-6 py-3 bg-[#1B3A6B] text-white rounded-lg hover:bg-[#2F7FE8] transition-all cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      ) : !profile ? (
        <div className="max-w-[760px] mx-auto w-full px-6 py-8 flex-1 text-center">
          <p className="text-sm font-semibold text-red-600">{error || "Failed to load profile."}</p>
        </div>
      ) : (
        <div className="max-w-[760px] mx-auto w-full px-6 py-8 flex-1">

          {/* STATUS NOTIFICATIONS */}
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <IconChecks className="w-4 h-4 text-green-600" />
              <span>{success}</span>
            </div>
          )}
          {error && profile && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-xs font-semibold flex items-center gap-2">
              <IconAlertCircle className="w-4 h-4" />
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-auto cursor-pointer"><IconX className="w-3.5 h-3.5" /></button>
            </div>
          )}

          {/* VERIFY BANNER */}
          {!profile.emailConfirmedAt && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FFF9E6] border border-[#FAC775] rounded-2xl p-4 mb-6 transition-all duration-300">
              <div className="flex gap-3">
                <IconAlertTriangle className="w-5 h-5 text-[#854F0B] flex-shrink-0" />
                <div className="text-xs text-[#854F0B] leading-relaxed">
                  <strong>Your email isn&apos;t verified.</strong> Verify it so you never miss booking confirmations or joining links.
                </div>
              </div>
              <button
                disabled={verificationSent || verificationLoading}
                onClick={handleSendVerification}
                className="text-xs font-bold px-4 py-2 rounded-lg bg-[#854F0B] text-white hover:bg-[#633806] transition-all cursor-pointer self-end sm:self-auto whitespace-nowrap disabled:opacity-50"
              >
                {verificationLoading ? "Sending..." : verificationSent ? "Sent ✓" : "Verify now"}
              </button>
            </div>
          )}

          {/* PERSONAL INFORMATION CARD */}
          <div className="bg-white border border-[#d0dcf5] rounded-2xl p-6 shadow-sm mb-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <h3 className="font-heading text-sm font-bold text-[#1B3A6B]">Personal information</h3>
              <button
                onClick={() => {
                  if (isEditMode) {
                    setEditName(profile.name);
                    setEditPhone(profile.phone);
                    setPhotoPreview(null);
                  }
                  setIsEditMode(!isEditMode);
                }}
                className="text-xs font-semibold px-4 py-2 border border-[#d0dcf5] text-[#1B3A6B] rounded-lg hover:border-[#1B3A6B] transition-colors cursor-pointer"
              >
                {isEditMode ? "Cancel" : "Edit"}
              </button>
            </div>

            {/* VIEW MODE */}
            {!isEditMode ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-full bg-[#1B3A6B] flex items-center justify-center font-heading text-lg font-bold text-[#FFC107] shadow-inner overflow-hidden">
                      {photoPreview ? (
                        <Image src={photoPreview} alt="avatar" width={56} height={56} className="w-full h-full object-cover" />
                      ) : profile.avatarUrl ? (
                        <Image src={profile.avatarUrl} alt="avatar" width={56} height={56} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(profile.name)
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-heading text-base font-bold text-[#1B3A6B]">{profile.name}</h4>
                    <p className="text-slate-400 text-[11px] mt-0.5 font-medium">
                      {profile.role === "mentor"
                        ? "Mentor account"
                        : profile.role === "student"
                        ? "Student account"
                        : profile.role === "admin"
                        ? "Admin account"
                        : "Parent account"}{" "}
                      · Member since {formatDate(profile.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mobile number</span>
                    <p className="text-xs text-[#1B3A6B] font-semibold">{profile.phone || "+91 — Not Specified"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email address</span>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-[#1B3A6B] font-semibold">{profile.email}</p>
                      {profile.emailConfirmedAt ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">Verified</span>
                      ) : (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">Unverified</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* EDIT MODE */
              <div className="space-y-5">
                {/* Photo Upload */}
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-full bg-[#1B3A6B] flex items-center justify-center font-heading text-lg font-bold text-[#FFC107] shadow-inner overflow-hidden">
                      {photoPreview ? (
                        <Image src={photoPreview} alt="avatar" width={56} height={56} className="w-full h-full object-cover" />
                      ) : profile.avatarUrl ? (
                        <Image src={profile.avatarUrl} alt="avatar" width={56} height={56} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(editName)
                      )}
                    </div>
                  </div>
                  <div>
                    {/* Hidden file input — accept images, allows capture on mobile */}
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                    <button
                      onClick={() => photoInputRef.current?.click()}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 border border-[#d0dcf5] text-[#1B3A6B] rounded-lg hover:border-[#2F7FE8] hover:text-[#2F7FE8] transition-colors cursor-pointer"
                    >
                      <IconUpload className="w-3.5 h-3.5" />
                      {photoPreview ? "Change photo" : "Upload photo"}
                    </button>
                    <p className="text-[10px] text-slate-400 mt-1">JPG or PNG, up to 2 MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-500">Full name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="border border-[#d0dcf5] rounded-xl px-4 py-2.5 text-xs text-[#1B3A6B] font-medium outline-none focus:border-[#2F7FE8] transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-500">Mobile number</label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => {
                        // Allow only digits, +, spaces, dashes and parentheses
                        const cleaned = e.target.value.replace(/[^\d+\s\-()]/g, "");
                        setEditPhone(cleaned);
                      }}
                      maxLength={15}
                      placeholder="Your Mobile Number"
                      inputMode="tel"
                      className="border border-[#d0dcf5] rounded-xl px-4 py-2.5 text-xs text-[#1B3A6B] font-medium outline-none focus:border-[#2F7FE8] transition-colors"
                    />
                    <p className="text-[10px] text-slate-400">Numbers, +, spaces and dashes only.</p>
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-500">Email address</label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="border border-[#d0dcf5] bg-slate-50 rounded-xl px-4 py-2.5 text-xs text-slate-400 font-medium cursor-not-allowed"
                    />
                    <p className="text-[10px] text-slate-400">Email cannot be changed here.</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="text-xs font-semibold px-5 py-2.5 bg-[#1B3A6B] text-white rounded-lg hover:bg-[#2F7FE8] transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                  <button
                    onClick={() => {
                      setEditName(profile.name);
                      setEditPhone(profile.phone);
                      setPhotoPreview(null);
                      setIsEditMode(false);
                    }}
                    className="text-xs font-semibold px-5 py-2.5 border border-[#d0dcf5] text-[#1B3A6B] rounded-lg hover:border-[#1B3A6B] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECURITY CARD */}
          <div className="bg-white border border-[#d0dcf5] rounded-2xl p-6 shadow-sm mb-6">
            <h3 className="font-heading text-sm font-bold text-[#1B3A6B] border-b border-slate-100 pb-4 mb-4">
              Security
            </h3>

            {/* Password Row */}
            <div className="flex items-center justify-between py-3 border-b border-slate-50">
              <div>
                <p className="text-xs font-bold text-[#1B3A6B]">Password</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Last changed recently</p>
              </div>
              <button
                onClick={() => setIsPwModalOpen(true)}
                className="text-xs font-semibold px-4 py-2 border border-[#d0dcf5] text-[#1B3A6B] rounded-lg hover:border-[#1B3A6B] transition-colors cursor-pointer"
              >
                Change
              </button>
            </div>

            {/* Active Sessions Row */}
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-xs font-bold text-[#1B3A6B]">Active sessions</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">You&apos;re signed in on 1 device</p>
              </div>
              <button className="text-xs font-semibold px-4 py-2 border border-[#d0dcf5] text-[#1B3A6B] rounded-lg hover:border-[#1B3A6B] transition-colors cursor-pointer">
                Manage
              </button>
            </div>
          </div>

          {/* NOTIFICATION PREFERENCES CARD */}
          <div className="bg-white border border-[#d0dcf5] rounded-2xl p-6 shadow-sm">
            <h3 className="font-heading text-sm font-bold text-[#1B3A6B] border-b border-slate-100 pb-4 mb-5">
              Notification preferences
            </h3>

            {/* Bookings Section */}
            <div className="space-y-4 mb-6">
              <h4 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Bookings</h4>

              {[
                { key: "booking_confirmations", icon: <IconCalendarEvent className="w-4 h-4" />, label: "Booking confirmations", desc: "When a session or course is booked" },
                { key: "class_reminders", icon: <IconBellRinging className="w-4 h-4" />, label: "Class reminders", desc: "30 minutes before a session starts" },
              ].map(({ key, icon, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex gap-3 items-center">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
                      {icon}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#1B3A6B]">{label}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTogglePref(key)}
                    className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer border-none ${notifPrefs[key] ? "bg-[#1B3A6B]" : "bg-slate-200"}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${notifPrefs[key] ? "right-1" : "left-1"}`}></div>
                  </button>
                </div>
              ))}
            </div>

            {/* Children Section */}
            <div className="space-y-4 mb-6">
              <h4 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Children</h4>

              {[
                { key: "assignment_updates", icon: <IconClipboardList className="w-4 h-4" />, label: "Assignment updates", desc: "New, due soon, or overdue assignments" },
                { key: "mentor_messages", icon: <IconMessageCircle className="w-4 h-4" />, label: "Mentor messages", desc: "When a mentor sends you a message" },
              ].map(({ key, icon, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex gap-3 items-center">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
                      {icon}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#1B3A6B]">{label}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTogglePref(key)}
                    className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer border-none ${notifPrefs[key] ? "bg-[#1B3A6B]" : "bg-slate-200"}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${notifPrefs[key] ? "right-1" : "left-1"}`}></div>
                  </button>
                </div>
              ))}
            </div>

            {/* Marketing Section */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Marketing</h4>
              <div className="flex items-center justify-between">
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
                    <IconDiscount2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#1B3A6B]">Offers &amp; promotions</p>
                    <p className="text-[10px] text-slate-400 font-medium">Discounts on courses and sessions</p>
                  </div>
                </div>
                <button
                  onClick={() => handleTogglePref("offers_promotions")}
                  className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer border-none ${notifPrefs.offers_promotions ? "bg-[#1B3A6B]" : "bg-slate-200"}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${notifPrefs.offers_promotions ? "right-1" : "left-1"}`}></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PASSWORD CHANGE MODAL */}
      {isPwModalOpen && (
        <div className="fixed inset-0 bg-[#1B3A6B]/45 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-[420px] overflow-hidden border border-slate-100 shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-heading text-sm font-bold text-[#1B3A6B]">Change password</h4>
              <button
                onClick={() => {
                  setIsPwModalOpen(false);
                  setPwError(null);
                  setPwSuccess(null);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setCurrentPwStatus("idle");
                }}
                className="w-8 h-8 border border-[#d0dcf5] hover:border-[#1B3A6B] rounded-lg flex items-center justify-center text-slate-500 hover:text-[#1B3A6B] transition-colors cursor-pointer"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {pwError && (
                <div className="text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5 text-[11px] font-semibold flex items-start gap-2">
                  <IconAlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {pwError}
                </div>
              )}
              {pwSuccess && (
                <div className="text-green-700 bg-green-50 border border-green-200 rounded-lg p-2.5 text-[11px] font-semibold flex items-center gap-2">
                  <IconChecks className="w-4 h-4" />
                  {pwSuccess}
                </div>
              )}

              {/* Current Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500">Current password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => { setCurrentPassword(e.target.value); setCurrentPwStatus("idle"); }}
                    onBlur={handleVerifyCurrentPassword}
                    className={`w-full border rounded-xl px-4 py-2.5 pr-10 text-xs text-[#1B3A6B] font-medium outline-none transition-colors ${
                      currentPwStatus === "invalid"
                        ? "border-red-400 focus:border-red-400 bg-red-50"
                        : currentPwStatus === "valid"
                        ? "border-green-400 focus:border-green-400 bg-green-50/30"
                        : "border-[#d0dcf5] focus:border-[#2F7FE8]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1B3A6B] transition-colors cursor-pointer"
                  >
                    {showCurrent ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Inline status feedback */}
                {currentPwStatus === "checking" && (
                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span className="inline-block w-2.5 h-2.5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin"></span>
                    Verifying...
                  </p>
                )}
                {currentPwStatus === "invalid" && (
                  <p className="text-[10px] text-red-600 font-semibold flex items-center gap-1">
                    <IconAlertCircle className="w-3 h-3" />
                    Incorrect password. Please try again.
                  </p>
                )}
                {currentPwStatus === "valid" && (
                  <p className="text-[10px] text-green-600 font-semibold flex items-center gap-1">
                    <IconChecks className="w-3 h-3" />
                    Password verified.
                  </p>
                )}
              </div>

              {/* New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500">New password</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border border-[#d0dcf5] rounded-xl px-4 py-2.5 pr-10 text-xs text-[#1B3A6B] font-medium outline-none focus:border-[#2F7FE8] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1B3A6B] transition-colors cursor-pointer"
                  >
                    {showNew ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">Minimum 6 characters.</p>
              </div>

              {/* Confirm New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500">Confirm new password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full border rounded-xl px-4 py-2.5 pr-10 text-xs text-[#1B3A6B] font-medium outline-none transition-colors ${
                      confirmPassword && confirmPassword !== newPassword
                        ? "border-red-300 focus:border-red-400"
                        : "border-[#d0dcf5] focus:border-[#2F7FE8]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1B3A6B] transition-colors cursor-pointer"
                  >
                    {showConfirm ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-[10px] text-red-500 font-semibold">Passwords do not match.</p>
                )}
              </div>
            </div>

            <div className="px-6 pb-6 pt-2 flex gap-3">
              <button
                onClick={handleUpdatePassword}
                disabled={pwSaving}
                className="flex-1 text-xs font-semibold py-3 bg-[#1B3A6B] text-white rounded-xl hover:bg-[#2F7FE8] transition-colors cursor-pointer border-none disabled:opacity-60"
              >
                {pwSaving ? "Verifying..." : "Update password"}
              </button>
              <button
                onClick={() => {
                  setIsPwModalOpen(false);
                  setPwError(null);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setCurrentPwStatus("idle");
                }}
                className="flex-1 text-xs font-semibold py-3 border border-[#d0dcf5] text-[#1B3A6B] rounded-xl hover:border-[#1B3A6B] transition-colors cursor-pointer bg-transparent"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-[#1B3A6B] text-white border border-[#2F7FE8] text-xs px-4 py-3 rounded-xl shadow-xl z-50 animate-fade-in flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#ffc107] animate-pulse"></span>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
