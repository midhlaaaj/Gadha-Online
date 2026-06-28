"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconEye, IconEyeOff, IconMail, IconLock } from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/client";
import { validateEmail, validatePassword, sanitizeText } from "@/lib/validate";
import { checkMentorInvitation } from "@/app/actions";

export default function MentorLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    setError(null);
    setSuccess(null);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  }, [mode]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/mentor/overview`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (err) throw err;
    } catch (err: any) {
      setError(err.message || "Failed to start Google Sign In. Verify if OAuth is enabled.");
      setLoading(false);
    }
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

    try {
      if (mode === "signin") {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) throw err;

        setSuccess("Signed in successfully!");
        setTimeout(() => {
          router.replace("/mentor/overview");
        }, 200);
      } else if (mode === "signup") {
        // Enforce admin-invited email restriction
        const inviteCheck = await checkMentorInvitation(email);
        if (!inviteCheck.success) {
          setError(inviteCheck.error!);
          setLoading(false);
          return;
        }

        // Sign up with mentor metadata role to trigger database user hook
        const { error: err } = await supabase.auth.signUp({
          email: sanitizeText(email).trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/mentor/overview`,
            data: {
              role: "mentor",
              full_name: email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1),
            }
          },
        });
        if (err) throw err;

        setSuccess("Account created successfully! Check your email or try signing in.");
        setTimeout(() => {
          setMode("signin");
          setLoading(false);
        }, 2000);
      } else if (mode === "forgot") {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/mentor/overview`,
        });
        if (err) throw err;

        setSuccess("Password reset instructions have been sent to your email.");
      }
    } catch (err: any) {
      setError(err.message || "An authentication error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#F5F8FF]">
      {/* Modal Card container replicating AuthModal design exactly */}
      <div className="relative bg-white w-full max-w-sm rounded-2xl p-6 md:p-8 shadow-2xl border border-slate-100 z-10 flex flex-col max-h-[95vh] overflow-y-auto premium-scrollbar">
        
        {/* Header logo & title */}
        <div className="pb-2 mb-1 flex flex-col items-center">
          <div className="font-heading text-2xl font-extrabold tracking-tight text-[#1B3A6B] mb-1">
            Tuto<span className="text-[#2F7FE8]">board</span>
          </div>
          <p className="text-[10px] font-bold text-[#9BA8C0] uppercase tracking-widest mb-2">Tutor Portal</p>
          
          {/* Divider Line */}
          <div className="border-b border-slate-100 w-full mb-3"></div>
          
          <h2 className="font-heading text-base font-bold text-[#4A5A7A]">
            {mode === "signin" && "Welcome Back"}
            {mode === "signup" && "Tutor Registration"}
            {mode === "forgot" && "Reset Password"}
          </h2>
        </div>

        {/* Google Sign In & OR Divider */}
        {mode !== "forgot" && (
          <div className="mb-4 flex-shrink-0">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 border border-slate-200 hover:border-slate-300 rounded-lg bg-white text-[#1B3A6B] text-xs font-semibold hover:bg-slate-50 hover:shadow-sm transition-all cursor-pointer mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center">
              <div className="flex-1 border-t border-slate-100"></div>
              <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white">or</span>
              <div className="flex-1 border-t border-slate-100"></div>
            </div>
          </div>
        )}

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
                placeholder="name@email.com"
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

            {/* Remember Me & Forgot Password Links */}
            {mode === "signin" && (
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-[#4A5A7A] cursor-pointer font-medium select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 border border-slate-300 rounded text-[#2F7FE8] focus:ring-[#2F7FE8]/30"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
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
              className="w-full py-3.5 bg-[#1B3A6B] hover:bg-[#1B3A6B]/95 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer mt-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  {mode === "signin" && "Sign In"}
                  {mode === "signup" && "Create Account"}
                  {mode === "forgot" && "Send Reset Link"}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer toggles */}
        <div className="pt-4 mt-4 border-t border-slate-100 text-center text-xs text-[#4A5A7A] font-medium">
          {mode === "signin" && (
            <p>
              Want to teach on Tutoboard?{" "}
              <button
                onClick={() => setMode("signup")}
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
                onClick={() => setMode("signin")}
                className="font-bold text-[#2F7FE8] hover:text-[#2F7FE8]/80 cursor-pointer focus:outline-none"
              >
                Sign In
              </button>
            </p>
          )}
          {mode === "forgot" && (
            <button
              onClick={() => setMode("signin")}
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
