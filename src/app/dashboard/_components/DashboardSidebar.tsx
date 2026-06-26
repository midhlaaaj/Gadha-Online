"use client";

import Link from "next/link";
import { useSelectedLayoutSegment, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  IconLayoutDashboard,
  IconVideo,
  IconCalendarCheck,
  IconClipboardList,
  IconMessageCircle,
  IconLogout,
} from "@tabler/icons-react";

const NAV = [
  { segment: "overview",     label: "Overview",     icon: IconLayoutDashboard },
  { segment: "classes",      label: "Classes",      icon: IconVideo },
  { segment: "attendance",   label: "Attendance",   icon: IconCalendarCheck },
  { segment: "assignments",  label: "Assignments",  icon: IconClipboardList },
  { segment: "messages",     label: "Messages",     icon: IconMessageCircle },
];

export function DashboardSidebar() {
  const activeSegment = useSelectedLayoutSegment();
  const searchParams = useSearchParams();
  const router = useRouter();
  const childId = searchParams.get("child");
  const childParam = childId ? `?child=${childId}` : "";

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
  };

  return (
    <aside className="hidden md:flex w-[220px] shrink-0 sticky top-[70px] h-[calc(100vh-70px)] bg-white border-r border-[#D0DCF5] flex-col justify-between overflow-y-auto premium-scrollbar">
      <div className="p-5 pt-6 space-y-5">
        {/* Label */}
        <div className="px-3">
          <span className="text-[9px] font-extrabold text-[#9BA8C0] uppercase tracking-widest">
            Parent Portal
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5">
          {NAV.map(({ segment, label, icon: Icon }) => {
            const isActive = activeSegment === segment;
            return (
              <Link
                key={segment}
                href={`/dashboard/${segment}${childParam}`}
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
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sign out */}
      <div className="border-t border-[#D0DCF5] p-5">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150 cursor-pointer focus:outline-none"
        >
          <IconLogout className="w-[17px] h-[17px] shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
