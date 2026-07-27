"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { IconMenu2, IconX, IconChevronDown } from "@tabler/icons-react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import AuthModal from "./AuthModal";
import { UserNotificationBell } from "./UserNotificationBell";

function readCachedUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem("tutoboard_user_cache");
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signin");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clears role in sync with the user auth state (set by the Supabase auth listener in another effect), not a user event
      setRole(null);
      localStorage.removeItem("tutoboard_user_role_cache");
      return;
    }

    const cachedRole = localStorage.getItem("tutoboard_user_role_cache");
    if (cachedRole) {
      setRole(cachedRole);
    }

    supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.role) {
          setRole(data.role);
          localStorage.setItem("tutoboard_user_role_cache", data.role);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- supabase.auth is a new instance each render; including it would refetch the role on every render instead of only when the user changes
  }, [user]);

  const getDropdownItemClass = (path: string) => {
    const base = "block px-5 py-2.5 text-sm transition-all";
    if (pathname === path) {
      return `${base} font-semibold text-[#2F7FE8] bg-blue-50/40 hover:bg-blue-50/60`;
    }
    return `${base} font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0f2347]`;
  };

  const getHeaderLinkClass = (path: string) => {
    const base = "text-sm font-medium transition-colors";
    const isActive = path === "/" 
      ? pathname === "/" 
      : pathname?.startsWith(path);
    return isActive 
      ? `${base} text-secondary font-semibold` 
      : `${base} text-text-muted hover:text-secondary`;
  };

  const getMobileHeaderLinkClass = (path: string) => {
    const base = "text-sm font-semibold py-2 px-1 border-b border-slate-50 transition-colors min-h-[44px] flex items-center";
    const isActive = path === "/" 
      ? pathname === "/" 
      : path.startsWith("/#")
      ? (pathname === "/" && typeof window !== "undefined" && window.location.hash === path.substring(1))
      : pathname?.startsWith(path);
    return isActive 
      ? `${base} text-[#2F7FE8]` 
      : `${base} text-primary hover:text-[#2F7FE8]`;
  };

  useEffect(() => {
    // Read cached user synchronously on mount to avoid layout flash / hydration issues
    const cached = readCachedUser();
    if (cached) {
      setUser(cached);
      setLoading(false);
    }

    // Get initial session
    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        localStorage.setItem("tutoboard_user_cache", JSON.stringify(currentUser));
      } else {
        localStorage.removeItem("tutoboard_user_cache");
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        localStorage.setItem("tutoboard_user_cache", JSON.stringify(currentUser));
      } else {
        localStorage.removeItem("tutoboard_user_cache");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- supabase is a new client instance each render; including it would re-subscribe on every render instead of just on mount
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    try {
      localStorage.removeItem("tutoboard_user_cache");
    } catch {}
    setMobileMenuOpen(false);
    window.location.href = "/";
  };

  const openAuth = (mode: "signin" | "signup") => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  const getUserInitials = (currentUser: User | null) => {
    const fullName = currentUser?.user_metadata?.full_name;
    if (fullName) {
      return fullName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();
    }
    const email = currentUser?.email || "";
    return email.substring(0, 2).toUpperCase();
  };

  const getUserDisplayName = (currentUser: User | null) => {
    return currentUser?.user_metadata?.full_name || currentUser?.email?.split("@")[0] || "User";
  };

  const getDashboardLink = () => {
    if (role === "admin") return "/admin";
    if (role === "mentor") return "/mentor/overview";
    if (role === "student") return "/lms/overview";
    return "/dashboard/overview";
  };

  return (
    <>
      <nav className="flex items-center justify-between px-4 sm:px-6 md:px-12 h-[70px] bg-white border-b border-border-subtle sticky top-0 z-40 shadow-sm">
        {/* LOGO & MOBILE HAMBURGER TOGGLE */}
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center border border-border-subtle bg-slate-50 text-primary cursor-pointer hover:bg-slate-100 transition-colors focus:outline-none shrink-0"
          >
            {mobileMenuOpen ? <IconX className="w-5 h-5" /> : <IconMenu2 className="w-5 h-5" />}
          </button>
          <Link href="/" className="flex items-center gap-2 hover:opacity-95 transition-opacity shrink-0">
            <Image src="/logo.png" alt="Gadha Online" width={48} height={48} className="w-11 h-11 sm:w-12 sm:h-12 object-contain" priority />
            <span className="font-heading text-lg sm:text-2xl font-extrabold tracking-tight text-primary">
              Gadha Online
            </span>
          </Link>
        </div>

        {/* RIGHT SIDE CONTAINER */}
        <div className="flex items-center gap-3 sm:gap-8">
          {/* DESKTOP MENU LINKS */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className={getHeaderLinkClass("/")}
            >
              Home
            </Link>
            <Link
              href="/courses"
              className={getHeaderLinkClass("/courses")}
            >
              Courses
            </Link>
            <Link
              href="/sessions"
              className={getHeaderLinkClass("/sessions")}
            >
              Sessions
            </Link>
            <Link
              href="/mentors"
              className={getHeaderLinkClass("/mentors")}
            >
              Mentors
            </Link>
            <Link
              href="/about"
              className={getHeaderLinkClass("/about")}
            >
              About
            </Link>
          </div>

          {/* AUTHENTICATION ACTION AREA */}
          <div className={`items-center gap-3 ${mobileMenuOpen ? "hidden md:flex" : "flex"}`}>
            {loading ? (
              <div className="h-9 w-28 bg-slate-100/60 animate-pulse rounded-full" />
            ) : user ? (
              <div className="flex items-center gap-2.5 sm:gap-4">
                {(role === "parent" || role === "student" || !role) && <UserNotificationBell />}
                <div className="relative" ref={dropdownRef}>
                {/* Pill trigger */}
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-0 sm:pl-1.5 sm:pr-3.5 sm:py-1.5 border-0 sm:border border-[#d0e0f8] bg-transparent sm:bg-white hover:bg-slate-50 hover:border-slate-300 rounded-full cursor-pointer transition-all duration-200 select-none shadow-none sm:shadow-sm focus:outline-none"
                >
                  <div 
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#0f2347] flex items-center justify-center font-heading text-xs font-extrabold text-[#ffc107] shadow-inner shrink-0" 
                    title={user.email}
                  >
                    {getUserInitials(user)}
                  </div>
                  <span className="hidden sm:inline-block text-sm font-semibold text-[#0f2347] tracking-tight max-w-[120px] truncate">
                    {getUserDisplayName(user)}
                  </span>
                  <IconChevronDown className="hidden sm:inline-block w-4 h-4 text-[#3b82f6]" />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-100 shadow-xl py-2 z-50 animate-fade-in-up origin-top-right">
                    <Link
                      href={role === "mentor" ? "/mentor/profile" : "/profile"}
                      onClick={() => setDropdownOpen(false)}
                      className={getDropdownItemClass(role === "mentor" ? "/mentor/profile" : "/profile")}
                    >
                      Profile
                    </Link>
                    {role === "mentor" && (
                      <Link
                        href="/mentor/availability"
                        onClick={() => setDropdownOpen(false)}
                        className={getDropdownItemClass("/mentor/availability")}
                      >
                        Manage Availability
                      </Link>
                    )}
                    {(!role || role === "parent" || role === "student") && (
                      <Link
                        href={role === "student" ? "/lms/bookings" : "/bookings"}
                        onClick={() => setDropdownOpen(false)}
                        className={getDropdownItemClass(role === "student" ? "/lms/bookings" : "/bookings")}
                      >
                        Bookings
                      </Link>
                    )}
                    {(!role || role === "parent") && (
                      <Link
                        href="/my-children"
                        onClick={() => setDropdownOpen(false)}
                        className={getDropdownItemClass("/my-children")}
                      >
                        My children
                      </Link>
                    )}
                    <Link
                      href={getDashboardLink()}
                      onClick={() => setDropdownOpen(false)}
                      className={getDropdownItemClass(getDashboardLink())}
                    >
                      {role === "student" ? "LMS Portal" : role === "mentor" ? "Mentor Portal" : role === "admin" ? "Admin Portal" : "Dashboard"}
                    </Link>
                    <div className="border-t border-slate-100 my-1"></div>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        handleSignOut();
                      }}
                      className="w-full text-left block px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50/50 hover:text-red-700 transition-all cursor-pointer focus:outline-none"
                    >
                      Sign out
                    </button>
                  </div>
                )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => openAuth("signin")}
                  className="text-xs font-semibold px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-lg border border-primary text-primary hover:bg-primary/5 transition-all cursor-pointer focus:outline-none"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuth("signup")}
                  className="hidden sm:inline-block text-xs font-semibold px-5 py-2.5 rounded-lg bg-primary text-white hover:bg-primary/90 hover:shadow-md transition-all cursor-pointer focus:outline-none"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* MOBILE DRAWER MENU */}
      {mobileMenuOpen && (
        <div className="fixed top-[70px] left-0 right-0 bottom-0 bg-white z-50 p-6 flex flex-col justify-between md:hidden overflow-hidden touch-none animate-fade-in font-sans">
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={getMobileHeaderLinkClass("/")}
            >
              Home
            </Link>
            <Link
              href="/courses"
              onClick={() => setMobileMenuOpen(false)}
              className={getMobileHeaderLinkClass("/courses")}
            >
              Courses
            </Link>
            <Link
              href="/sessions"
              onClick={() => setMobileMenuOpen(false)}
              className={getMobileHeaderLinkClass("/sessions")}
            >
              Sessions
            </Link>
            <Link
              href="/mentors"
              onClick={() => setMobileMenuOpen(false)}
              className={getMobileHeaderLinkClass("/mentors")}
            >
              Mentors
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className={getMobileHeaderLinkClass("/about")}
            >
              About
            </Link>
          </div>

          {!user && (
            <div className="pt-4 border-t border-slate-100 flex gap-3 mb-6">
              <button
                onClick={() => { setMobileMenuOpen(false); openAuth("signin"); }}
                className="flex-1 text-center text-xs font-semibold py-3 rounded-xl border border-primary text-primary hover:bg-primary/5 transition-all cursor-pointer focus:outline-none"
              >
                Sign In
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); openAuth("signup"); }}
                className="flex-1 text-center text-xs font-semibold py-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all cursor-pointer focus:outline-none"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      )}

      {/* Shared Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </>
  );
}
