"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  IconLayoutDashboard,
  IconHome,
  IconBook,
  IconClock,
  IconUsers,
  IconQuote,
  IconList,
  IconNotebook,
  IconCalendar,
  IconCreditCard,
  IconInfoCircle,
  IconInbox,
  IconShieldLock,
  IconHeadset,
  IconTags,
} from "@tabler/icons-react";
import { AdminNotificationBell } from "./_components/AdminNotificationBell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

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

  // Helper to set Page Header Title based on path — must match the sidebar
  // label exactly, one canonical name per page.
  const getHeaderTitle = () => {
    if (pathname.startsWith("/admin/dashboard")) return "Dashboard";
    if (pathname.startsWith("/admin/courses")) return "Courses";
    if (pathname.startsWith("/admin/subjects")) return "Subjects";
    if (pathname.startsWith("/admin/sessions")) return "Sessions";
    if (pathname.startsWith("/admin/mentors")) return "Mentors";
    if (pathname.startsWith("/admin/testimonials")) return "Testimonials";
    if (pathname.startsWith("/admin/bookings")) return "Bookings";
    if (pathname.startsWith("/admin/students")) return "Students & Parents";
    if (pathname.startsWith("/admin/schedules")) return "Schedules & Attendance";
    if (pathname.startsWith("/admin/payments")) return "Revenue Trends";
    if (pathname.startsWith("/admin/hero")) return "Hero Section";
    if (pathname.startsWith("/admin/about")) return "About Page";
    if (pathname.startsWith("/admin/leads")) return "Leads";
    if (pathname.startsWith("/admin/support")) return "Support Inbox";
    if (pathname.startsWith("/admin/admins")) return "Admin Management";
    if (pathname.startsWith("/admin/settings")) return "Settings";
    return "Admin Panel";
  };

  return (
    <div className="flex h-screen min-h-[600px] overflow-hidden bg-[#F5F7FF] font-sans text-primary">
      {/* SIDEBAR */}
      <aside className="w-[240px] shrink-0 bg-white border-r border-[#E6EBF8] flex flex-col overflow-hidden">
        <div className="h-[80px] flex items-center px-6 border-b border-[#E6EBF8] shrink-0">
          <Link href="/admin/dashboard" className="flex items-center gap-2 font-heading text-base font-extrabold tracking-tight text-[#1B3A6B] whitespace-nowrap">
            <Image src="/logo.png" alt="Gadha Online" width={36} height={36} className="w-9 h-9 object-contain shrink-0" priority />
            <span>Gadha Online</span>
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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

          <Link
            href="/admin/courses"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer ${getActiveClass("/admin/courses")}`}
          >
            <IconBook className={`w-[17px] h-[17px] shrink-0 ${getIconClass("/admin/courses")}`} />
            Courses
            {pathname.startsWith("/admin/courses") && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#2F7FE8]" />}
          </Link>

          <Link
            href="/admin/sessions"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer ${getActiveClass("/admin/sessions")}`}
          >
            <IconClock className={`w-[17px] h-[17px] shrink-0 ${getIconClass("/admin/sessions")}`} />
            Sessions
            {pathname.startsWith("/admin/sessions") && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#2F7FE8]" />}
          </Link>

          <Link
            href="/admin/subjects"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer ${getActiveClass("/admin/subjects")}`}
          >
            <IconTags className={`w-[17px] h-[17px] shrink-0 ${getIconClass("/admin/subjects")}`} />
            Subjects
            {pathname.startsWith("/admin/subjects") && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#2F7FE8]" />}
          </Link>

          <Link
            href="/admin/mentors"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer ${getActiveClass("/admin/mentors")}`}
          >
            <IconUsers className={`w-[17px] h-[17px] shrink-0 ${getIconClass("/admin/mentors")}`} />
            Mentors
            {pathname.startsWith("/admin/mentors") && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#2F7FE8]" />}
          </Link>

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

          <Link
            href="/admin/payments"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer ${getActiveClass("/admin/payments")}`}
          >
            <IconCreditCard className={`w-[17px] h-[17px] shrink-0 ${getIconClass("/admin/payments")}`} />
            Revenue Trends
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
            Hero Section
            {pathname.startsWith("/admin/hero") && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#2F7FE8]" />}
          </Link>

          <Link
            href="/admin/about"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer ${getActiveClass("/admin/about")}`}
          >
            <IconInfoCircle className={`w-[17px] h-[17px] shrink-0 ${getIconClass("/admin/about")}`} />
            About Page
            {pathname.startsWith("/admin/about") && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#2F7FE8]" />}
          </Link>

          <Link
            href="/admin/leads"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer ${getActiveClass("/admin/leads")}`}
          >
            <IconInbox className={`w-[17px] h-[17px] shrink-0 ${getIconClass("/admin/leads")}`} />
            Leads
            {pathname.startsWith("/admin/leads") && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#2F7FE8]" />}
          </Link>

          <Link
            href="/admin/support"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer ${getActiveClass("/admin/support")}`}
          >
            <IconHeadset className={`w-[17px] h-[17px] shrink-0 ${getIconClass("/admin/support")}`} />
            Support Inbox
            {pathname.startsWith("/admin/support") && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#2F7FE8]" />}
          </Link>

          <Link
            href="/admin/admins"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer ${getActiveClass("/admin/admins")}`}
          >
            <IconShieldLock className={`w-[17px] h-[17px] shrink-0 ${getIconClass("/admin/admins")}`} />
            Admin Management
            {pathname.startsWith("/admin/admins") && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#2F7FE8]" />}
          </Link>
        </nav>

        {/* Profile Footer */}
        <div className="px-3 pb-5 border-t border-[#E6EBF8] pt-3 shrink-0">
          <div className="flex items-center gap-3 px-3 pt-1">
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
            <AdminNotificationBell />
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
