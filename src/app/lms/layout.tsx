"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { StudentAppSidebar } from "./_components/StudentSidebar";
import { BottomNav } from "@/components/BottomNav";
import { DashboardMobileTopBar } from "@/components/DashboardMobileTopBar";

export default function StudentDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/lms/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[#F5F7FF] font-sans relative">
      {/* Mobile Top Bar */}
      <DashboardMobileTopBar role="student" />

      {/* Fixed Desktop Left Sidebar */}
      <Suspense fallback={
        <aside className="hidden md:block w-[220px] shrink-0 bg-white border-r border-[#E6EBF8] h-screen">
          <div className="h-[64px] border-b border-[#E6EBF8] px-6 flex items-center">
            <div className="h-8 w-32 animate-shimmer rounded-xl" />
          </div>
          <div className="p-4 space-y-2 pt-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 w-full rounded-xl animate-shimmer" />
            ))}
          </div>
        </aside>
      }>
        <StudentAppSidebar />
      </Suspense>

      {/* Right column: scrollable content only */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pb-16 md:pb-0">
        {/* Scrollable page area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-7 premium-scrollbar">
          <Suspense fallback={null}>
            {children}
          </Suspense>
        </main>
      </div>

      {/* Fixed Mobile Bottom Tab Bar */}
      <BottomNav role="student" />
    </div>
  );
}
