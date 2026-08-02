"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { IconX, IconEye, IconEyeOff } from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/client";
import { validateEmail, validatePassword, sanitizeText } from "@/lib/validate";
import { createSelfStudentInvite } from "@/app/actions";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "signin" | "signup";
}

export default function AuthModal({ isOpen, onClose, initialMode = "signin" }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [signupRole, setSignupRole] = useState<"parent" | "student">("parent");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate reset-on-reopen; modal stays mounted, form state is cleared each time it's opened
      setMode(initialMode);
      setError(null);
      setSuccess(null);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setSignupRole("parent");
      setRedirecting(false);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // Input validation uses the shared @/lib/validate utility.
  // Supabase communicates via parameterized JSON payloads (no raw SQL),
  // so these validators primarily guard against XSS and data integrity issues.

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (err) throw err;
    } catch (err) {
      console.error("Google sign-in failed:", err);
      setError("Failed to start Google Sign In. Please try again.");
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
    let keepLoading = false;

    try {
      if (mode === "signin") {
        const { data: authData, error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (err) throw err;

        keepLoading = true;
        setSuccess("Signed in! Redirecting you...");
        setRedirecting(true);

        // Students and parents stay on the homepage after signing in —
        // only mentors and admins get sent to their dashboard.
        let targetUrl = "/";
        if (authData.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", authData.user.id)
            .single();

          if (profile?.role === "mentor") {
            targetUrl = "/mentor/overview";
          } else if (profile?.role === "admin") {
            targetUrl = "/admin/dashboard";
          }
        }

        setTimeout(() => {
          onClose();
          window.location.href = targetUrl;
        }, 600);
      } else if (mode === "signup") {
        const cleanEmail = sanitizeText(email).trim();

        if (signupRole === "student") {
          // Reuses the same invite mechanism a parent uses to add a child —
          // the signup trigger assigns the "student" role once it finds this
          // pending invite, so we never need to trust a client-supplied role.
          await createSelfStudentInvite(cleanEmail, cleanEmail.split("@")[0]);
        }

        const { error: err } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (err) throw err;

        keepLoading = true;
        setSuccess("Account created! Redirecting you...");
        setRedirecting(true);
        setTimeout(() => {
          onClose();
          window.location.href = "/";
        }, 1200);
      } else if (mode === "forgot") {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
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

  return (    <div className="fixed inset-0 bg-primary/40 backdrop-blur-xs z-[999] flex items-center justify-center p-0 md:p-4 animate-fade-in">
      {/* Backdrop overlay listener to close when clicking outside */}
      <div className="absolute inset-0" onClick={onClose}></div>
      
      {/* Modal Card: Full-screen centered sheet on mobile (<768px), centered dialog on md: */}
      <div className="relative bg-white w-full h-full md:h-auto max-w-none md:max-w-sm rounded-none md:rounded-2xl p-6 md:p-8 shadow-2xl border-0 md:border md:border-slate-100 z-10 animate-scale-up overflow-y-auto flex flex-col justify-between items-center text-center">
        {/* Absolute Close Button at top-right corner of card */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 hover:bg-slate-100 hover:text-secondary text-text-muted transition-colors cursor-pointer focus:outline-none z-20"
        >
          <IconX className="w-4 h-4" />
        </button>

        {/* Centered Main Body */}
        <div className="w-full max-w-sm my-auto flex flex-col justify-center space-y-4 py-4">
          {/* Header */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 font-heading text-xl font-extrabold tracking-tight text-primary mb-1">
              <Image src="/logo.png" alt="Gadha Online" width={40} height={40} className="w-10 h-10 object-contain" />
              <span>Gadha Online</span>
            </div>
            <div className="border-b border-slate-100 w-full my-2"></div>
            
            <h2 className="font-heading text-base font-bold text-text-muted">
              {mode === "signin" && "Welcome Back"}
              {mode === "signup" && "Create Account"}
              {mode === "forgot" && "Reset Password"}
            </h2>
          </div>

          {/* Google Sign In & OR Divider */}
          {mode !== "forgot" && (
            <div className="w-full flex-shrink-0">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 border border-slate-200 hover:border-slate-300 rounded-lg bg-white text-primary text-xs font-semibold hover:bg-slate-50 hover:shadow-sm transition-all cursor-pointer mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              <div className="flex items-center">
                <div className="flex-1 border-t border-slate-100"></div>
                <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white">or</span>
                <div className="flex-1 border-t border-slate-100"></div>
              </div>
            </div>
          )}

          {/* Form Container */}
          <div className="w-full text-left">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Toggle (Sign Up Mode) */}
            {mode === "signup" && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">I am a...</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSignupRole("parent")}
                    disabled={loading}
                    className={`py-2.5 text-xs font-bold rounded-lg border transition-all cursor-pointer disabled:opacity-50 ${
                      signupRole === "parent"
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-text-muted border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    Parent
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignupRole("student")}
                    disabled={loading}
                    className={`py-2.5 text-xs font-bold rounded-lg border transition-all cursor-pointer disabled:opacity-50 ${
                      signupRole === "student"
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-text-muted border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    Student
                  </button>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your Email Address"
                disabled={loading}
                required
                className="w-full text-xs p-3.5 border border-slate-200 focus:border-secondary focus:ring-1 focus:ring-secondary/20 rounded-lg outline-none text-primary font-sans transition-all disabled:opacity-50"
              />
            </div>

            {/* Password Field */}
            {mode !== "forgot" && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    required
                    className="w-full text-xs p-3.5 pr-10 border border-slate-200 focus:border-secondary focus:ring-1 focus:ring-secondary/20 rounded-lg outline-none text-primary font-sans transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-secondary cursor-pointer focus:outline-none"
                  >
                    {showPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password Field (Sign Up Mode) */}
            {mode === "signup" && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Re-enter Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    required
                    className="w-full text-xs p-3.5 pr-10 border border-slate-200 focus:border-secondary focus:ring-1 focus:ring-secondary/20 rounded-lg outline-none text-primary font-sans transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-secondary cursor-pointer focus:outline-none"
                  >
                    {showConfirmPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Remember Me & Forgot Password Links */}
            {mode === "signin" && (
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-text-muted cursor-pointer font-medium select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 border border-slate-300 rounded text-secondary focus:ring-secondary/30"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setError(null);
                  }}
                  className="font-semibold text-secondary hover:text-secondary/80 hover:underline cursor-pointer focus:outline-none"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Alerts as simple plain text */}
            {error && (
              <div className="text-red-600 text-xs font-semibold animate-fade-in pb-2 text-center">
                {error}
              </div>
            )}
            {success && (
              <div className="text-green-600 text-xs font-semibold animate-fade-in pb-2 text-center">
                {success}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 text-white text-xs font-bold rounded-lg shadow-md transition-all cursor-pointer mt-4 flex items-center justify-center gap-2 disabled:cursor-not-allowed ${
                redirecting ? "bg-emerald-600 hover:bg-emerald-600" : "bg-primary hover:bg-primary/95 hover:shadow-lg disabled:opacity-50"
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
          <div className="pt-4 mt-4 border-t border-slate-100 text-center text-xs text-text-muted font-medium w-full">
            {mode === "signin" && (
              <p>
                New to Gadha Online?{" "}
                <button
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                  }}
                  className="font-bold text-secondary hover:text-secondary/80 cursor-pointer focus:outline-none"
                >
                  Create account
                </button>
              </p>
            )}
            {mode === "signup" && (
              <p>
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                  }}
                  className="font-bold text-secondary hover:text-secondary/80 cursor-pointer focus:outline-none"
                >
                  Sign In
                </button>
              </p>
            )}
            {mode === "forgot" && (
              <button
                onClick={() => {
                  setMode("signin");
                  setError(null);
                }}
                className="font-bold text-secondary hover:text-secondary/80 cursor-pointer focus:outline-none"
              >
                Back to Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
