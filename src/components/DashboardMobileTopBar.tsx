"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  IconUser,
  IconLogout,
  IconCalendar,
  IconBook,
  IconFolder,
  IconChartBar,
  IconClock,
  IconHome,
} from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/client";

import { UserNotificationBell } from "@/components/UserNotificationBell";

export type TopBarRole = "parent" | "student" | "mentor";

interface DashboardMobileTopBarProps {
  role: TopBarRole;
  title?: string;
  contextControl?: React.ReactNode;
}

interface OverflowLink {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const OVERFLOW_LINKS: Record<TopBarRole, OverflowLink[]> = {
  parent: [
    { label: "Bookings", href: "/bookings", icon: IconCalendar },
    { label: "My Profile", href: "/profile", icon: IconUser },
  ],
  student: [
    { label: "Bookings", href: "/lms/bookings", icon: IconCalendar },
    { label: "Resources", href: "/lms/resources", icon: IconFolder },
    { label: "Performance", href: "/lms/performance", icon: IconChartBar },
    { label: "Back to Homepage", href: "/", icon: IconHome },
  ],
  mentor: [
    { label: "Attendance", href: "/mentor/attendance", icon: IconCalendar },
    { label: "Assignments", href: "/mentor/assignments", icon: IconBook },
    { label: "Availability", href: "/mentor/availability", icon: IconClock },
    { label: "Resources", href: "/mentor/resources", icon: IconFolder },
    { label: "Profile Settings", href: "/mentor/profile", icon: IconUser },
  ],
};

export function DashboardMobileTopBar({ role, contextControl }: DashboardMobileTopBarProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();
  const overflowLinks = OVERFLOW_LINKS[role] || [];

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
        const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User";
        setUserName(name);
      }
    }
    loadUser();
  }, [supabase]);

  // Outside click handler for avatar dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    const loginRedirect = role === "mentor" ? "/" : role === "student" ? "/lms/login" : "/";
    router.push(loginRedirect);
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#E6EBF8] px-4 py-2.5 md:hidden shadow-xs">
      <div className="flex items-center justify-between gap-2">
        {/* Brand / Logo */}
        <Link href={role === "mentor" ? "/mentor/overview" : role === "student" ? "/lms/overview" : "/dashboard/overview"} className="flex items-center gap-2 shrink-0 min-w-0">
          <Image src="/logo.png" alt="Gadha Online" width={36} height={36} className="w-9 h-9 object-contain shrink-0" />
          <span className="font-heading text-base font-extrabold text-[#1B3A6B] truncate">
            Gadha Online
          </span>
        </Link>

        {/* Optional Context Control (e.g. ChildSwitcher) */}
        {contextControl && <div className="flex-1 max-w-[180px]">{contextControl}</div>}

        {/* User Notification Bell + Avatar Circle */}
        <div className="flex items-center gap-2 shrink-0">
          <UserNotificationBell />
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="w-8 h-8 rounded-full bg-[#1B3A6B] text-white flex items-center justify-center font-heading text-xs font-extrabold shadow-xs hover:opacity-90 transition-opacity cursor-pointer focus:outline-none"
              title={userName}
            >
              {getInitials(userName)}
            </button>

          {/* Avatar Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-[#E6EBF8] rounded-2xl shadow-xl z-50 overflow-hidden font-sans animate-in slide-in-from-top-2 duration-150">
              {/* User Info Header */}
              <div className="p-3 bg-slate-50/80 border-b border-[#E6EBF8]">
                <p className="text-xs font-bold text-[#1B3A6B] truncate">{userName}</p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{userEmail}</p>
              </div>

              {/* Overflow Navigation Links */}
              <div className="p-1.5 space-y-0.5 border-b border-[#E6EBF8]">
                {overflowLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F5F8FF] hover:text-[#2F7FE8] rounded-xl transition-colors min-h-[44px]"
                    >
                      <Icon className="w-4 h-4 text-slate-400" />
                      {link.label}
                    </Link>
                  );
                })}
              </div>

              {/* Sign Out Action */}
              <div className="p-1.5">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer min-h-[44px]"
                >
                  <IconLogout className="w-4 h-4 text-red-500" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </header>
);
}

