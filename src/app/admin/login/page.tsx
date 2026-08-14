"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/client";
import { validateEmail, validatePassword, sanitizeText } from "@/lib/validate";
import { checkAdminInvitation } from "@/app/actions";

export default function AdminLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("err") === "wrong_role") {
      setError("That account isn't registered as an admin. Sign in with an admin account, or use the student/parent/tutor login if this is a different kind of account.");
    }
  }, []);

  const switchMode = (newMode: "signin" | "signup" | "forgot") => {
    setMode(newMode);
    setError(null);
    setSuccess(null);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setRedirecting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      setError(emailCheck.error!);
      return;
    }

    if (mode !== "forgot") {
      const pwCheck = validatePassword(password);
      if (!pwCheck.valid) {
        setError(pwCheck.error!);
        return;
      }
    }

    if (mode === "signup") {
      if (password !== confirmPassword) {
        setError("Passwords do not match. Please check and re-enter.");
        return;
      }
    }

    setLoading(true);
    let keepLoading = false;

    try {
      if (mode === "signin") {
        const { data: signInData, error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) throw err;

        if (signInData.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", signInData.user.id)
            .single();
          if (profile?.role !== "admin") {
            setError("That account isn't registered as an admin. Sign in with an admin account, or use the student/parent/tutor login if this is a different kind of account.");
            setLoading(false);
            return;
          }
        }

        keepLoading = true;
        setSuccess("Signed in successfully!");
        setRedirecting(true);
        router.refresh();
        setTimeout(() => {
          router.replace("/admin/dashboard");
        }, 300);
      } else if (mode === "signup") {
        // Enforce invite-only admin account creation
        const inviteCheck = await checkAdminInvitation(email);
        if (!inviteCheck.success) {
          setError(inviteCheck.error!);
          return;
        }

        const { error: err } = await supabase.auth.signUp({
          email: sanitizeText(email).trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/admin/dashboard`,
            data: {
              role: "admin",
              full_name: email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1),
            },
          },
        });
        if (err) throw err;

        keepLoading = true;
        setSuccess("Account created successfully! Check your email or try signing in.");
        setTimeout(() => {
          switchMode("signin");
          setLoading(false);
        }, 2000);
      } else if (mode === "forgot") {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/admin/dashboard`,
        });
        if (err) throw err;

        setSuccess("Password reset instructions have been sent to your email.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An authentication error occurred. Please try again.");
    } finally {
      if (!keepLoading) setLoading(false);
    }
  };

  const submitLabel = redirecting
    ? "Redirecting..."
    : loading
      ? (mode === "signin" ? "Signing in..." : mode === "signup" ? "Creating account..." : "Sending reset link...")
      : (mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link");

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#F5F8FF]">
      <div className="relative bg-white w-full max-w-sm rounded-2xl p-6 md:p-8 shadow-2xl border border-slate-100 z-10 flex flex-col max-h-[95vh] overflow-y-auto premium-scrollbar">
        {/* Header logo & title */}
        <div className="pb-2 mb-1 flex flex-col items-center">
          <div className="flex items-center gap-2 font-heading text-xl font-extrabold tracking-tight text-[#1B3A6B] mb-1">
            <Image src="/logo.png" alt="Gadha Online" width={40} height={40} className="w-10 h-10 object-contain" />
            <span>Gadha Online</span>
          </div>
          <p className="text-[10px] font-bold text-[#9BA8C0] uppercase tracking-widest mb-2">Admin Portal</p>

          <div className="border-b border-slate-100 w-full mb-3"></div>

          <h2 className="font-heading text-base font-bold text-[#4A5A7A]">
            {mode === "signin" && "Welcome Back"}
            {mode === "signup" && "Create Admin Account"}
            {mode === "forgot" && "Reset Password"}
          </h2>
        </div>

        {/* Form Container */}
        <div className="flex-1 overflow-y-auto pr-1 premium-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#4A5A7A] uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your Email Address"
                disabled={loading}
                required
                className="w-full text-xs p-3.5 border border-slate-200 focus:border-[#2F7FE8] focus:ring-1 focus:ring-[#2F7FE8]/20 rounded-lg outline-none text-[#1B3A6B] font-sans transition-all disabled:opacity-50"
              />
            </div>

            {/* Password Field */}
            {mode !== "forgot" && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#4A5A7A] uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    required
                    className="w-full text-xs p-3.5 pr-10 border border-slate-200 focus:border-[#2F7FE8] focus:ring-1 focus:ring-[#2F7FE8]/20 rounded-lg outline-none text-[#1B3A6B] font-sans transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#2F7FE8] cursor-pointer focus:outline-none"
                  >
                    {showPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Re-enter Password (Sign Up Mode only) */}
            {mode === "signup" && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#4A5A7A] uppercase tracking-wider">Re-enter Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    required
                    className="w-full text-xs p-3.5 pr-10 border border-slate-200 focus:border-[#2F7FE8] focus:ring-1 focus:ring-[#2F7FE8]/20 rounded-lg outline-none text-[#1B3A6B] font-sans transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#2F7FE8] cursor-pointer focus:outline-none"
                  >
                    {showConfirmPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Forgot Password Link */}
            {mode === "signin" && (
              <div className="flex items-center justify-end text-xs pt-1">
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className="font-semibold text-[#2F7FE8] hover:text-[#2F7FE8]/80 hover:underline cursor-pointer focus:outline-none"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Alerts */}
            {error && (
              <div className="text-red-600 text-xs font-semibold animate-fade-in pb-1 text-center">
                {error}
              </div>
            )}
            {success && (
              <div className="text-emerald-600 text-xs font-semibold animate-fade-in pb-1 text-center">
                {success}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 text-white text-xs font-bold rounded-lg shadow-md transition-all cursor-pointer mt-4 flex items-center justify-center gap-2 disabled:cursor-not-allowed ${
                redirecting ? "bg-emerald-600 hover:bg-emerald-600" : "bg-[#1B3A6B] hover:bg-[#1B3A6B]/95 hover:shadow-lg disabled:opacity-50"
              }`}
            >
              {loading ? (
                <>
                  {redirecting ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span>{submitLabel}</span>
                </>
              ) : (
                <span>{submitLabel}</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer toggles */}
        <div className="pt-4 mt-4 border-t border-slate-100 text-center text-xs text-[#4A5A7A] font-medium">
          {mode === "signin" && (
            <p>
              Have an admin invite?{" "}
              <button
                onClick={() => switchMode("signup")}
                className="font-bold text-[#2F7FE8] hover:text-[#2F7FE8]/80 cursor-pointer focus:outline-none"
              >
                Create account
              </button>
            </p>
          )}
          {mode === "signup" && (
            <p>
              Already have an account?{" "}
              <button
                onClick={() => switchMode("signin")}
                className="font-bold text-[#2F7FE8] hover:text-[#2F7FE8]/80 cursor-pointer focus:outline-none"
              >
                Sign In
              </button>
            </p>
          )}
          {mode === "forgot" && (
            <button
              onClick={() => switchMode("signin")}
              className="font-bold text-[#2F7FE8] hover:text-[#2F7FE8]/80 cursor-pointer focus:outline-none"
            >
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
