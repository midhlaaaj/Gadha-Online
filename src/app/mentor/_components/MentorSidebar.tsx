"use client";

import Link from "next/link";
import { useSelectedLayoutSegment, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  IconLayoutDashboard, IconVideo, IconClipboardList,
  IconFiles, IconCalendarCheck, IconMessageCircle,
  IconLogout, IconUsers, IconCoin
} from "@tabler/icons-react";

const NAV = [
  { segment: "overview",    label: "Overview",     icon: IconLayoutDashboard },
  { segment: "classes",     label: "Classes",      icon: IconVideo },
  { segment: "students",    label: "Students",     icon: IconUsers },
  { segment: "assignments", label: "Assignments",  icon: IconClipboardList },
  { segment: "resources",   label: "Resources",    icon: IconFiles },
  { segment: "attendance",  label: "Attendance",   icon: IconCalendarCheck },
  { segment: "earnings",    label: "Earnings",     icon: IconCoin },
  { segment: "messages",    label: "Messages",     icon: IconMessageCircle },
];

export function MentorAppSidebar() {
  const activeSegment = useSelectedLayoutSegment();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <aside className="flex flex-col w-[220px] shrink-0 bg-white border-r border-[#E6EBF8] h-screen sticky top-0 z-30">
      {/* Logo */}
      <div className="h-[80px] flex items-center px-6 border-b border-[#E6EBF8] shrink-0">
        <Link href="/mentor/overview" className="font-heading text-2xl font-extrabold tracking-tight text-[#1B3A6B] hover:opacity-90 transition-opacity">
          Tuto<span className="text-[#2F7FE8]">board</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto premium-scrollbar">
        <p className="text-[9px] font-extrabold text-[#9BA8C0] uppercase tracking-widest px-3 mb-3">Tutor Portal</p>
        {NAV.map(({ segment, label, icon: Icon }) => {
          const isActive = activeSegment === segment;
          return (
            <Link
              key={segment}
              href={`/mentor/${segment}`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 ${
                isActive
                  ? "bg-[#EBF2FF] text-[#1B3A6B]"
                  : "text-[#6B7A99] hover:bg-[#F5F7FF] hover:text-[#1B3A6B]"
              }`}
            >
              <Icon
                className={`w-[17px] h-[17px] shrink-0 transition-colors ${
                  isActive ? "text-[#2F7FE8]" : "text-[#9BA8C0]"
                }`}
              />
              {label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#2F7FE8]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-5 border-t border-[#E6EBF8] pt-3">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-[#E24B4A] hover:bg-red-50 transition-all cursor-pointer"
        >
          <IconLogout className="w-[17px] h-[17px]" />
          Logout
        </button>
      </div>
    </aside>
  );
}
