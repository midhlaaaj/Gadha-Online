"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { IconMenu2, IconX, IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/client";
import AuthModal from "./AuthModal";
import { UserNotificationBell } from "./UserNotificationBell";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
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
    if (!user) {
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
  }, [user]);

  const getDropdownItemClass = (path: string) => {
    const base = "block px-5 py-2.5 text-sm transition-all";
    if (pathname === path) {
      return `${base} font-semibold text-[#2F7FE8] bg-blue-50/40 hover:bg-blue-50/60`;
    }
    return `${base} font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0f2347]`;
  };

  const getMobileDropdownItemClass = (path: string) => {
    const base = "text-sm font-semibold py-2 px-1 border-b border-slate-50 transition-colors min-h-[44px] flex items-center";
    if (pathname === path) {
      return `${base} text-[#2F7FE8] hover:text-[#2F7FE8]/80`;
    }
    return `${base} text-slate-700 hover:text-primary`;
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
      : pathname?.startsWith(path);
    return isActive 
      ? `${base} text-[#2F7FE8]` 
      : `${base} text-primary hover:text-[#2F7FE8]`;
  };

  useEffect(() => {
    // Try to load cached user instantly to prevent initial network load flicker
    try {
      const cached = localStorage.getItem("tutoboard_user_cache");
      if (cached) {
        setUser(JSON.parse(cached));
        setLoading(false);
      }
    } catch (e) {
      console.warn("Failed to parse cached user:", e);
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
    } catch (e) {}
    setMobileMenuOpen(false);
    window.location.href = "/";
  };

  const openAuth = (mode: "signin" | "signup") => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  const getUserInitials = (currentUser: any) => {
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

  const getUserDisplayName = (currentUser: any) => {
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
      <nav className="flex items-center justify-between px-6 md:px-12 h-[70px] bg-white border-b border-border-subtle sticky top-0 z-40 shadow-sm">
        {/* LOGO */}
        <Link href="/" className="font-heading text-2xl font-extrabold tracking-tight text-primary hover:opacity-95 transition-opacity">
          Tuto<span className="text-secondary">board</span>
        </Link>

        {/* RIGHT SIDE CONTAINER */}
        <div className="flex items-center gap-4 md:gap-8">
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
              href="/#about"
              className="text-sm font-medium text-text-muted hover:text-secondary transition-colors"
            >
              About
            </Link>
          </div>

          {/* AUTHENTICATION ACTION AREA */}
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="h-9 w-28 bg-slate-100/60 animate-pulse rounded-full" />
            ) : user ? (
              <div className="flex items-center gap-5 sm:gap-6">
                {(role === "parent" || role === "student" || !role) && <UserNotificationBell />}
                <div className="relative" ref={dropdownRef}>
                {/* Pill trigger */}
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 border border-[#d0e0f8] bg-white hover:bg-slate-50 hover:border-slate-300 rounded-full cursor-pointer transition-all duration-200 select-none shadow-sm focus:outline-none"
                >
                  <div 
                    className="w-9 h-9 rounded-full bg-[#0f2347] flex items-center justify-center font-heading text-xs font-extrabold text-[#ffc107] shadow-inner" 
                    title={user.email}
                  >
                    {getUserInitials(user)}
                  </div>
                  <span className="text-sm font-semibold text-[#0f2347] tracking-tight max-w-[80px] sm:max-w-[120px] truncate">
                    {getUserDisplayName(user)}
                  </span>
                  {dropdownOpen ? (
                    <IconChevronUp className="w-4 h-4 text-[#3b82f6]" />
                  ) : (
                    <IconChevronDown className="w-4 h-4 text-[#3b82f6]" />
                  )}
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
                        href={role === "student" ? "/lms/courses" : "/bookings"}
                        onClick={() => setDropdownOpen(false)}
                        className={getDropdownItemClass(role === "student" ? "/lms/courses" : "/bookings")}
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
              <div className="hidden md:flex items-center gap-3">
                <button
                  onClick={() => openAuth("signin")}
                  className="text-xs font-semibold px-5 py-2.5 rounded-lg border border-primary text-primary hover:bg-primary/5 transition-all cursor-pointer focus:outline-none"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuth("signup")}
                  className="text-xs font-semibold px-5 py-2.5 rounded-lg bg-primary text-white hover:bg-primary/90 hover:shadow-md transition-all cursor-pointer focus:outline-none"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* MOBILE MENU TOGGLE */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 rounded-lg flex items-center justify-center border border-border-subtle bg-slate-50 text-primary cursor-pointer hover:bg-slate-100 transition-colors focus:outline-none"
            >
              {mobileMenuOpen ? <IconX className="w-5 h-5" /> : <IconMenu2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE DRAWER MENU */}
      {mobileMenuOpen && (
        <div className="absolute top-[70px] left-0 right-0 bg-white border-b border-border-subtle shadow-lg p-5 flex flex-col gap-4 md:hidden z-50 animate-fade-in">
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
            href="/#about"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-semibold text-primary py-2 border-b border-slate-50 hover:text-secondary transition-colors"
          >
            About
          </Link>

          {/* MOBILE AUTH */}
          <div className="pt-2">
            {loading ? (
              <div className="h-10 w-full bg-slate-100/50 animate-pulse rounded-lg" />
            ) : user ? (
              <div className="flex flex-col gap-3">
                <div className="border-t border-slate-100 my-1"></div>
                <Link
                  href={role === "mentor" ? "/mentor/profile" : "/profile"}
                  onClick={() => setMobileMenuOpen(false)}
                  className={getMobileDropdownItemClass(role === "mentor" ? "/mentor/profile" : "/profile")}
                >
                  Profile
                </Link>
                {role === "mentor" && (
                  <Link
                    href="/mentor/availability"
                    onClick={() => setMobileMenuOpen(false)}
                    className={getMobileDropdownItemClass("/mentor/availability")}
                  >
                    Manage Availability
                  </Link>
                )}
                {(!role || role === "parent" || role === "student") && (
                  <Link
                    href={role === "student" ? "/lms/courses" : "/bookings"}
                    onClick={() => setMobileMenuOpen(false)}
                    className={getMobileDropdownItemClass(role === "student" ? "/lms/courses" : "/bookings")}
                  >
                    Bookings
                  </Link>
                )}
                {(!role || role === "parent") && (
                  <Link
                    href="/my-children"
                    onClick={() => setMobileMenuOpen(false)}
                    className={getMobileDropdownItemClass("/my-children")}
                  >
                    My children
                  </Link>
                )}
                <Link
                  href={getDashboardLink()}
                  onClick={() => setMobileMenuOpen(false)}
                  className={getMobileDropdownItemClass(getDashboardLink())}
                >
                  {role === "student" ? "LMS Portal" : role === "mentor" ? "Mentor Portal" : role === "admin" ? "Admin Portal" : "Dashboard"}
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full text-left text-sm font-semibold text-red-600 py-2 hover:text-red-700 transition-colors cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => openAuth("signin")}
                  className="text-center text-xs font-semibold py-2.5 rounded-lg border border-primary text-primary hover:bg-primary/5 transition-all cursor-pointer focus:outline-none"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuth("signup")}
                  className="text-center text-xs font-semibold py-2.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all cursor-pointer focus:outline-none"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
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
