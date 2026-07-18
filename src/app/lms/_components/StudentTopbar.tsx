"use client";

import { useEffect, useState } from "react";
import { IconSearch } from "@tabler/icons-react";
import { getStudentProfile } from "@/app/actions";
import { UserNotificationBell } from "@/components/UserNotificationBell";

type Profile = Awaited<ReturnType<typeof getStudentProfile>>;

export function StudentTopbar() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    getStudentProfile().then(setProfile).catch(() => {});
  }, []);

  return (
    <header className="h-[64px] bg-white border-b border-[#E6EBF8] flex items-center px-6 gap-4 shrink-0 sticky top-0 z-20">
      {/* Search */}
      <div className="flex-1 max-w-sm relative">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9BA8C0]" />
        <input
          type="text"
          placeholder="Search classes, assignments…"
          className="w-full pl-9 pr-4 py-2 text-[12px] bg-[#F5F7FF] border border-[#E6EBF8] rounded-xl outline-none focus:border-[#2F7FE8] transition-colors text-[#1B3A6B] placeholder:text-[#9BA8C0]"
        />
      </div>

      <div className="ml-auto flex items-center gap-5 sm:gap-6">
        {/* Notifications */}
        <UserNotificationBell />

        {/* Avatar */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1B3A6B] to-[#2F7FE8] flex items-center justify-center text-white text-[12px] font-bold shrink-0">
            {profile?.avatarText ?? "S"}
          </div>
          <div className="hidden sm:block">
            <p className="text-[12px] font-bold text-[#1B3A6B] leading-tight">{profile?.name ?? "Student"}</p>
            <p className="text-[10px] text-[#9BA8C0] leading-tight capitalize">{profile?.gradeLevel ?? "Student"}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
