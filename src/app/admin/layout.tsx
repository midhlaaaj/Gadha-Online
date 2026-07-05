"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconLayoutDashboard,
  IconHome,
  IconBook,
  IconClock,
  IconUsers,
  IconQuote,
  IconList,
  IconSettings,
  IconBell,
  IconNotebook,
  IconCalendar,
  IconCreditCard,
} from "@tabler/icons-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Helper to determine active class
  const getActiveClass = (route: string) => {
    const isActive = pathname === route || pathname.startsWith(route + "/");
    return isActive
      ? "bg-[#EBF2FF] text-[#1B3A6B]"
      : "text-[#6B7A99] hover:bg-[#F5F7FF] hover:text-[#1B3A6B]";
  };

  const getIconClass = (route: string) => {
    const isActive = pathname === route || pathname.startsWith(route + "/");
    return isActive ? "text-[#2F7FE8]" : "text-[#9BA8C0]";
  };

  // Helper to set Page Header Title based on path
  const getHeaderTitle = () => {
    if (pathname.startsWith("/admin/dashboard")) return "Dashboard Overview";
    if (pathname.startsWith("/admin/hero")) return "Hero Section";
    if (pathname.startsWith("/admin/catalog")) return "Courses & Sessions Catalog";
    if (pathname.startsWith("/admin/courses")) return "Courses";
    if (pathname.startsWith("/admin/sessions")) return "Sessions";
    if (pathname.startsWith("/admin/mentors")) return "Mentors";
    if (pathname.startsWith("/admin/testimonials")) return "Testimonials";
    if (pathname.startsWith("/admin/bookings")) return "Bookings";
    if (pathname.startsWith("/admin/students")) return "Students & Parents";
    if (pathname.startsWith("/admin/schedules")) return "Schedules & Attendance";
    if (pathname.startsWith("/admin/payments")) return "Payments Ledger";
    if (pathname.startsWith("/admin/settings")) return "Settings";
    return "Admin Panel";
  };

  return (
    <div className="flex h-screen min-h-[600px] overflow-hidden bg-[#F5F7FF] font-sans text-primary">
      {/* SIDEBAR */}
      <aside className="w-[240px] shrink-0 bg-white border-r border-[#E6EBF8] flex flex-col overflow-hidden">
        <div className="h-[80px] flex items-center px-6 border-b border-[#E6EBF8] shrink-0">
          <Link href="/admin/dashboard" className="font-heading text-2xl font-extrabold tracking-tight text-[#1B3A6B]">
            Tuto<span className="text-[#2F7FE8]">board</span>
            <span className="text-[10px] ml-1.5 font-sans font-extrabold uppercase px-2 py-0.5 bg-[#EBF2FF] text-[#2F7FE8] rounded-md tracking-wider">Admin</span>
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          {/* Main Segment */}
          <div>
            <p className="text-[9px] font-extrabold text-[#9BA8C0] uppercase tracking-widest px-3 mb-2">Main</p>
            <Link
              href="/admin/dashboard"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer ${getActiveClass("/admin/dashboard")}`}
            >
              <IconLayoutDashboard className={`w-[17px] h-[17px] shrink-0 ${getIconClass("/admin/dashboard")}`} />
              Dashboard
              {(pathname === "/admin/dashboard" || pathname.startsWith("/admin/dashboard/")) && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#2F7FE8]" />
              )}
            </Link>
          </div>

          {/* Catalog Segment */}
          <div>
            <p className="text-[9px] font-extrabold text-[#9BA8C0] uppercase tracking-widest px-3 mb-2">Catalog</p>
            <div className="space-y-0.5">
              <Link
                href="/admin/catalog"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer ${getActiveClass("/admin/catalog")}`}
              >
                <IconBook className={`w-[17px] h-[17px] shrink-0 ${getIconClass("/admin/catalog")}`} />
                Courses & Sessions
                {pathname.startsWith("/admin/catalog") && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#2F7FE8]" />}
              </Link>
              <Link
                href="/admin/mentors"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer ${getActiveClass("/admin/mentors")}`}
              >
                <IconUsers className={`w-[17px] h-[17px] shrink-0 ${getIconClass("/admin/mentors")}`} />
                Mentors
                {pathname.startsWith("/admin/mentors") && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#2F7FE8]" />}
              </Link>
            </div>
          </div>

          {/* Relations & Activity Segment */}
          <div>
            <p className="text-[9px] font-extrabold text-[#9BA8C0] uppercase tracking-widest px-3 mb-2">Relations & Activity</p>
            <div className="space-y-0.5">
              <Link
                href="/admin/students"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer ${getActiveClass("/admin/students")}`}
              >
                <IconNotebook className={`w-[17px] h-[17px] shrink-0 ${getIconClass("/admin/students")}`} />
                Students & Parents
                {pathname.startsWith("/admin/students") && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#2F7FE8]" />}
              </Link>
              <Link
                href="/admin/bookings"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer ${getActiveClass("/admin/bookings")}`}
              >
                <IconList className={`w-[17px] h-[17px] shrink-0 ${getIconClass("/admin/bookings")}`} />
                Bookings
                {pathname.startsWith("/admin/bookings") && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#2F7FE8]" />}
              </Link>
              <Link
                href="/admin/schedules"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer ${getActiveClass("/admin/schedules")}`}
              >
                <IconCalendar className={`w-[17px] h-[17px] shrink-0 ${getIconClass("/admin/schedules")}`} />
                Schedules & Attendance
                {pathname.startsWith("/admin/schedules") && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#2F7FE8]" />}
              </Link>
            </div>
          </div>

          {/* Finance & Marketing Segment */}
          <div>
            <p className="text-[9px] font-extrabold text-[#9BA8C0] uppercase tracking-widest px-3 mb-2">Finance & Content</p>
            <div className="space-y-0.5">
              <Link
                href="/admin/payments"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer ${getActiveClass("/admin/payments")}`}
              >
                <IconCreditCard className={`w-[17px] h-[17px] shrink-0 ${getIconClass("/admin/payments")}`} />
                Payments Ledger
                {pathname.startsWith("/admin/payments") && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#2F7FE8]" />}
              </Link>
              <Link
                href="/admin/testimonials"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer ${getActiveClass("/admin/testimonials")}`}
              >
                <IconQuote className={`w-[17px] h-[17px] shrink-0 ${getIconClass("/admin/testimonials")}`} />
                Testimonials
                {pathname.startsWith("/admin/testimonials") && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#2F7FE8]" />}
              </Link>
              <Link
                href="/admin/hero"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer ${getActiveClass("/admin/hero")}`}
              >
                <IconHome className={`w-[17px] h-[17px] shrink-0 ${getIconClass("/admin/hero")}`} />
                Hero Editor
                {pathname.startsWith("/admin/hero") && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#2F7FE8]" />}
              </Link>
            </div>
          </div>
        </nav>

        {/* System Settings & Profile */}
        <div className="px-3 pb-5 border-t border-[#E6EBF8] pt-3 shrink-0 space-y-2">
          <Link
            href="/admin/settings"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer ${getActiveClass("/admin/settings")}`}
          >
            <IconSettings className={`w-[17px] h-[17px] shrink-0 ${getIconClass("/admin/settings")}`} />
            Settings
            {pathname.startsWith("/admin/settings") && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#2F7FE8]" />}
          </Link>

          <div className="flex items-center gap-3 px-3 pt-2">
            <div className="w-9 h-9 rounded-full bg-[#EBF2FF] text-[#2F7FE8] flex items-center justify-center font-heading text-xs font-bold shrink-0">
              AD
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-bold text-[#1B3A6B] leading-tight truncate font-sans">Admin User</div>
              <div className="text-[9px] text-[#9BA8C0] font-semibold">Super Admin</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#F5F7FF]">
        {/* TOPBAR */}
        <header className="h-[80px] bg-white border-b border-[#E6EBF8] flex items-center justify-between px-6 shrink-0">
          <div className="font-heading text-[18px] font-extrabold text-[#1B3A6B] capitalize">
            {getHeaderTitle()}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8.5 h-8.5 rounded-xl border border-[#E6EBF8] bg-white flex items-center justify-center cursor-pointer relative hover:bg-slate-50 transition-colors">
              <IconBell className="w-4 h-4 text-[#6B7A99]" />
              <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500"></div>
            </div>
          </div>
        </header>

        {/* CONTAINER CONTENT */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
