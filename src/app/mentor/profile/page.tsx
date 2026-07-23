"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  IconAlertCircle, IconX, IconChecks, IconEye,
  IconEyeOff, IconCertificate
} from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/client";
import { getMentorProfile, updateMentorProfile, updateParentPassword } from "@/app/actions";
import { validateName } from "@/lib/validate";

function Skel({ className }: { className?: string }) {
  return <div className={`animate-shimmer bg-slate-100 rounded-xl ${className}`} />;
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* PERSONAL INFORMATION CARD SKELETON */}
      <div className="bg-white border border-[#D0DCF5] rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <Skel className="h-5 w-24" />
          <Skel className="h-8 w-16" />
        </div>
        <div className="flex items-center gap-4">
          <Skel className="w-14 h-14 rounded-full" />
          <div className="space-y-2">
            <Skel className="h-4 w-32" />
            <Skel className="h-3 w-48" />
          </div>
        </div>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Skel className="h-3 w-20" />
            <Skel className="h-12 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skel className="h-3 w-20" />
            <Skel className="h-8 w-44 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MentorProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<(Awaited<ReturnType<typeof getMentorProfile>> & { avatarUrl?: string }) | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit form states
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editQualification, setEditQualification] = useState("");
  const [editExpertise, setEditExpertise] = useState(""); // comma separated input
  const [editHourlyRate, setEditHourlyRate] = useState<number>(0);

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

  // Current password real-time verification status
  const [currentPwStatus, setCurrentPwStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");

  const supabase = createClient();

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getMentorProfile();
      setProfile(data);
      setEditName(data.name);
      setEditBio(data.bio || "");
      setEditQualification(data.qualification || "");
      setEditExpertise(data.expertise ? data.expertise.join(", ") : "");
      setEditHourlyRate(data.hourlyRate || 0);
    } catch (err) {
      console.error("Failed to load profile details:", err);
      setError("Failed to load profile details.");
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

  const handleSaveProfile = async () => {
    const nameCheck = validateName(editName);
    if (!nameCheck.valid) { setError(nameCheck.error!); return; }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const expertiseArr = editExpertise
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      await updateMentorProfile({
        name: editName.trim(),
        bio: editBio.trim(),
        qualification: editQualification.trim(),
        expertise: expertiseArr,
        hourlyRate: Number(editHourlyRate),
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

    if (!currentPassword) {
      setPwError("Please enter your current password.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPwError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }

    setPwSaving(true);
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: profile!.email,
        password: currentPassword,
      });

      if (signInErr) {
        setPwError("Incorrect current password. Please try again.");
        setPwSaving(false);
        return;
      }

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
      setPwError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="max-w-[760px] w-full space-y-6 text-[#1B3A6B]">
      {/* PAGE HEADER */}
      <div>
        <h1 className="text-[22px] font-extrabold font-heading text-[#1B3A6B]">
          Tutor Profile
        </h1>
        <p className="text-[13px] text-[#4A5A7A] mt-0.5">
          Manage your tutor information, qualifications, subject expertise, and account security.
        </p>
      </div>

      {loading ? (
        <ProfileSkeleton />
      ) : (
        <>
          {/* PERSONAL INFORMATION CARD */}
          <div className="bg-white border border-[#D0DCF5] rounded-2xl p-6 shadow-none">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <h3 className="font-heading text-sm font-bold text-[#1B3A6B]">Tutor Details</h3>
              <button
                onClick={() => {
                  if (isEditMode) {
                    setEditName(profile!.name);
                    setEditBio(profile!.bio || "");
                    setEditQualification(profile!.qualification || "");
                    setEditExpertise(profile!.expertise ? profile!.expertise.join(", ") : "");
                    setEditHourlyRate(profile!.hourlyRate || 0);
                  }
                  setIsEditMode(!isEditMode);
                }}
                className="text-xs font-semibold px-4 py-2 border border-[#D0DCF5] text-[#1B3A6B] rounded-lg hover:border-[#1B3A6B] hover:bg-slate-50 transition-colors cursor-pointer bg-white"
              >
                {isEditMode ? "Cancel" : "Edit"}
              </button>
            </div>

            {/* VIEW MODE */}
            {!isEditMode ? (() => {
              const p = profile!;
              return (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#0f2347] flex items-center justify-center font-heading text-lg font-bold text-[#ffc107] shadow-inner overflow-hidden shrink-0">
                    {p.avatarUrl ? (
                      <Image src={p.avatarUrl} alt="avatar" width={56} height={56} className="w-full h-full object-cover" />
                    ) : (
                      p.avatarText
                    )}
                  </div>
                  <div>
                    <h4 className="font-heading text-base font-bold text-[#1B3A6B]">{p.name}</h4>
                    <p className="text-slate-400 text-[11px] mt-0.5 font-medium">
                      {p.qualification || "Verified Educator"} · {p.email}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Biography</span>
                    <p className="text-xs text-[#1B3A6B] leading-relaxed whitespace-pre-wrap">
                      {p.bio || "No biography added yet."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Qualifications</span>
                      <div className="flex items-center gap-2 text-xs text-[#1B3A6B] font-semibold">
                        <IconCertificate className="w-4 h-4 text-[#2F7FE8]" />
                        <span>{p.qualification || "Educator"}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hourly Rate</span>
                      <div className="text-xs text-[#1B3A6B] font-bold">
                        ₹{p.hourlyRate ?? 0} / hr
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subject Expertise</span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {p.expertise && p.expertise.length > 0 ? (
                        p.expertise.map((exp: string, index: number) => (
                          <span
                            key={index}
                            className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#EBF2FF] text-[#2F7FE8]"
                          >
                            {exp}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-[#9BA8C0] italic">No subjects configured.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              );
            })() : (
              /* EDIT MODE */
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-500">Full Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="border border-[#D0DCF5] rounded-xl px-4 py-2.5 text-xs text-[#1B3A6B] font-medium outline-none focus:border-[#2F7FE8] transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-500">Academic Qualification</label>
                    <input
                      type="text"
                      value={editQualification}
                      placeholder="e.g. B.Sc. Mathematics, 5+ yrs experience"
                      onChange={(e) => setEditQualification(e.target.value)}
                      className="border border-[#D0DCF5] rounded-xl px-4 py-2.5 text-xs text-[#1B3A6B] font-medium outline-none focus:border-[#2F7FE8] transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-500">Hourly Rate (₹/hr)</label>
                    <input
                      type="number"
                      value={editHourlyRate}
                      onChange={(e) => setEditHourlyRate(Number(e.target.value))}
                      className="border border-[#D0DCF5] rounded-xl px-4 py-2.5 text-xs text-[#1B3A6B] font-medium outline-none focus:border-[#2F7FE8] transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-500">Subject Expertise (comma-separated list)</label>
                    <input
                      type="text"
                      value={editExpertise}
                      placeholder="e.g. Mathematics, Physics, Chemistry"
                      onChange={(e) => setEditExpertise(e.target.value)}
                      className="border border-[#D0DCF5] rounded-xl px-4 py-2.5 text-xs text-[#1B3A6B] font-medium outline-none focus:border-[#2F7FE8] transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-500">Biography</label>
                    <textarea
                      value={editBio}
                      rows={4}
                      placeholder="Tell students about your teaching experience, methodology, and focus area..."
                      onChange={(e) => setEditBio(e.target.value)}
                      className="border border-[#D0DCF5] rounded-xl px-4 py-2.5 text-xs text-[#1B3A6B] font-medium outline-none focus:border-[#2F7FE8] transition-colors resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="text-xs font-semibold px-5 py-2.5 bg-[#1B3A6B] text-white rounded-lg hover:bg-[#2F7FE8] transition-colors cursor-pointer disabled:opacity-60 border-none"
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                  <button
                    onClick={() => {
                      setEditName(profile!.name);
                      setEditBio(profile!.bio || "");
                      setEditQualification(profile!.qualification || "");
                      setEditExpertise(profile!.expertise ? profile!.expertise.join(", ") : "");
                      setEditHourlyRate(profile!.hourlyRate || 0);
                      setIsEditMode(false);
                    }}
                    className="text-xs font-semibold px-5 py-2.5 border border-[#D0DCF5] text-[#1B3A6B] bg-white hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECURITY CARD */}
          <div className="bg-white border border-[#D0DCF5] rounded-2xl p-6 shadow-none">
            <h3 className="font-heading text-sm font-bold text-[#1B3A6B] border-b border-slate-100 pb-4 mb-4">
              Security
            </h3>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-xs font-bold text-[#1B3A6B]">Password</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Reset or update your account password</p>
              </div>
              <button
                onClick={() => setIsPwModalOpen(true)}
                className="text-xs font-semibold px-4 py-2 border border-[#D0DCF5] text-[#1B3A6B] bg-white rounded-lg hover:border-[#1B3A6B] hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Change
              </button>
            </div>
          </div>

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
                    className="w-8 h-8 border border-[#D0DCF5] hover:border-[#1B3A6B] rounded-lg flex items-center justify-center text-slate-500 hover:text-[#1B3A6B] transition-colors cursor-pointer bg-white"
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
                            : "border-[#D0DCF5] focus:border-[#2F7FE8]"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1B3A6B] transition-colors cursor-pointer border-none bg-transparent"
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
                        className="w-full border border-[#D0DCF5] rounded-xl px-4 py-2.5 pr-10 text-xs text-[#1B3A6B] font-medium outline-none focus:border-[#2F7FE8] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1B3A6B] transition-colors cursor-pointer border-none bg-transparent"
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
                            : "border-[#D0DCF5] focus:border-[#2F7FE8]"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1B3A6B] transition-colors cursor-pointer border-none bg-transparent"
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
                    className="flex-1 text-xs font-semibold py-3 border border-[#D0DCF5] text-[#1B3A6B] rounded-xl hover:border-[#1B3A6B] transition-colors cursor-pointer bg-transparent"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Toast Notifications in Bottom Right */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full sm:w-auto">
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-4 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in">
            <span className="flex-1">{success}</span>
            <button onClick={() => setSuccess(null)} className="p-0.5 hover:bg-emerald-100 rounded cursor-pointer border-none bg-transparent text-emerald-800"><IconX className="w-3.5 h-3.5" /></button>
          </div>
        )}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold p-4 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in">
            <IconAlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="p-0.5 hover:bg-rose-100 rounded cursor-pointer border-none bg-transparent text-rose-800"><IconX className="w-3.5 h-3.5" /></button>
          </div>
        )}
      </div>
    </div>
  );
}
