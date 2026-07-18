"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconLayoutDashboard,
  IconClock,
  IconNotebook,
  IconCalendar,
  IconMessageCircle,
  IconBook,
  IconUsers,
  IconCurrencyRupee,
} from "@tabler/icons-react";

export type NavRole = "parent" | "student" | "mentor";

interface BottomNavProps {
  role: NavRole;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS_BY_ROLE: Record<NavRole, NavItem[]> = {
  parent: [
    { label: "Overview", href: "/dashboard/overview", icon: IconLayoutDashboard },
    { label: "Classes", href: "/dashboard/classes", icon: IconClock },
    { label: "Assignments", href: "/dashboard/assignments", icon: IconNotebook },
    { label: "Attendance", href: "/dashboard/attendance", icon: IconCalendar },
    { label: "Messages", href: "/dashboard/messages", icon: IconMessageCircle },
  ],
  student: [
    { label: "Overview", href: "/lms/overview", icon: IconLayoutDashboard },
    { label: "Courses", href: "/lms/courses", icon: IconBook },
    { label: "Classes", href: "/lms/classes", icon: IconClock },
    { label: "Assignments", href: "/lms/assignments", icon: IconNotebook },
    { label: "Messages", href: "/lms/messages", icon: IconMessageCircle },
  ],
  mentor: [
    { label: "Overview", href: "/mentor/overview", icon: IconLayoutDashboard },
    { label: "Classes", href: "/mentor/classes", icon: IconClock },
    { label: "Students", href: "/mentor/students", icon: IconUsers },
    { label: "Messages", href: "/mentor/messages", icon: IconMessageCircle },
    { label: "Earnings", href: "/mentor/earnings", icon: IconCurrencyRupee },
  ],
};

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const items = NAV_ITEMS_BY_ROLE[role] || NAV_ITEMS_BY_ROLE.parent;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E6EBF8] pb-[env(safe-area-inset-bottom)] md:hidden shadow-lg">
      <div className="flex items-center justify-around h-14 px-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-1 min-h-[44px] transition-colors ${
                isActive
                  ? "text-[#2F7FE8]"
                  : "text-[#9BA8C0] hover:text-[#1B3A6B]"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5 stroke-[2]" />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#2F7FE8]" />
                )}
              </div>
              <span className={`text-[10px] font-bold mt-0.5 tracking-tight ${isActive ? "font-extrabold text-[#1B3A6B]" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
